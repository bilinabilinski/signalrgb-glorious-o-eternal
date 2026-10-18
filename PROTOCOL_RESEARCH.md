# Glorious Model O Eternal — confirmed lighting protocol findings

This document contains **independently written interface findings**, not redistributed Glorious CORE source.
Evidence: user-provided, locally extracted `out/main/index.js` from Glorious CORE (October 2026).
The extracted vendor source is **not committed** to this public repository.

## Model identification

- USB VID `0x3794`, PID `0xA000`; product identifier `ModelOEternal`.
- Device description exposes separate HID collections:
  - setData: usage page `0xff01`, usage `0x01`;
  - getData: usage page `0xff02`, usage `0x01`;
  - setData2: usage page `0xff00`, usage `0x01`.
- Glorious CORE device comments associate setData/setData2 with Windows paths under `MI_01` (collections Col03/Col05); do **not** assume these are a sufficient SignalRGB endpoint selection rule across machines.
- Vendor feature `rgbSync: true` is **not evidence** of PC-driven animation support.

## CORE's known sequence for one preset-lighting update

The observed `MouseOEternalDeviceHandler.setLEDs` path:
1. Determine the active device profile (`profileNumber * 16 + 1`, where profileNumber is one based).
2. Send a **6-byte feature report** using report ID `5`, first two bytes `05 <profile>`, on the auxiliary HID write collection.
3. Read a **520-byte HID feature report** using report ID `4` from the main HID write collection.
4. Construct a new **520-byte feature report** by preserving most of the returned configuration and replacing lighting fields.
5. Send the constructed report via **HID feature report ID 4** to the main HID write collection.

This is **read-modify-write configuration**, not a demonstrated volatile RGB stream.

## Report structure as observed for lighting configuration

| Field (absolute byte offset, zero-based) | Value / meaning |
|---|---|
| 0 | Report ID: 4 |
| 1 | Active profile encoded as above |
| 3 | 123 / 0x7b |
| 8 | 100 / 0x64 |
| 53 (= 8 + 45) | RGB effect ID |
| 56 (= 8 + 48) | Static-color brightness/speed encoding |
| 57..59 (= 8 + 49..51) | Static-color channels in **R, B, G** order |
| 61 (= 8 + 53) | Color count for static mode (1) |

Known effect IDs: `GloriousMode=1`, `NormallyOn/static=2`, `Breathing=3`, `Tail=4`, `SeamlessBreathing=5`, `Rave=7`, `Wave=9`, `LEDOff=0`. Other effects have different offsets; never substitute static offsets for them.

The vendor implementation copies 120 bytes from input indices `[7..126]` into output indices `[8..127]` before changing fields. Thus blindly fabricating the report would risk altering unrelated settings.

## Critical findings about animation

- CORE's Eternal handler provides `setPresetLightingEffect` and `setLEDs` as configuration operations.
- The handler sends long feature reports for RGB and reads the current configuration before writing.
- No verified Eternal-specific *volatile / streaming color command* was identified in the extracted main-process bundle.
- No guarantee can be made that repeated configuration writes avoid EEPROM/flash wear. **Do not send config reports from SignalRGB Render() at 30 or 60 FPS.**
- `rgbSync: true` may refer to a CORE feature flag; it does not by itself prove live frame transfer.
- Vendor code saves application profile state after setting lighting; this **alone** does not prove that the mouse persists the config to nonvolatile memory. Persistence still requires a targeted hardware test.

## Next experiment: no extra applications

1. In CORE set a distinctive static color (e.g. purple), and wait for the setting to complete.
2. Quit CORE **fully**, including its tray process; quit SignalRGB as well.
3. Unplug and reconnect the mouse while both apps are closed, and note whether the last color survives. This provides evidence for device-side persistence; it is not a direct test of flash wear.
4. Do not use any experimental high-rate writes; only the official CORE one-time setting is involved.

Even if the color does not survive unplugging, the current report format is *not automatically* safe for 30/60 FPS. We still need volatile report verification or documentation.

## Sources

The offsets and method sequence above are reverse-engineered from the locally supplied Glorious CORE main bundle; this repository intentionally does not publish that bundle. Device family cross-reference: https://github.com/libratbag/libratbag/blob/master/data/devices/glorious-model-o-eternal.device

## Implementation gate

`Glorious_Model_O_Eternal_Wired.js` intentionally has **no USB writes**. Only once an independently validated live-RGB report is available should transport be added, with paced latest-frame-only output and automatic disable on errors.

## Hardware observation — 2026-10-18

User-reported experiment (not independently hardware-verified): after setting static RGB color `#7900FF` in Glorious CORE, fully quitting CORE and SignalRGB, disconnecting USB for 10 seconds, and reconnecting, the mouse **still displayed `#7900FF`**.

Interpretation: strong evidence that the preset is stored in nonvolatile mouse-side storage (or otherwise survives complete USB power interruption). This experiment does **not** determine EEPROM vs flash nor prove that every HID lighting write causes an additional physical write cycle. As a precaution, treat report-ID 4 configuration writes as potentially persistent and **never use them for 30/60 FPS streaming**. Pursue proof of an independent volatile RGB transport.
