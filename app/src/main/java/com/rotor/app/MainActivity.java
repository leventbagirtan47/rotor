package com.rotor.app;

import android.app.Activity;
import android.app.AlertDialog;
import android.content.Intent;
import android.graphics.Color;
import android.net.Uri;
import android.os.Bundle;
import android.webkit.JavascriptInterface;
import android.webkit.JsPromptResult;
import android.webkit.JsResult;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.EditText;

import org.json.JSONObject;

import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.Iterator;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

/**
 * Rotor: arayuz APK icine gomulu (assets/web), sunucu yok.
 * Yapay zeka ve ilan sayfasi istekleri JS'ten RotorNative kopruusuyle yapilir.
 */
public class MainActivity extends Activity {
    private static final int FILE_REQ = 1;
    private static final String HOST = "rotor.local";
    private WebView web;
    private ValueCallback<Uri[]> fileCb;
    private final ExecutorService pool = Executors.newFixedThreadPool(4);

    @Override protected void onCreate(Bundle b) {
        super.onCreate(b);
        web = new WebView(this);
        web.setBackgroundColor(Color.parseColor("#05060B"));
        setContentView(web);
        WebSettings s = web.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setAllowFileAccess(false);
        s.setAllowContentAccess(false);
        web.addJavascriptInterface(new Bridge(), "RotorNative");
        web.setWebViewClient(new WebViewClient() {
            @Override public WebResourceResponse shouldInterceptRequest(WebView v, WebResourceRequest r) {
                Uri u = r.getUrl();
                if (!HOST.equals(u.getHost())) return null;
                String p = u.getPath() == null ? "/" : u.getPath();
                String asset = p.equals("/") ? "web/index.html" : p.equals("/gizlilik") ? "web/static/gizlilik.html" : "web" + p;
                if (asset.contains("..")) return notFound();
                try {
                    InputStream in = getAssets().open(asset);
                    return new WebResourceResponse(mime(asset), "utf-8", in);
                } catch (Exception e) { return notFound(); }
            }
            @Override public boolean shouldOverrideUrlLoading(WebView v, WebResourceRequest r) {
                if (HOST.equals(r.getUrl().getHost())) return false;
                try { startActivity(new Intent(Intent.ACTION_VIEW, r.getUrl())); } catch (Exception ignored) {}
                return true;
            }
        });
        web.setWebChromeClient(new WebChromeClient() {
            @Override public boolean onShowFileChooser(WebView w, ValueCallback<Uri[]> cb, FileChooserParams p) {
                if (fileCb != null) fileCb.onReceiveValue(null);
                fileCb = cb;
                try { startActivityForResult(p.createIntent(), FILE_REQ); }
                catch (Exception e) { fileCb = null; return false; }
                return true;
            }
            @Override public boolean onJsAlert(WebView w, String url, String msg, final JsResult r) {
                new AlertDialog.Builder(MainActivity.this).setMessage(msg).setCancelable(false)
                    .setPositiveButton("Tamam", (d, i) -> r.confirm()).show();
                return true;
            }
            @Override public boolean onJsConfirm(WebView w, String url, String msg, final JsResult r) {
                new AlertDialog.Builder(MainActivity.this).setMessage(msg).setCancelable(false)
                    .setPositiveButton("Tamam", (d, i) -> r.confirm()).setNegativeButton("Vazgeç", (d, i) -> r.cancel()).show();
                return true;
            }
            @Override public boolean onJsPrompt(WebView w, String url, String msg, String def, final JsPromptResult r) {
                final EditText et = new EditText(MainActivity.this); et.setText(def);
                new AlertDialog.Builder(MainActivity.this).setMessage(msg).setView(et).setCancelable(false)
                    .setPositiveButton("Tamam", (d, i) -> r.confirm(et.getText().toString())).setNegativeButton("Vazgeç", (d, i) -> r.cancel()).show();
                return true;
            }
        });
        web.loadUrl("https://" + HOST + "/");
    }

    private WebResourceResponse notFound() {
        WebResourceResponse r = new WebResourceResponse("text/plain", "utf-8", new java.io.ByteArrayInputStream(new byte[0]));
        r.setStatusCodeAndReasonPhrase(404, "Not Found");
        return r;
    }

    private static String mime(String f) {
        if (f.endsWith(".html")) return "text/html";
        if (f.endsWith(".js")) return "application/javascript";
        if (f.endsWith(".css")) return "text/css";
        if (f.endsWith(".json")) return "application/json";
        if (f.endsWith(".svg")) return "image/svg+xml";
        if (f.endsWith(".png")) return "image/png";
        return "application/octet-stream";
    }

    /** JS -> internet koprusu (CORS'tan bagimsiz). Sonuc window.__rn(id,status,text,ctype,err) ile doner. */
    private class Bridge {
        @JavascriptInterface public void request(final String id, final String method, final String url, final String headersJson, final String body, final int timeoutMs) {
            pool.execute(() -> {
                int status = 0; String text = "", ctype = "", err = "";
                try {
                    String cur = url; HttpURLConnection c = null;
                    for (int hop = 0; hop < 5; hop++) {
                        if (!cur.startsWith("https://") && !cur.startsWith("http://")) throw new IllegalArgumentException("sema");
                        c = (HttpURLConnection) new URL(cur).openConnection();
                        c.setInstanceFollowRedirects(false);
                        c.setConnectTimeout(timeoutMs); c.setReadTimeout(timeoutMs);
                        c.setRequestMethod(method);
                        JSONObject h = new JSONObject(headersJson);
                        for (Iterator<String> it = h.keys(); it.hasNext();) { String k = it.next(); c.setRequestProperty(k, h.getString(k)); }
                        if (body != null && !body.isEmpty() && !method.equals("GET")) {
                            c.setDoOutput(true);
                            try (OutputStream o = c.getOutputStream()) { o.write(body.getBytes("UTF-8")); }
                        }
                        int code = c.getResponseCode();
                        String loc = c.getHeaderField("Location");
                        if (code >= 300 && code < 400 && loc != null && method.equals("GET")) { cur = new URL(new URL(cur), loc).toString(); c.disconnect(); continue; }
                        break;
                    }
                    status = c.getResponseCode();
                    ctype = c.getContentType() == null ? "" : c.getContentType();
                    String cs = "UTF-8";
                    int ci = ctype.toLowerCase().indexOf("charset=");
                    if (ci >= 0) cs = ctype.substring(ci + 8).replace("\"", "").split(";")[0].trim();
                    InputStream in = status >= 400 ? c.getErrorStream() : c.getInputStream();
                    if (in != null) {
                        ByteArrayOutputStream bo = new ByteArrayOutputStream(); byte[] buf = new byte[8192]; int n;
                        while ((n = in.read(buf)) > 0 && bo.size() < 3000000) bo.write(buf, 0, n);
                        try { text = bo.toString(cs); } catch (Exception e) { text = bo.toString("UTF-8"); }
                    }
                } catch (Exception e) { err = e.getClass().getSimpleName(); }
                final String js = "window.__rn(" + JSONObject.quote(id) + "," + status + "," + JSONObject.quote(text) + "," + JSONObject.quote(ctype) + "," + JSONObject.quote(err) + ")";
                runOnUiThread(() -> web.evaluateJavascript(js, null));
            });
        }
    }

    @Override protected void onActivityResult(int req, int res, Intent data) {
        if (req == FILE_REQ && fileCb != null) {
            fileCb.onReceiveValue(WebChromeClient.FileChooserParams.parseResult(res, data));
            fileCb = null;
        } else super.onActivityResult(req, res, data);
    }

    @Override public void onBackPressed() { if (web.canGoBack()) web.goBack(); else super.onBackPressed(); }
    @Override protected void onDestroy() { pool.shutdownNow(); super.onDestroy(); }
}
