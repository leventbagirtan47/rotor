"""Rotor arayuz dosyalarini APK'ya gomer.  Kullanim: python assets_guncelle.py ../rotor
(local.js zaten bu projede hazirdir; rotor/static klasorundeki diger dosyalar kopyalanir.)"""
import os, shutil, sys
src = os.path.join(sys.argv[1] if len(sys.argv) > 1 else "../rotor", "static")
dst = os.path.join(os.path.dirname(os.path.abspath(__file__)), "app/src/main/assets/web")
keep = os.path.join(dst, "static", "local.js"); local = open(keep, encoding="utf-8").read() if os.path.exists(keep) else None
shutil.rmtree(dst, ignore_errors=True); os.makedirs(os.path.join(dst, "static"))
for f in os.listdir(src):
    if f in ("admin.html", "sw.js", "index.html"): continue
    shutil.copy(os.path.join(src, f), os.path.join(dst, "static", f))
h = open(os.path.join(src, "index.html"), encoding="utf-8").read()
tag = '<script src="/static/bg.js"></script>'; assert tag in h
open(os.path.join(dst, "index.html"), "w", encoding="utf-8").write(h.replace(tag, '<script src="/static/local.js"></script>' + tag, 1))
if local: open(keep, "w", encoding="utf-8").write(local)
print("assets guncellendi")
