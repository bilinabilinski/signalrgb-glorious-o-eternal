# SignalRGB — Glorious Model O Eternal Wired

## Stan integracji z SignalRGB (2026-10-18)

**UWAGA: mysz jest wykrywana, ale animacje SignalRGB na fizycznych diodach nie działają.** Samo dodanie repozytorium w **Usługach zewnętrznych / Dodatkach** nie instaluje obsługi USB LED. Kod na `main` to diagnostyka pobierania klatek Canvas, bez USB output. Eksperyment z jednorazowym sprzętowym presetem jest w [PR #1](https://github.com/bilinabilinski/signalrgb-glorious-o-eternal/pull/1), a nie na `main`; nie jest to sterownik animacji.

Analiza oficjalnego Glorious CORE: `rgbSync: true` jest flagą modelu, lecz w `MouseOEternalDeviceHandler` znaleziono jedynie zapis konfiguracji profilu HID (raport 5 → odczyt 4 → zapis 4), nie zweryfikowany protokół nietrwałych zmian koloru. Kolor zachowuje się po odłączeniu USB. **Nie wysyłaj raportów konfiguracji w pętli 30/60 FPS.** Postępy śledzimy w [issue #2](https://github.com/bilinabilinski/signalrgb-glorious-o-eternal/issues/2).


**Stan: wersja diagnostyczna v0.4.0. Fizyczne animacje RGB nie działają jeszcze.**

To **osobny projekt** od `signalrgb-tuya-razer-bilina`. Tamto repozytorium nie jest modyfikowane.

## Cel
Płynna obsługa efektów SignalRGB (Rainbow, Wave, Ambilight, muzyka, gry), bez innych aplikacji. Wymaga potwierdzonego polecenia **nietrwałego sterowania RGB na żywo** dla kontrolera myszy.

## Co działa
- Identyfikacja modelu USB `3794:A000`, HID interface 1.
- Pobieranie każdej klatki efektu SignalRGB przez `Render()`.
- Opcjonalne logowanie kolorów Canvas do konsoli.
- Brak jakichkolwiek poleceń USB w tej wersji — bezpieczny punkt wyjścia.

## Co jeszcze NIE działa
- Fizyczna zmiana koloru diod, statyczna lub animowana.
- Mapowanie rzeczywistych stref (w kodzie jeden wirtualny punkt).
- Streaming 30/60 FPS do urządzenia — protokół transmisji nie został potwierdzony.

## Instalacja
1. Zamknij SignalRGB i usuń poprzednie eksperymentalne sterowniki **tego samego modelu** z folderu Plugins.
2. Pobierz plik [Glorious_Model_O_Eternal_Wired.js](./Glorious_Model_O_Eternal_Wired.js).
3. Skopiuj plik do `Dokumenty\WhirlwindFX\Plugins` (albo `OneDrive\Documents\WhirlwindFX\Plugins`, jeśli korzystasz z OneDrive).
4. Uruchom ponownie SignalRGB. Mysz będzie widoczna jako `Glorious Model O Eternal Wired (RGB research)`.
5. Możesz włączyć diagnostyczny podgląd kolorów w konsoli. Diody w tej wersji **nie będą zmieniały koloru**.

## Dlaczego nie wysyłamy danych w każdej klatce?
W [libratbag](https://github.com/libratbag/libratbag/blob/master/data/devices/glorious-model-o-eternal.device) Eternal ma identyfikator 3794:A000 i sterownik Sinowealth, w którym kolory są zapisywane jako RBG. Kod [driver-sinowealth.c](https://github.com/libratbag/libratbag/blob/master/src/driver-sinowealth.c) zmienia kolory przez zapis konfiguracji całej myszy, a nie udokumentowany tryb bezpośredniego streamingu. [gloriousctl](https://github.com/enkore/gloriousctl) ostrzega, że konfiguracja może zapisywać pamięć EEPROM/flash. Nie wolno więc bez potwierdzenia używać tych komend 30/60 razy na sekundę.

## Postęp analizy kodu Glorious CORE

Na podstawie pliku programu Glorious CORE przesłanego prywatnie przez właściciela myszy:
- [PROTOCOL_RESEARCH.md](./PROTOCOL_RESEARCH.md) — zidentyfikowane zbiory HID, raporty 4/5, mapa efektów i format RBG;
- [protocol/eternal_preset.mjs](./protocol/eternal_preset.mjs) — **wyłącznie offline** generator struktury statycznego raportu na podstawie odczytu;
- [protocol/eternal_preset.test.mjs](./protocol/eternal_preset.test.mjs) — test bez kontaktu ze sprzętem.

Generator konfiguracji nie jest streamingowym sterownikiem RGB, nie wysyła USB i nie powinien być wykonywany w pętli animacji. Nie publikujemy kodu źródłowego producenta.

## Kolejny etap
Potrzebna jest wiarygodna dokumentacja formatu pakietu **live RGB** (report ID, interfejs USB, inicjalizacja/handshake i brak zapisu flash). Po jej uzyskaniu dołączymy bezpieczny transport USB do `Render()` z ograniczeniem częstotliwości i pomijaniem zaległych klatek.

API SignalRGB: https://docs.signalrgb.com/developer/plugins/

> Bez dodatkowych aplikacji można używać tej wtyczki, lecz brak dodatkowych aplikacji nie zastępuje wiedzy o protokole sprzętu.
