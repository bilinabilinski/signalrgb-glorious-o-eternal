/*
 * Model O Eternal Wired — SignalRGB experimental v0.5
 * User-initiated ONE-SHOT onboard lighting preset.
 *
 * NOT a streaming animation driver. Glorious CORE config reports
 * appear to persist after USB power loss. NEVER send these writes
 * from a 30/60 FPS animation loop.
 *
 * Tested with simulated HID only, not on a physical Eternal.
 */
export function Name() { return "Glorious Model O Eternal (CORE preset EXPERIMENT)"; }
export function Publisher() { return "bilinabilinski"; }
export function VendorId() { return 0x3794; }
export function ProductId() { return 0xA000; }
export function Type() { return "Hid"; }
export function DeviceType() { return "mouse"; }
export function Size() { return [3, 3]; }
export function DefaultPosition() { return [225, 120]; }
export function DefaultScale() { return 15; }
export function LedNames() { return ["Onboard preset (not live RGB)"]; }
export function LedPositions() { return [[1, 1]]; }
// Close CORE completely first. Never share its HID connection with SignalRGB.
export function ConflictingProcesses() { return ["Glorious Core.exe"]; }

const endpoints = {};
const EFFECTS = { "Static": 2, "Breathing": 3, "Wave": 9, "Glorious Mode": 1, "Off": 0 };
let attempted = false;
let armedAfterOff = false;

export function Validate(ep) {
    const valid = ep.interface === 1 && ep.usage === 1 &&
        (ep.usage_page === 0xff01 || ep.usage_page === 0xff00);
    if (valid) endpoints[ep.usage_page] = ep.collection == null ? 0 : ep.collection;
    return valid;
}

export function ControllableParameters() {
    return [
        { property:"EternalPreset", group:"lighting", label:"Efekt sprzetowy (nie SignalRGB)",
          type:"combobox", values:["Static", "Breathing", "Wave", "Glorious Mode", "Off"], default:"Static" },
        { property:"EternalColor", group:"lighting", label:"Kolor stalego efektu", type:"color", default:"7900ff" },
        { property:"EternalBrightness", group:"lighting", label:"Jasnosc", type:"number",
          min:"0", max:"100", step:"1", default:"100" },
        { property:"EternalSpeed", group:"lighting", label:"Predkosc efektu", type:"combobox",
          values:["Slow", "Medium", "Fast"], default:"Medium" },
        { property:"EternalProfile", group:"lighting", label:"Profil sprzetowy", type:"combobox",
          values:["1", "2", "3"], default:"1" },
        { property:"EternalApplyOnce", group:"lighting",
          label:"ZAPISZ RAZ (konfiguracja myszy, restart by ponowic)", type:"boolean", default:false }
    ];
}

function selectEndpoint(page) {
    if (!Object.prototype.hasOwnProperty.call(endpoints, page)) {
        throw new Error("Missing expected HID collection 0x" + page.toString(16));
    }
    device.set_endpoint(1, 1, page, endpoints[page]);
}
function encodeColor(text) {
    const found = /^#?([0-9a-f]{6})$/i.exec(String(text));
    if (!found) throw new Error("Invalid RGB hex");
    return [parseInt(found[1].slice(0,2),16), parseInt(found[1].slice(2,4),16), parseInt(found[1].slice(4,6),16)];
}
function clampBrightness(value) {
    const n = Number(value);
    if (!Number.isFinite(n) || n < 0 || n > 100) throw new Error("Invalid brightness");
    return n < 20 ? 0 : n <= 40 ? 1 : n <= 60 ? 2 : n <= 80 ? 3 : 4;
}
function encodedSpeed(value) {
    const map = { Slow:1, Medium:2, Fast:3 };
    if (map[value] == null) throw new Error("Invalid preset speed");
    return map[value];
}
function getProfileId(value) {
    const p = Number(value);
    if (![1,2,3].includes(p)) throw new Error("Invalid hardware profile");
    return 16*p + 1;
}
function buildReport(readback, profileId) {
    if (!readback || readback.length !== 520 || readback[0] !== 4) {
        throw new Error("Invalid 520-byte feature report 0x04; no write performed");
    }
    // The manufacturer uses read-modify-write. Copy the profile config
    // from input indices 7..126 to output indices 8..127.
    const packet = Array(520).fill(0);
    for (let i=0;i<120;i++) packet[8+i] = readback[7+i];
    packet[0]=4;
    packet[1]=profileId;
    packet[3]=0x7b;
    packet[8]=100;
    const mode = String(EternalPreset);
    if (!Object.prototype.hasOwnProperty.call(EFFECTS, mode)) throw new Error("Invalid lighting effect");
    packet[53] = EFFECTS[mode];
    const packed = (clampBrightness(EternalBrightness)<<4) | encodedSpeed(EternalSpeed);
    if (mode === "Static") {
        const rgb=encodeColor(EternalColor);
        packet[56]=packed;
        // The Eternal accepts RBG, not ordinary RGB.
        packet[57]=rgb[0]; packet[58]=rgb[2]; packet[59]=rgb[1];
        packet[61]=1;
    } else if (mode === "Breathing") {
        const rgb=encodeColor(EternalColor);
        packet[60]=packed; // 8 + 52
        packet[62]=rgb[0]; packet[63]=rgb[2]; packet[64]=rgb[1]; // 8 + 54
        packet[61]=1; // 8 + 53
    } else if (mode === "Wave") packet[124]=packed; // 8 + 116
    else if (mode === "Glorious Mode") packet[54]=packed; // 8 + 46
    return packet;
}

export function Initialize() {
    attempted=false;
    armedAfterOff=false;
    device.log("Eternal v0.5: hardware preset available ONLY after manual Apply. No PC-driven RGB streaming.");
}
export function Render() {
    // Render never sends data unless the user explicitly toggles Apply.
    // A process-wide one-shot prevents writes on every frame.
    if (!EternalApplyOnce) { armedAfterOff=true; return; }
    if (!armedAfterOff || attempted) return; // no auto-write on restart with saved ON
    attempted=true; // set BEFORE any USB action; never auto retry
    try {
        // Force parameter validation before issuing any USB traffic.
        const p=getProfileId(EternalProfile);
        if (!Object.prototype.hasOwnProperty.call(EFFECTS, String(EternalPreset))) throw new Error("Invalid mode");
        clampBrightness(EternalBrightness); encodedSpeed(EternalSpeed);
        if (EternalPreset === "Static" || EternalPreset === "Breathing") encodeColor(EternalColor);
        if (!Object.prototype.hasOwnProperty.call(endpoints, 0xff00) ||
            !Object.prototype.hasOwnProperty.call(endpoints, 0xff01))
            throw new Error("Both CORE HID collections are required (ff00 and ff01)");

        // Manufacturer sequence: 6-byte report 05 on ff00, then read
        // report 04 from ff01, then ONE write of modified report 04.
        selectEndpoint(0xff00);
        device.send_report([5,p,0,0,0,0],6);
        device.pause(30);
        selectEndpoint(0xff01);
        const readback=device.get_report([4],520);
        const packet=buildReport(readback,p);
        device.send_report(packet,520);
        device.log("ONE manufacturer-style preset write attempted. Check mouse LED; NOT synchronized with SignalRGB effects.");
    } catch (err) {
        device.log("Eternal safe abort: " + (err && err.message ? err.message : String(err)));
    }
}
export function Shutdown() { /* Do not touch mouse on exit. */ }
