/* Rotor – sohbet arayüzü */
const $ = s => document.querySelector(s), $$ = s => document.querySelectorAll(s);
const root = document.documentElement; root.dataset.t = localStorage.getItem('rth') || 'dark';
let tok = localStorage.getItem('rt') || '', reg = false, files = [], busy = false, mode = 'ilan';
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const J = b => ({ method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(b) });
const COL = ['--b', '--p', '--k', '--o'], SEV = { yüksek: 'y', orta: 'o', düşük: 'd' };

/* tema, menü, giriş */
$$('[data-th]').forEach(b => b.onclick = () => { root.dataset.t = root.dataset.t == 'dark' ? 'light' : 'dark'; localStorage.setItem('rth', root.dataset.t); });
const side = (on) => { $('#side').classList.toggle('open', on); $('#scrim').classList.toggle('on', on); };
$('#menu').onclick = () => side(true); $('#scrim').onclick = () => side(false);
function authUI() { $$('[data-auth]').forEach(b => b.textContent = tok ? 'Çıkış yap' : 'Giriş yap'); }
$$('[data-auth]').forEach(b => b.onclick = () => { if (tok) { tok = ''; localStorage.removeItem('rt'); authUI(); loadHist(); } else $('#dlg').showModal(); });
$('#cl').onclick = () => $('#dlg').close();
$('#sw').onclick = () => { reg = !reg; $('#at').textContent = $('#ab').textContent = reg ? 'Hesap oluştur' : 'Giriş yap'; $('#sw').textContent = reg ? 'Girişe dön' : 'Hesap oluştur'; };
$('#af').onsubmit = async e => { e.preventDefault(); $('#ae').textContent = '';
  try { const d = await api(reg ? 'register' : 'login', J({ email: $('#em').value, password: $('#pw').value })); tok = d.token; localStorage.setItem('rt', tok); authUI(); $('#dlg').close(); loadHist(); }
  catch (x) { $('#ae').textContent = x.message; } };
async function api(p, o = {}) {
  o.headers = { ...(o.headers || {}), Authorization: 'Bearer ' + tok };
  const r = await fetch('/api/' + p, o); let d = {}; try { d = await r.json(); } catch {}
  if (r.status == 401 && p != 'login') { tok = ''; authUI(); $('#dlg').showModal(); }
  if (!r.ok) throw new Error(typeof d.detail == 'string' ? d.detail : 'Girdi hatalı, tekrar deneyin.');
  return d;
}
authUI();

/* parıltı efektleri */
document.addEventListener('pointerdown', e => { const b = e.target.closest('.btn'); if (!b) return;
  const r = b.getBoundingClientRect(), s = Math.max(r.width, r.height) * 2, i = document.createElement('span'); i.className = 'rip';
  i.style.cssText = `width:${s}px;height:${s}px;left:${e.clientX - r.left - s / 2}px;top:${e.clientY - r.top - s / 2}px`; b.append(i); setTimeout(() => i.remove(), 650); });
document.addEventListener('pointermove', e => { const g = e.target.closest('.glass'); if (g) { const r = g.getBoundingClientRect(); g.style.setProperty('--mx', e.clientX - r.left + 'px'); g.style.setProperty('--my', e.clientY - r.top + 'px'); } });
const stg = $('#stage'); stg.onpointermove = e => { const r = stg.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5; $('.car').style.transform = `rotateY(${-14 + x * 22}deg) rotateX(${4 - y * 12}deg)`; };
stg.onpointerleave = () => $('.car').style.transform = '';

/* sonuç çizimleri */
function dial(p) { const col = p >= 70 ? '#35e0a1' : p >= 45 ? '#ff7a1a' : '#ff2e93';
  return `<svg class="dial" data-p="${p}" viewBox="0 0 210 126" role="img" aria-label="Puan ${p} / 100"><path class="arc" d="M17 108A88 88 0 0 1 193 108" stroke="rgba(128,128,160,.25)"/><path class="arc fg" d="M17 108A88 88 0 0 1 17 108" stroke="${col}" style="filter:drop-shadow(0 0 7px ${col})"/><text class="num" x="105" y="100" text-anchor="middle" font-size="44" font-weight="700" fill="currentColor">0</text><text x="105" y="120" text-anchor="middle" font-size="12" fill="var(--mut)">/ 100 puan</text></svg>`; }
function scoreHTML(s, title, col) { return `<div class="res${col ? ' col' : ''}"><div>${title ? `<b>${esc(title)}</b>` : ''}${dial(s.puan)}<div class="warn">${esc(s.not)}</div></div><div>${s.detay.map(i => `<div>${esc(i.kriter)} <span class="tag">${i.puan}/${i.maks}</span><div class="bar"><i style="width:${i.puan / i.maks * 100}%"></i></div>${i.aciklama ? `<small class="mut">${esc(i.aciklama)}</small>` : ''}</div>`).join('')}${s.eksik_veriler.length ? `<div class="warn">Okunamayan / eksik veri: ${s.eksik_veriler.map(esc).join(', ')}</div>` : ''}</div></div>`; }
function gen(v) { if (v == null) return ''; if (typeof v != 'object') return `<p>${esc(v)}</p>`;
  if (Array.isArray(v)) return v.every(x => typeof x != 'object') ? `<ul>${v.map(x => `<li>${esc(x)}</li>`).join('')}</ul>` : v.map(x => `<div class="sub ${SEV[x.siddet] || ''}">${Object.entries(x).map(([a, b]) => `<div><b>${esc(a.replace(/_/g, ' '))}:</b> ${esc(b)}</div>`).join('')}</div>`).join('');
  return Object.entries(v).map(([a, b]) => `<h3>${esc(a.replace(/_/g, ' '))}</h3>${gen(b)}`).join(''); }
function carHead(a, src, f) {
  const tags = [a.marka, a.model, a.yil, a.km != null && a.km.toLocaleString('tr-TR') + ' km', a.yakit, a.sanziman, a.motor].filter(Boolean).map(t => `<span class="tag">${esc(t)}</span>`).join('');
  const lv = { düşük: 0, uygun: 1, yüksek: 2 }[f?.degerlendirme], mc = ['var(--b)', 'var(--ok)', 'var(--k)'][lv ?? 1];
  return `<div class="glass" style="--c:var(--o)"><div>${tags || '<span class="mut">Araç bilgisi okunamadı.</span>'}</div>${a.fiyat ? `<div class="price" style="margin-top:8px">${a.fiyat.toLocaleString('tr-TR')} TL</div>` : ''}${f ? `<div class="meter" style="--mc:${mc}">${['Düşük', 'Uygun', 'Yüksek'].map((_, i) => `<i class="${i === lv ? 'on' : ''}"></i>`).join('')}</div><small class="mut">Yapay zekâ fiyat değerlendirmesi: <b>${esc(f.degerlendirme)}</b> (sayısal piyasa verisi değildir)</small>` : ''}${src ? `<div class="warn">Kaynak: ${esc(src)}</div>` : ''}</div>`; }
function renderOut(r) { let h = '';
  if (r.arac) h += carHead(r.arac, r.kaynak, r.analiz?.fiyat);
  if (r.puanlar) h += `<div class="cmp">${r.puanlar.map((p, i) => `<div class="glass" style="--c:var(${COL[i % 4]})">${scoreHTML(p, p.arac, 1)}</div>`).join('')}</div>`;
  if (r.puanlama) h += `<div class="glass" style="--c:var(--p)">${scoreHTML(r.puanlama)}</div>`;
  if (r.analiz) h += `<div class="glass" style="--c:var(--b)">${gen(r.analiz)}${r.uyari ? `<div class="warn">${esc(r.uyari)}</div>` : ''}</div>`;
  return h; }

/* sohbet */
const AV = document.querySelector('.logo svg').outerHTML;
const typing = t => `<div class="typing"><i></i><i></i><i></i> ${t ? `<span>${esc(t)}</span>` : ''}</div><div class="skel"><i></i><i></i><i></i></div>`;
function scroll() { const c = $('#chat'); c.scrollTo({ top: c.scrollHeight, behavior: 'smooth' }); }
function userMsg(text, imgs) { $('#welcome')?.remove(); const d = document.createElement('div'); d.className = 'msg u';
  d.innerHTML = `<div class="bu">${esc(text).replace(/\n/g, '<br>')}${imgs.length ? '<div>' + imgs.map(f => `<img src="${URL.createObjectURL(f)}" alt="">`).join('') + '</div>' : ''}</div>`; $('#msgs').append(d); scroll(); }
function botMsg(html) { $('#welcome')?.remove(); const d = document.createElement('div'); d.className = 'msg a'; d.innerHTML = `<div class="av">${AV}</div><div class="ba"></div>`; const b = d.querySelector('.ba');
  const o = { set: h => { b.innerHTML = h; scroll(); }, scan: on => b.classList.toggle('scan', on) }; o.set(html); $('#msgs').append(d); scroll(); return o; }
const HELP = `<div class="glass"><p>Bir <b>ilan bağlantısı</b> yapıştırın, ilanı okuyup analiz ederim. İki ile dört bağlantıyı aynı mesajda gönderirseniz karşılaştırırım. 📷 düğmesiyle <b>fotoğraf</b> ekleyip görsel ön inceleme de isteyebilirsiniz.</p><p class="mut">Site otomatik erişimi engellerse ilan metnini kopyalayıp doğrudan buraya yapıştırın.</p></div>`;
let errHTML = m => `<div class="glass" style="--c:var(--k)"><p class="err">${esc(m)}</p></div>`;
async function send() {
  if (busy) return; const text = $('#inp').value.trim(); if (!text && !files.length) return;
  if (!tok) { $('#dlg').showModal(); return; }
  const urls = [...new Set(text.match(/https?:\/\/[^\s]+/g) || [])], imgs = files.slice();
  userMsg(text, imgs); $('#inp').value = ''; files = []; prev(); grow(); busy = true; $('#send').disabled = true;
  const b = botMsg(typing('Hazırlanıyor…')); b.scan(true);
  try {
    if (imgs.length) { b.set(typing(mode == 'ilan' ? 'İlan görüntüden okunuyor…' : 'Fotoğraflar taranıyor…')); const fd = new FormData(); imgs.forEach(f => fd.append('files', f)); fd.append('bilgi', text);
      b.set(renderOut(await api(mode == 'ilan' ? 'screenshot' : 'photos', { method: 'POST', body: fd }))); }
    else if (text.length >= 250 && text.replace(/https?:\/\/\S+/g, ' ').trim().length >= 200) { b.set(typing('İlan metni analiz ediliyor…')); b.set(renderOut(await api('link', J({ metin: text.slice(0, 12000) })))); }
    else if (urls.length > 4) b.set(errHTML('En fazla 4 bağlantı karşılaştırabilirim.'));
    else if (urls.length >= 2) { const cars = [];
      for (let i = 0; i < urls.length; i++) { b.set(typing(`İlan ${i + 1}/${urls.length} okunuyor…`)); cars.push((await api('link', J({ url: urls[i] }))).arac); }
      b.set(typing('Karşılaştırılıyor…')); b.set(renderOut(await api('compare', J(cars)))); }
    else if (urls.length == 1) { b.set(typing('İlan okunuyor ve analiz ediliyor…')); b.set(renderOut(await api('link', J({ url: urls[0] })))); }
    else await chatReply(text, b);
  } catch (x) { b.set(errHTML(x.message)); }
  b.scan(false); busy = false; $('#send').disabled = false; loadHist();
}
$('#send').onclick = send;
$('#inp').onkeydown = e => { if (e.key == 'Enter' && !e.shiftKey && innerWidth > 820) { e.preventDefault(); send(); } };
function grow() { const t = $('#inp'); t.style.height = 'auto'; t.style.height = Math.min(t.scrollHeight, 140) + 'px'; }
$('#inp').oninput = grow;
function prev() { $('#modes').classList.toggle('hid', !files.length); $('#prev').innerHTML = ''; files.forEach((f, i) => { const d = document.createElement('div'); d.innerHTML = `<img src="${URL.createObjectURL(f)}" alt=""><button aria-label="Kaldır">×</button>`; d.querySelector('button').onclick = () => { files.splice(i, 1); prev(); }; $('#prev').append(d); }); }
$('#ph').onchange = e => { files = [...files, ...e.target.files].slice(0, 6); e.target.value = ''; prev(); $('#inp').placeholder = 'İsterseniz bir not yazın…'; };
$$('.chip').forEach(c => c.onclick = () => { const k = c.dataset.ex;
  if (k == 'foto' || k == 'ss') { setMode(k == 'ss' ? 'ilan' : 'foto'); $('#ph').click(); } else { $('#inp').placeholder = k == 'kars' ? 'İki ilan bağlantısını alt alta yapıştırın…' : 'İlan bağlantısını yapıştırın…'; $('#inp').focus(); } });
$('#newc').onclick = () => location.reload();

/* geçmiş */
async function loadHist() { const h = $('#hist');
  if (!tok) { h.innerHTML = '<p class="mut">Giriş yapınca analizleriniz burada görünür.</p>'; return; }
  try { const q = ($('#hq') && $('#hq').value || '').trim(), l = await api('history' + (q ? '?q=' + encodeURIComponent(q) : ''));
    h.innerHTML = l.length ? '' : '<p class="mut">' + (q ? 'Sonuç bulunamadı.' : 'Henüz analiz yok.') + '</p>';
    l.forEach(x => { const w = rowOf(x.title, () => { side(false); $('#msgs').innerHTML = ''; botMsg(renderOut(x.output)); },
      async () => { try { await api('history/' + x.id, { method: 'DELETE' }); } catch {} loadHist(); }); w.firstChild.title = new Date(x.ts * 1000).toLocaleString('tr-TR'); h.append(w); });
  } catch { h.innerHTML = '<p class="mut">Geçmiş yüklenemedi.</p>'; } }
loadHist();

function setMode(m) { mode = m; $$('#modes .chip').forEach(c => c.classList.toggle('on', c.dataset.m == m)); }
$$('#modes .chip').forEach(c => c.onclick = () => setMode(c.dataset.m));

let ctx = null, chatHist = [];
const _ro = renderOut;
renderOut = r => { if (r.arac) ctx = { arac: r.arac, puan: r.puanlama && r.puanlama.puan, analiz: r.analiz }; else if (r.puanlar) ctx = { karsilastirma: r.puanlar.map(p => ({ arac: p.arac, puan: p.puan })) }; return _ro(r); };
const chatHTML = t => '<div class="glass" style="--c:var(--b)">' + esc(t).split(/\n{2,}/).map(p => '<p>' + p.replace(/\*\*(.+?)\*\*/g, '<b>$1</b>').replace(/\n/g, '<br>') + '</p>').join('') + '</div>';
async function chatReply(text, b) {
  chatHist.push({ rol: 'user', metin: text }); chatHist = chatHist.slice(-12);
  try { const r = await api('chat', J({ mesajlar: chatHist, baglam: ctx })); chatHist.push({ rol: 'assistant', metin: r.yanit }); b.set(chatHTML(r.yanit)); }
  catch (x) { chatHist.pop(); b.set(errHTML(x.message)); }
}

/* --- sohbet ozellikleri: oneri dugmeleri, kopyala, yeniden uret, baslangic sorulari --- */
const START = ['\u0130lk araba al\u0131rken nelere dikkat etmeliyim?', 'Dizel mi benzinli mi almal\u0131y\u0131m?', 'Ekspertizde nelere bak\u0131l\u0131r?', 'Kilometre hilesi nas\u0131l anla\u015f\u0131l\u0131r?', 'Hangi ara\xe7 s\u0131n\u0131f\u0131 bana uygun?', 'Pazarl\u0131kta nas\u0131l davranmal\u0131y\u0131m?'];
const CAR_Q = ['En b\xfcy\xfck riskler neler?', 'Pazarl\u0131k pay\u0131 var m\u0131?', 'Bu ara\xe7ta kronik sorunlar neler?', 'Ekspertizde nelere bakmal\u0131y\u0131m?', 'Sat\u0131c\u0131ya hangi sorular\u0131 sormal\u0131y\u0131m?', 'Uzun vadede masraf\u0131 nas\u0131l olur?', 'Alternatif olarak hangi ara\xe7lara bakmal\u0131y\u0131m?'];
const replies = []; let lastUser = '';
const pick = () => (ctx ? CAR_Q : START).filter(q => q !== lastUser).sort(() => Math.random() - .5).slice(0, 3);
const qBtns = qs => qs.map(q => '<button class="chip act" data-q="' + esc(q) + '">' + esc(q) + '</button>').join('');
async function chatReply(text, b) {
  lastUser = text;
  chatHist.push({ rol: 'user', metin: text }); chatHist = chatHist.slice(-12);
  try {
    const r = await api('chat', J({ mesajlar: chatHist, baglam: ctx }));
    chatHist.push({ rol: 'assistant', metin: r.yanit }); replies.push(r.yanit);
    b.set(chatHTML(r.yanit) + '<div class="acts"><button class="act" data-act="copy" data-i="' + (replies.length - 1) + '">Kopyala</button><button class="act" data-act="regen">Yeniden \xfcret</button></div><div class="acts">' + qBtns(pick()) + '</div>');
  } catch (x) { chatHist.pop(); b.set(errHTML(x.message)); }
}
document.addEventListener('click', async e => {
  const t = e.target.closest('.act'); if (!t) return;
  if (t.dataset.q) { if (busy) return; $('#inp').value = t.dataset.q; grow(); send(); return; }
  if (t.dataset.act == 'copy') {
    try { await navigator.clipboard.writeText(replies[+t.dataset.i]); t.textContent = 'Kopyaland\u0131 \u2713'; } catch { t.textContent = 'Kopyalanamad\u0131'; }
    setTimeout(() => t.textContent = 'Kopyala', 1500); return;
  }
  if (t.dataset.act == 'regen' && !busy && lastUser && chatHist.length >= 2 && chatHist[chatHist.length - 1].rol == 'assistant') {
    chatHist.pop(); chatHist.pop(); busy = true; $('#send').disabled = true;
    const b = botMsg(typing('Yeniden yaz\u0131l\u0131yor\u2026')); b.scan(true);
    await chatReply(lastUser, b); b.scan(false); busy = false; $('#send').disabled = false;
  }
});
(function () { const w = $('#welcome'); if (!w) return; const d = document.createElement('div'); d.className = 'chips'; d.innerHTML = qBtns(START.slice().sort(() => Math.random() - .5).slice(0, 3)); w.append(d); })();
$('#inp').placeholder = 'Bir \u015fey sorun ya da ilan ba\u011flant\u0131s\u0131 yap\u0131\u015ft\u0131r\u0131n\u2026';

/* --- akan yanit: sohbet yaniti yazildikca ekrana gelir --- */
async function chatReply(text, b) {
  if (typeof lastUser !== 'undefined') lastUser = text;
  chatHist.push({ rol: 'user', metin: text }); chatHist = chatHist.slice(-12);
  let acc = '';
  try {
    const resp = await fetch('/api/chat-stream', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + tok }, body: JSON.stringify({ mesajlar: chatHist, baglam: ctx }) });
    if (!resp.ok) {
      let d = {}; try { d = await resp.json(); } catch {}
      if (resp.status == 401) { tok = ''; authUI(); $('#dlg').showModal(); }
      throw new Error(typeof d.detail == 'string' ? d.detail : 'Hata (' + resp.status + ')');
    }
    const rd = resp.body.getReader(), dec = new TextDecoder(); let buf = '';
    for (;;) {
      const { done, value } = await rd.read(); if (done) break;
      buf += dec.decode(value, { stream: true });
      let i;
      while ((i = buf.indexOf('\n')) >= 0) {
        const ln = buf.slice(0, i); buf = buf.slice(i + 1); if (!ln.trim()) continue;
        const o = JSON.parse(ln); if (o.e) throw new Error(o.e);
        acc += o.t; b.set(chatHTML(acc));
      }
    }
    if (!acc.trim()) throw new Error('Bo\u015f yan\u0131t geldi. Tekrar deneyin.');
    chatHist.push({ rol: 'assistant', metin: acc });
    let extra = '';
    if (typeof replies !== 'undefined' && typeof qBtns === 'function') {
      replies.push(acc);
      extra = '<div class="acts"><button class="act" data-act="copy" data-i="' + (replies.length - 1) + '">Kopyala</button><button class="act" data-act="regen">Yeniden \xfcret</button></div><div class="acts">' + qBtns(pick()) + '</div>';
    }
    b.set(chatHTML(acc) + extra);
  } catch (x) { chatHist.pop(); b.set(errHTML(x.message)); }
}

/* === ozellik paketi: arac araclari, favoriler, sohbet gecmisi, fiyat kiyasi, sesle yazma, yazdir === */
const LS = (k, d) => { try { const v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v; } catch { return d; } };
let LSset = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };
const TOOLS = [
  ['Pazarl\u0131k mesaj\u0131', 'Bu ilan i\xe7in pazarl\u0131k stratejisi haz\u0131rla: makul bir hedef fiyat aral\u0131\u011f\u0131 (varsay\u0131mlar\u0131n\u0131 ve belirsizli\u011fi belirt, canl\u0131 piyasa verin yok), kullanabilece\u011fim 3 arg\xfcman ve sat\u0131c\u0131ya g\xf6nderece\u011fim k\u0131sa bir WhatsApp mesaj\u0131 yaz.'],
  ['Sat\u0131c\u0131ya sorular', 'Bu ara\xe7 i\xe7in sat\u0131c\u0131ya sormam gereken sorular\u0131 \xf6ncelik s\u0131ras\u0131yla listele (ge\xe7mi\u015f, bak\u0131m, hasar, belgeler, neden satt\u0131\u011f\u0131 gibi).'],
  ['Ekspertiz listesi', 'Bu ara\xe7 i\xe7in ekspertizde veya serviste \xf6zellikle bakt\u0131rmam gereken noktalar\u0131n kontrol listesini yaz (motor, \u015fanz\u0131man, kaporta, elektronik).'],
  ['Doland\u0131r\u0131c\u0131l\u0131k kontrol\xfc', 'Bu ilanda doland\u0131r\u0131c\u0131l\u0131k veya aldatmaya i\u015faret edebilecek \u015f\xfcpheli noktalar var m\u0131? Bilgi eksikse neye dikkat etmem gerekti\u011fini s\xf6yle, kesin su\xe7lama yapma.'],
  ['Y\u0131ll\u0131k masraf', 'Bu ara\xe7 i\xe7in y\u0131ll\u0131k yakla\u015f\u0131k masraf tahmini yap: y\u0131ll\u0131k 15.000 km varsay; yak\u0131t, bak\u0131m, sigorta ve vergi i\xe7in varsay\u0131mlar\u0131n\u0131 a\xe7\u0131k\xe7a yaz ve kesin rakam yerine aral\u0131k ver.']
];
const PRE = {}; TOOLS.forEach(t => PRE[t[1]] = t[0]);
const _um = userMsg; userMsg = (t, im) => _um(PRE[t] || t, im);
const toolsRow = () => '<div class="acts">' + TOOLS.map((t, i) => '<button class="act" data-tool="' + i + '">' + esc(t[0]) + '</button>').join('') + '</div>';

/* fiyat kiyasi (kullanicinin girdigi ilanlar) */
function priceCmp(r) {
  const a = (r.araclar || []).map((c, i) => ({ n: [c.marka, c.model, c.yil].filter(Boolean).join(' ') || 'Ara\xe7 ' + (i + 1), p: c.fiyat })).filter(c => c.p);
  if (a.length < 2) return '';
  const avg = a.reduce((s, c) => s + c.p, 0) / a.length, mx = Math.max(...a.map(c => c.p)) * 1.1;
  const rows = a.map(c => { const d = Math.round((c.p / avg - 1) * 100); return '<div style="margin:8px 0">' + esc(c.n) + ' <span class="tag">' + c.p.toLocaleString('tr-TR') + ' TL</span> <span class="tag">ortalamaya g\xf6re ' + (d >= 0 ? '+' : '') + d + '%</span><div class="bar"><i style="width:' + (c.p / mx * 100) + '%"></i></div></div>'; }).join('');
  return '<div class="glass" style="--c:var(--o)"><b>Fiyat k\u0131yas\u0131</b> <span class="tag">girdi\u011finiz ' + a.length + ' ilana g\xf6re</span>' + rows + '<div class="warn">Ortalama: ' + Math.round(avg).toLocaleString('tr-TR') + ' TL. Bu, yaln\u0131zca ekledi\u011finiz ilanlar\u0131n k\u0131yas\u0131d\u0131r, piyasa ortalamas\u0131 de\u011fildir. Ayn\u0131 marka, model ve y\u0131ldaki ilanlarda anlaml\u0131d\u0131r.</div></div>';
}
const pend = [], _ro3 = renderOut;
renderOut = r => {
  let h = _ro3(r);
  if (r.arac && r.puanlama) { pend.push(r); h += '<div class="acts"><button class="act" data-fav="' + (pend.length - 1) + '">\u2605 Favorilere ekle</button><button class="act" data-print="1">Raporu yazd\u0131r / PDF</button></div>' + toolsRow(); }
  else if (r.puanlar) h = priceCmp(r) + h + '<div class="acts"><button class="act" data-print="1">Raporu yazd\u0131r / PDF</button></div>';
  return h;
};

/* kenar cubugu: sohbetlerim + favoriler */
(function () {
  const mk = (t, id) => { const h = document.createElement('div'); h.className = 'hl'; h.textContent = t; const d = document.createElement('div'); d.className = 'hist'; d.id = id; d.style.cssText = 'flex:none;max-height:22vh'; return [h, d]; };
  const [h1, d1] = mk('Sohbetlerim', 'lchats'), [h2, d2] = mk('Favoriler', 'favs'); $('#newc').after(h1, d1, h2, d2);
})();
function rowOf(label, onOpen, onDel) {
  const w = document.createElement('div'); w.className = 'row2';
  const a = document.createElement('button'); a.className = 'hi'; a.textContent = label; a.title = label; a.onclick = onOpen;
  const x = document.createElement('button'); x.className = 'hi x'; x.textContent = '\xd7'; x.setAttribute('aria-label', 'Sil'); x.onclick = onDel; w.append(a, x); return w;
}
let favs = LS('rfav', []);
const favTitle = f => [f.arac.marka, f.arac.model, f.arac.yil].filter(Boolean).join(' ') || '\u0130lan';
function renderFavs() {
  const d = $('#favs'); d.innerHTML = favs.length ? '' : '<p class="mut">Hen\xfcz favori yok.</p>';
  favs.slice().sort((a, b) => b.puanlama.puan - a.puanlama.puan).forEach(f => d.append(rowOf('\u2605 ' + f.puanlama.puan + ' \xb7 ' + favTitle(f) + (f.arac.fiyat ? ' \xb7 ' + f.arac.fiyat.toLocaleString('tr-TR') + ' TL' : ''),
    () => { side(false); $('#msgs').innerHTML = ''; chatHist = []; ctx = { arac: f.arac, puan: f.puanlama.puan, analiz: f.analiz }; botMsg(renderOut(f)); },
    () => { favs = favs.filter(x => x.id !== f.id); LSset('rfav', favs); renderFavs(); })));
}
let cid = 'c' + Date.now(), saveT = null;
function renderChats() {
  const d = $('#lchats'), l = LS('rchats', []); d.innerHTML = l.length ? '' : '<p class="mut">Sohbetleriniz bu taray\u0131c\u0131da saklan\u0131r.</p>';
  l.forEach(c => d.append(rowOf(c.title, () => { side(false); cid = c.id; $('#msgs').innerHTML = c.html; chatHist = c.hist || []; ctx = c.ctx || null; },
    () => { LSset('rchats', LS('rchats', []).filter(x => x.id !== c.id)); renderChats(); })));
}
function saveChat() {
  if (busy) return; const m = $('#msgs'); if (!m.querySelector('.msg.u')) return;
  const c = m.cloneNode(true); c.querySelectorAll('.acts,img,.typing').forEach(n => n.remove()); c.querySelectorAll('.scan').forEach(n => n.classList.remove('scan'));
  const html = c.innerHTML; if (html.length > 400000) return;
  const f = m.querySelector('.msg.u .bu'), title = ((f ? f.textContent : '') || 'Sohbet').trim().slice(0, 40) || 'Sohbet';
  const l = LS('rchats', []).filter(x => x.id !== cid); l.unshift({ id: cid, title, html, hist: chatHist, ctx, ts: Date.now() }); LSset('rchats', l.slice(0, 20)); renderChats();
}
new MutationObserver(() => { clearTimeout(saveT); saveT = setTimeout(saveChat, 1500); }).observe($('#msgs'), { childList: true, subtree: true });
renderFavs(); renderChats();

/* tiklamalar: arac araclari, favori, yazdir */
document.addEventListener('click', e => {
  const t = e.target.closest('[data-fav],[data-print],[data-tool]'); if (!t) return;
  if (t.dataset.print) { window.print(); return; }
  if (t.dataset.tool != null) { if (busy) return; $('#inp').value = TOOLS[+t.dataset.tool][1]; grow(); send(); return; }
  const r = pend[+t.dataset.fav]; if (!r) return;
  if (favs.length >= 30) { t.textContent = 'Favori listesi dolu (30)'; return; }
  favs = favs.filter(f => f.kaynak !== r.kaynak || favTitle(f) !== favTitle(r)); favs.unshift({ ...r, id: Date.now() }); LSset('rfav', favs); renderFavs(); t.textContent = '\u2605 Favorilerde';
});

/* sesle yazma (destekleyen tarayicilarda) */
(function () {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition; if (!SR) return;
  const b = document.createElement('button'); b.type = 'button'; b.className = 'ib'; b.title = 'Sesle yaz'; b.setAttribute('aria-label', 'Sesle yaz');
  b.innerHTML = '<svg viewBox="0 0 24 24"><rect x="9" y="3" width="6" height="11" rx="3" fill="none" stroke="currentColor" stroke-width="1.7"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>';
  $('#send').before(b); let rec = null, on = false;
  const off = () => { on = false; b.style.color = ''; };
  b.onclick = () => {
    if (on) { rec.stop(); return; }
    rec = new SR(); rec.lang = 'tr-TR'; rec.interimResults = true; rec.continuous = false; const base = $('#inp').value;
    rec.onresult = ev => { $('#inp').value = (base + ' ' + [...ev.results].map(x => x[0].transcript).join(' ')).trim(); grow(); };
    rec.onend = off; rec.onerror = off; rec.start(); on = true; b.style.color = 'var(--k)';
  };
})();

/* --- eksikler: gercek cikis, kullanim gostergesi, baglanti hatasi yonlendirmesi --- */
async function refreshUsage() {
  let el = $('#usage');
  if (!el) { el = document.createElement('p'); el.id = 'usage'; el.className = 'mut'; el.style.margin = '0 6px'; $('.foot').before(el); }
  if (!tok) { el.textContent = ''; return; }
  try { const u = await api('usage'); el.textContent = 'Bug\xfcn: ' + u.kullanilan + ' / ' + u.limit + ' istek'; } catch { el.textContent = ''; }
}
const _lh = loadHist;
loadHist = function () { refreshUsage(); return _lh.apply(this, arguments); };
$$('[data-auth]').forEach(b => b.onclick = async () => {
  if (tok) { try { await fetch('/api/logout', { method: 'POST', headers: { Authorization: 'Bearer ' + tok } }); } catch {} tok = ''; localStorage.removeItem('rt'); ['rfav', 'rchats', 'rts_rfav', 'rts_rchats'].forEach(k => localStorage.removeItem(k)); location.reload(); }
  else $('#dlg').showModal();
});
const _eh = errHTML;
errHTML = m => _eh(m) + (/yap\u0131\u015ft\u0131r|engelliyor|okunabilir/i.test(m) ? '<div class="acts"><button class="act" data-shot="1">Ekran g\xf6r\xfcnt\xfcs\xfc y\xfckle</button></div><p class="mut">veya ilan metnini kopyalay\u0131p buraya yap\u0131\u015ft\u0131r\u0131n.</p>' : '');
document.addEventListener('click', e => { const t = e.target.closest('[data-shot]'); if (!t) return; if (typeof setMode == 'function') setMode('ilan'); $('#ph').click(); });
refreshUsage();

/* === son paket: hesaba bagli kayit, bilgi duzeltme, animasyonlu kadran, animasyon azaltma === */
const SK = ['rfav', 'rchats'], JP = b => ({ method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(b) });
let syncedTok = '', syncT = {};
const _LSset = LSset;
LSset = (k, v) => {
  _LSset(k, v);
  if (!SK.includes(k)) return;
  const ts = Date.now(); try { localStorage.setItem('rts_' + k, ts); } catch {}
  if (tok) { clearTimeout(syncT[k]); syncT[k] = setTimeout(() => api('sync/' + k, JP({ data: v, ts })).catch(() => {}), 1200); }
};
async function pullSync() {
  if (!tok) return;
  for (const k of SK) {
    try {
      const s = await api('sync/' + k), lt = +localStorage.getItem('rts_' + k) || 0;
      if (s.data && s.ts > lt) { _LSset(k, s.data); localStorage.setItem('rts_' + k, s.ts); }
      else if (lt > s.ts) await api('sync/' + k, JP({ data: LS(k, []), ts: lt }));
    } catch {}
  }
  favs = LS('rfav', []); renderFavs(); renderChats();
}
const _lh2 = loadHist;
loadHist = function () { if (tok && syncedTok !== tok) { syncedTok = tok; pullSync(); } return _lh2.apply(this, arguments); };

const fsel = (n, l, o, v) => '<label>' + l + '<select name="' + n + '">' + o.map(x => '<option value="' + x[0] + '"' + (x[0] === v ? ' selected' : '') + '>' + x[1] + '</option>').join('') + '</select></label>';
const fixForm = (i, a) => '<div class="glass hid" id="fix-' + i + '" style="--c:var(--b)"><b>Bilgileri d\xfczelt</b><p class="mut">Yapay zek\xe2n\u0131n yanl\u0131\u015f okudu\u011fu ya da bulamad\u0131\u011f\u0131 bilgileri girin. Puan, yapay zek\xe2 \xe7a\u011fr\u0131s\u0131 yap\u0131lmadan an\u0131nda yeniden hesaplan\u0131r.</p><div class="grid2">' +
  [['yil', 'Model y\u0131l\u0131', a.yil], ['km', 'Kilometre', a.km], ['fiyat', '\u0130lan fiyat\u0131 (TL)', a.fiyat], ['referans_fiyat', 'Benzer ilanlar\u0131n ortalamas\u0131 (TL)', a.referans_fiyat], ['sahip', 'Sahip say\u0131s\u0131', a.sahip], ['boyali', 'Boyalı parça sayısı', a.boyali], ['degisen', 'Değişen parça sayısı', a.degisen], ['tramer', 'Tramer toplamı (TL)', a.tramer]].map(f => '<label>' + f[1] + '<input name="' + f[0] + '" type="number" min="0" value="' + (f[2] ?? '') + '"></label>').join('') +
  fsel('hasar', 'Hasar kayd\u0131', [['bilinmiyor', 'Bilinmiyor'], ['yok', 'Yok'], ['var', 'Var']], a.hasar) + fsel('bakim', 'Bak\u0131m ge\xe7mi\u015fi', [['bilinmiyor', 'Bilinmiyor'], ['tam', 'Tam'], ['kismi', 'K\u0131smi'], ['yok', 'Yok']], a.bakim) +
  '</div><div class="row3"><button class="btn pri" data-fixgo="' + i + '">Yeniden puanla</button><span class="mut" id="fixmsg-' + i + '"></span></div></div>';
const _ro4 = renderOut;
renderOut = r => {
  const n = pend.length, h = _ro4(r);
  if (!(r.arac && r.puanlama && pend.length > n)) return h;
  const i = pend.length - 1;
  return h.replace('Raporu yazd\u0131r / PDF</button></div>', 'Raporu yazd\u0131r / PDF</button><button class="act" data-fix="' + i + '">Bilgileri d\xfczelt</button></div>' + fixForm(i, r.arac));
};
document.addEventListener('click', async e => {
  const t = e.target.closest('[data-fix],[data-fixgo]'); if (!t) return;
  if (t.dataset.fix != null) { $('#fix-' + t.dataset.fix).classList.toggle('hid'); return; }
  const i = +t.dataset.fixgo, box = $('#fix-' + i), r = pend[i], msg = $('#fixmsg-' + i); if (!r) return;
  const o = { ...r.arac };
  box.querySelectorAll('input,select').forEach(x => { if (x.name && x.value !== '') o[x.name] = x.type == 'number' ? +x.value : x.value; });
  try {
    const s = await api('score', J(o)); r.arac = o; r.puanlama = s;
    const ba = box.closest('.ba');
    ba.querySelector('.glass').outerHTML = carHead(o, r.kaynak, r.analiz && r.analiz.fiyat);
    ba.querySelector('.dial').closest('.glass').innerHTML = scoreHTML(s);
    ctx = { arac: o, puan: s.puan, analiz: r.analiz }; msg.textContent = 'G\xfcncellendi: ' + s.puan + ' / 100';
  } catch (x) { msg.textContent = x.message; }
});

function animateDials(root) {
  root.querySelectorAll('.dial[data-p]:not([data-d])').forEach(s => {
    s.dataset.d = 1; const p = +s.dataset.p, fg = s.querySelector('.fg'), num = s.querySelector('.num'), t0 = performance.now();
    const step = now => {
      const k = document.documentElement.dataset.rm ? 1 : Math.min(1, (now - t0) / 1100), v = p * (1 - Math.pow(1 - k, 3)), a = Math.PI * Math.min(v, 100) / 100;
      fg.setAttribute('d', 'M17 108A88 88 0 0 1 ' + (105 - 88 * Math.cos(a)) + ' ' + (108 - 88 * Math.sin(a))); num.textContent = Math.round(v);
      if (k < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  });
}
new MutationObserver(() => animateDials($('#msgs'))).observe($('#msgs'), { childList: true, subtree: true });
(function () {
  const root = document.documentElement, b = document.createElement('button'); b.className = 'btn'; b.id = 'rmbtn';
  const apply = on => { if (on) root.dataset.rm = '1'; else delete root.dataset.rm; b.textContent = 'Animasyonlar\u0131 azalt: ' + (on ? 'a\xe7\u0131k' : 'kapal\u0131'); };
  apply(localStorage.getItem('rrm') === '1');
  b.onclick = () => { const on = !root.dataset.rm; try { localStorage.setItem('rrm', on ? '1' : '0'); } catch {} apply(on); };
  $('.foot').prepend(b);
})();

if (tok) { syncedTok = tok; pullSync(); }


/* === v3 paketi: gecmis arama, favori karsilastirma, masraf hesabi, ekspertiz listesi, medyan fiyat, hesap, PWA === */
let hqT = null; $('#hq').oninput = () => { clearTimeout(hqT); hqT = setTimeout(() => loadHist(), 300); };
const TL = n => Math.round(n).toLocaleString('tr-TR') + ' TL';
let panelN = 0;

/* arac sonucuna ek dugmeler + medyan yardimcisi */
const _ro5 = renderOut;
renderOut = r => {
  const n = pend.length; let h = _ro5(r);
  if (!(r.arac && r.puanlama && pend.length > n)) return h; const i = pend.length - 1;
  h = h.replace('Raporu yazdır / PDF</button>', 'Raporu yazdır / PDF</button><button class="act" data-copysum="' + i + '">Özeti kopyala</button><button class="act" data-cost="' + i + '">Yıllık masraf hesapla</button><button class="act" data-check="1">Ekspertiz kontrol listesi</button>');
  h = h.replace('<div class="row3"><button class="btn pri" data-fixgo="' + i + '">', '<div class="row3"><input data-med placeholder="Benzer ilan fiyatları: 450000, 480000, 520000" style="flex:1;min-width:180px"><button class="btn" type="button" data-medgo="' + i + '">Medyanı al</button><button class="btn pri" data-fixgo="' + i + '">');
  return h;
};

/* kopyala, medyan, masraf, kontrol listesi */
const CHECK = ['Şasi numarası belgeyle ve araç üzerindeki etiketle uyuşuyor', 'Ruhsat, plaka ve satıcı bilgileri tutarlı', 'Tramer / hasar sorgusu yapıldı', 'Boya kalınlığı ölçüldü (panel panel)', 'Kaporta aralıkları ve kapı hizaları simetrik',
  'Alt takım, şase ve podyumda pas / ezik / kaynak izi yok', 'Motor soğukken ilk çalıştırma sorunsuz, duman yok', 'Yağ / antifriz sızıntısı yok, yağ rengi normal', 'Şanzıman geçişleri sarsıntısız, debriyaj / kavrama normal',
  'Direksiyon, fren ve süspansiyon kontrol edildi (test sürüşü)', 'Lastik diş derinliği ve aşınma düzgün', 'Klima, cam, elektronik ve uyarı lambaları çalışıyor', 'Kilometre, servis kayıtlarıyla ve iç mekân aşınmasıyla uyumlu', 'Bakım faturaları / yetkili servis geçmişi görüldü', 'Bağımsız ekspertiz raporu alındı', 'Noter satış / ödeme yöntemi güvenli (takasbank, kapora yok)'];
document.addEventListener('click', async e => {
  const t = e.target.closest('[data-copysum],[data-medgo],[data-cost],[data-check],[data-costgo],[data-favcmp]'); if (!t) return;
  const d = t.dataset;
  if (d.copysum != null) { const r = pend[+d.copysum], a = r.arac, an = r.analiz || {};
    const tx = [favTitle(r) + (a.fiyat ? ' - ' + TL(a.fiyat) : ''), 'Rotor puanı: ' + r.puanlama.puan + '/100', an.ozet, an.dezavantajlar && an.dezavantajlar.length ? 'Dikkat: ' + an.dezavantajlar.join('; ') : ''].filter(Boolean).join('\n');
    try { await navigator.clipboard.writeText(tx); t.textContent = 'Kopyalandı ✓'; } catch { t.textContent = 'Kopyalanamadı'; } return; }
  if (d.medgo != null) { const box = $('#fix-' + d.medgo), v = box.querySelector('[data-med]').value.split(/[\s,;]+/).map(x => +x.replace(/\./g, '')).filter(x => x > 0).sort((a, b) => a - b);
    if (v.length < 2) { $('#fixmsg-' + d.medgo).textContent = 'En az 2 fiyat girin.'; return; }
    const m = v.length % 2 ? v[(v.length - 1) / 2] : (v[v.length / 2 - 1] + v[v.length / 2]) / 2;
    box.querySelector('[name=referans_fiyat]').value = Math.round(m); $('#fixmsg-' + d.medgo).textContent = 'Medyan: ' + TL(m) + ' (' + v.length + ' ilan). "Yeniden puanla"ya basın.'; return; }
  if (d.check != null) { const id = 'ck' + (++panelN);
    botMsg('<div class="glass" style="--c:var(--ok)" id="' + id + '"><b>Ekspertiz / alım kontrol listesi</b>' + CHECK.map((c, i) => '<label class="ck"><input type="checkbox" data-ck="' + id + '"> ' + esc(c) + '</label>').join('') +
      '<div class="warn" id="' + id + 'n">0 / ' + CHECK.length + ' tamamlandı</div><div class="acts"><button class="act" data-print="1">Yazdır / PDF</button></div></div>'); return; }
  if (d.cost != null) { const r = pend[+d.cost], id = 'co' + (++panelN), f = (n, l, ph, v) => '<label>' + l + '<input type="number" min="0" step="any" name="' + n + '" placeholder="' + ph + '"' + (v ? ' value="' + v + '"' : '') + '></label>';
    botMsg('<div class="glass" style="--c:var(--o)" id="' + id + '"><b>Yıllık sahip olma maliyeti</b><p class="mut">Rakamları kendi bilginize göre girin; Rotor tahmin uydurmaz.</p><div class="fgrid">' +
      f('yillik_km', 'Yıllık km', '15000', 15000) + f('tuketim', 'Tüketim (lt/100 km) *', 'örn. 7') + f('yakit_fiyati', 'Yakıt fiyatı (TL/lt) *', 'güncel fiyat') + f('mtv', 'MTV (yıllık)', '0') + f('sigorta', 'Trafik sigortası', '0') + f('kasko', 'Kasko', '0') + f('bakim', 'Bakım / onarım', '0') + f('muayene', 'Muayene', '0') + f('deger_kaybi_yuzde', 'Yıllık değer kaybı %', '10', 10) +
      '</div><input type="hidden" name="fiyat" value="' + (r.arac.fiyat || '') + '"><div class="row3"><button class="btn pri" data-costgo="' + id + '">Hesapla</button><span class="mut" id="' + id + 'o"></span></div></div>'); return; }
  if (d.costgo) { const box = $('#' + d.costgo), o = {}; if (busy) return;
    box.querySelectorAll('input').forEach(x => { if (x.value !== '') o[x.name] = +x.value; });
    if (!o.tuketim || !o.yakit_fiyati) { $('#' + d.costgo + 'o').textContent = 'Tüketim ve yakıt fiyatı gerekli.'; return; }
    try { const r = await api('cost', J(o)); $('#' + d.costgo + 'o').innerHTML = '';
      box.querySelector('.res2')?.remove();
      box.insertAdjacentHTML('beforeend', '<div class="res2"><table class="tbl">' + r.kalemler.filter(k => k.tutar).map(k => '<tr><td>' + esc(k.ad) + '</td><td>' + TL(k.tutar) + '</td></tr>').join('') + '<tr><th>Yıllık toplam</th><th>' + TL(r.yillik) + '</th></tr><tr><td>Aylık</td><td>' + TL(r.aylik) + '</td></tr>' + (r.km_basi ? '<tr><td>Km başına</td><td>' + r.km_basi.toLocaleString('tr-TR') + ' TL</td></tr>' : '') + '</table><div class="warn">' + esc(r.not) + '</div></div>');
    } catch (x) { $('#' + d.costgo + 'o').textContent = x.message; } return; }
});
document.addEventListener('change', e => { const c = e.target.closest('[data-ck]'); if (!c) return; const id = c.dataset.ck, all = $$('[data-ck="' + id + '"]'); $('#' + id + 'n').textContent = [...all].filter(x => x.checked).length + ' / ' + all.length + ' tamamlandı'; });

/* favorileri secip karsilastir */
const favSel = new Set(), _rf = renderFavs;
renderFavs = function () {
  _rf(); const d = $('#favs'); if (!d) return;
  const sorted = favs.slice().sort((a, b) => b.puanlama.puan - a.puanlama.puan);
  d.querySelectorAll('.row2').forEach((w, i) => { const f = sorted[i]; if (!f) return; const c = document.createElement('input'); c.type = 'checkbox'; c.className = 'fcb'; c.checked = favSel.has(f.id); c.setAttribute('aria-label', 'Karşılaştırmaya ekle');
    c.onchange = () => { c.checked ? favSel.add(f.id) : favSel.delete(f.id); }; w.prepend(c); });
  if (favs.length >= 2) { const b = document.createElement('button'); b.className = 'btn'; b.dataset.favcmp = 1; b.textContent = 'Seçilenleri karşılaştır (2-4)'; d.append(b); }
};
document.addEventListener('click', async e => {
  if (!e.target.closest('[data-favcmp]') || busy) return;
  const sel = favs.filter(f => favSel.has(f.id)); if (sel.length < 2 || sel.length > 4) { alert('Karşılaştırmak için 2 ile 4 favori işaretleyin.'); return; }
  if (!tok) { $('#dlg').showModal(); return; } side(false); $('#welcome')?.remove();
  busy = true; const b = botMsg(typing('Favoriler karşılaştırılıyor…')); b.scan(true);
  try { b.set(renderOut(await api('compare', J(sel.map(f => f.arac))))); } catch (x) { b.set(errHTML(x.message)); }
  b.scan(false); busy = false;
});
renderFavs();

/* hesap: sifre degistir / hesabi sil */
(function () {
  const foot = $('.foot'), pw = document.createElement('button'), del = document.createElement('button');
  pw.className = del.className = 'btn'; pw.textContent = 'Şifre değiştir'; del.textContent = 'Hesabımı sil'; pw.dataset.acct = del.dataset.acct = 1;
  pw.onclick = async () => { const o = prompt('Mevcut şifreniz:'); if (!o) return; const n = prompt('Yeni şifre (en az 8 karakter):'); if (!n) return;
    try { await api('password', J({ old: o, new: n })); alert('Şifre değiştirildi. Diğer cihazlardaki oturumlar kapatıldı.'); } catch (x) { alert(x.message); } };
  del.onclick = async () => { if (!confirm('Hesabınız, geçmişiniz ve kayıtlarınız kalıcı olarak silinecek. Devam edilsin mi?')) return; const p = prompt('Onay için şifreniz:'); if (!p) return;
    try { await api('account/delete', J({ password: p })); localStorage.clear(); location.reload(); } catch (x) { alert(x.message); } };
  foot.prepend(del); foot.prepend(pw);
  const show = () => [pw, del].forEach(b => b.classList.toggle('hid', !tok)); show();
  const _au = authUI; authUI = function () { _au(); show(); };
})();

/* PWA */
if ('serviceWorker' in navigator) addEventListener('load', () => navigator.serviceWorker.register('/sw.js').catch(() => {}));


/* === ilan sayfasindan tek tikla metin aktarma (yer imi) === */
const BM_CODE = "(async()=>{const t=(document.body.innerText||document.body.textContent||'').replace(/https?:\\/\\/\\S+/g,' ').replace(/\\s+/g,' ').trim().slice(0,12000);let ok=false;try{await navigator.clipboard.writeText(t);ok=true}catch(e){try{const a=document.createElement('textarea');a.value=t;document.body.append(a);a.select();ok=document.execCommand('copy');a.remove()}catch(e2){}}alert(ok?'Rotor: sayfa metni kopyalandı. Rotor sekmesine dönüp yapıştırın (Ctrl+V) ve gönderin.':'Kopyalanamadı. Metni elle seçip kopyalayın.')})();";
const BM_HREF = 'javascript:' + encodeURIComponent(BM_CODE);
const _eh2 = errHTML;
errHTML = m => _eh2(m) + (/engelliyor|okunabilir|yapıştır/i.test(m) ? '<div class="glass" style="--c:var(--o)"><b>Kolay yol: yer imi</b><p class="mut">Bu düğmeyi <b>yer imleri çubuğuna sürükleyin</b>. İlan sayfasını kendi tarayıcınızda açıp yer imine tıklayın, sayfa metni kopyalanır. Rotor\'a gelip yapıştırın ve gönderin.</p><a class="btn pri bmk" href="' + BM_HREF + '">📋 Rotor\'a kopyala</a></div>' : '');
document.addEventListener('click', e => { const a = e.target.closest('a.bmk'); if (a) { e.preventDefault(); alert('Bu düğmeyi tıklamayın: fare ile yer imleri çubuğuna sürükleyip bırakın. Sonra ilan sayfasındayken ona tıklayın.'); } });
(function () { const a = document.createElement('a'); a.className = 'btn bmk'; a.href = BM_HREF; a.textContent = '📋 Rotor\'a kopyala (yer imi)'; a.title = 'Yer imleri çubuğuna sürükleyin'; a.style.textDecoration = 'none'; a.style.textAlign = 'center'; $('.foot').prepend(a); })();
