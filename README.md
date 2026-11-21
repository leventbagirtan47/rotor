# Rotor - Android uygulamasi (sunucusuz APK)

Bu uygulama tek basina calisir: bilgisayar, sunucu veya adres gerekmez.
Arayuz ve butun mantik (puanlama, ilan okuma, gecmis, favoriler, masraf hesabi) APK'nin icindedir.
Yapay zeka cagrilari telefondan dogrudan Google Gemini veya Anthropic Claude'a, SIZIN anahtarinizla yapilir.

## Kullanim
1. Ilk acilista cikan pencereye yapay zeka anahtarinizi yazin (Gemini icin ucretsiz anahtar: aistudio.google.com/apikey).
   Anahtar yalnizca bu telefonda saklanir. Sonradan degistirmek icin kenar cubugundaki "Yapay zeka anahtari" dugmesi.
2. Ilan linki, ilan metni, ekran goruntusu veya fotograf gonderin.
Hesap/giris yoktur; gecmis ve favoriler bu telefonda tutulur (uygulamayi silerseniz gider).

## APK'yi bulutta olusturma (Android Studio kurmadan)
1. github.com'da ucretsiz hesap acin, sag ustten **New repository** ile bos bir depo olusturun (Private secebilirsiniz).
2. Depoda **uploading an existing file** baglantisina tiklayin. Bu klasorun **icindeki** her seyi (build.gradle, app, gradle, .github klasoru dahil) surukleyip birakin ve **Commit changes** deyin.
   (`.github` klasoru gorunmuyorsa Dosya Gezgini'nde Gorunum > Goster > Gizli ogeler secenegini acin.)
3. Depoda **Actions** sekmesine girin. "APK olustur" calismaya baslar (5-10 dk). Baslamazsa soldan "APK olustur" > **Run workflow**.
4. Bitince calismaya tiklayin, en altta **Artifacts** bolumunden **Rotor-APK** dosyasini indirin (zip icinden app-debug.apk cikar).
5. APK'yi telefona atip kurun ("bilinmeyen kaynaklardan yukleme" izni gerekir).
Hata verirse Actions'taki kirmizi adimin cikti yazisini iletin.

## Alternatif: Android Studio ile (bir kez)
1. https://developer.android.com/studio adresinden Android Studio'yu kurun.
2. Android Studio > Open > bu `rotor_android` klasorunu secin (ilk acilista gerekli dosyalari indirir, internet gerekir).
3. Build > Build Bundle(s) / APK(s) > Build APK(s).
4. "locate" yazisina tiklayin: `app/build/outputs/apk/debug/app-debug.apk` -> telefona atip kurun
   (telefonda "bilinmeyen kaynaklardan yukleme" iznini verin).

## Rotor arayuzunu guncellediginizde
`python assets_guncelle.py ../rotor` komutu yeni arayuz dosyalarini APK'ya gomer, sonra APK'yi yeniden olusturun.

## Notlar
- Internet gerekir (yapay zeka ve ilan sayfalari icin).
- Bazi ilan siteleri uygulamadan gelen istegi de engelleyebilir (403); o zaman ilan metnini yapistirin veya ekran goruntusu yukleyin.
- Bu proje yazim sirasinda Android Studio'da derlenmemistir; derleme hatasi cikarsa hata mesajini iletin.

## Surum notlari (v3)
- Varsayilan Gemini modeli `gemini-3.1-flash-lite` yapildi (`gemini-2.5-flash` yeni hesaplara kapatilmis olabiliyor). Anahtar penceresinden model adini degistirebilirsiniz.
- Gizlilik metni sunucusuz uygulamaya gore yeniden yazildi.
- GitHub Actions ile bulutta APK derleme eklendi (`.github/workflows/apk.yml`).
