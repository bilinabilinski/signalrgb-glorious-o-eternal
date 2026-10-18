# SignalRGB — Glorious Model O Eternal Wired

**Status: eksperymentalna obsługa sprzętowych efektów RGB (jednorazowy zapis), NIE animacje SignalRGB na żywo.**

Projekt jest **całkowicie oddzielny** od `signalrgb-tuya-razer-bilina`. Nie modyfikujemy wtyczki Battletron/Tuya.

## Co zostało ustalone z pliku Glorious CORE
- VID/PID: `3794:A000`.
- HID: `MI_01`, kolekcje o usage page `ff00` i `ff01`.
- Glorious CORE wysyła 6 bajtów na kolekcji pomocniczej (raport 5), odczytuje bieżącą konfigurację (raport 4, 520 bajtów) i odsyła zmienioną konfigurację (raport 4, 520 bajtów).
- Statyczny kolor ma kolejność bajtów **RBG**.
- Po ustawieniu przez CORE koloru `#7900FF` i odłączeniu myszy na 10 sekund kolor pozostał — przemawia to za trwałym zapisem konfiguracji.

**Nie mamy zweryfikowanego protokołu nietrwałego RGB streaming.** Ciągłe przesyłanie raportu 4 z `Render()` mogłoby zużywać pamięć myszy. Dlatego wtyczka **nigdy tego nie robi**.

## Eksperymentalny sterownik v0.5

`Glorious_Model_O_Eternal_Wired.js` umie:
- rozpoznać odpowiednie kolekcje HID i identyfikator urządzenia,
- przygotować jeden raport zgodny ze znalezioną procedurą Glorious CORE,
- zastosować jeden raz z wyraźnym przełącznikiem, **nigdy w pętli animacji**,
- przerwać zapis, jeśli brakuje kolekcji lub odczyt konfiguracji jest nieprawidłowy.

Tryby `Static`, `Breathing`, `Wave`, `Glorious Mode`, `Off` to **efekty wbudowane w mysz**, nie efekty SignalRGB.

## Instalacja / eksperyment

**Ten sterownik nie był jeszcze uruchomiony na fizycznej myszy. Ryzyko błędu sprzętowego lub zmiany ustawień istnieje.** Zostaw w tej chwili wersję z głównej gałęzi, jeśli nie chcesz brać udziału w kontrolowanym eksperymencie.

1. Zamknij Glorious CORE **także w zasobniku systemowym** i SignalRGB.
2. Usuń starsze eksperymentalne sterowniki Glorious z folderu użytkownika `Dokumenty\WhirlwindFX\Plugins`, aby nie było konfliktu o `3794:A000`.
3. Pobierz `Glorious_Model_O_Eternal_Wired.js` z **gałęzi eksperymentalnej** i skopiuj go do tego folderu.
4. Uruchom SignalRGB. W ustawieniach Glorious wyświetli się `CORE preset EXPERIMENT`.
5. Ustaw `Static`, kolor `7900ff`, profil `1`, a następnie świadomie przełącz `ZAPISZ RAZ` na włączone. Zapis zostanie podjęty tylko **jeden raz na uruchomienie**.
6. Sprawdź fizyczny kolor i logi urządzenia, w szczególności `Eternal safe abort` lub `ONE manufacturer-style preset write attempted`. Drugi komunikat oznacza próbę wysłania, **nie potwierdza działania diod**.

Po teście wyłącz `ZAPISZ RAZ`, aby ustawienie nie spowodowało kolejnej próby po ponownym uruchomieniu.

## Sprawdzenie kodu bez myszy
```sh
node test_plugin.cjs
node protocol/eternal_preset.test.mjs
```

## Dlaczego nadal nie ma Rainbow/Ambilight SignalRGB?
Te efekty wymagają sterowania kolorem wielu razy na sekundę. Udokumentowane raporty w CORE są poleceniami konfiguracji profilu, a nie zweryfikowanymi raportami RAM-only. Możliwość uruchamiania natywnych efektów sprzętowych nie jest równoznaczna z synchronizacją z efektami SignalRGB.

Zobacz [szczegółowe odkrycia HID](./PROTOCOL_RESEARCH.md).

Źródło API: https://docs.signalrgb.com/developer/plugins/writes-and-reads/
