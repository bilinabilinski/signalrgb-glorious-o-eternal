/*
 * Glorious Model O Eternal Wired (3794:A000) — SignalRGB v0.3.0
 * CANVAS DIAGNOSTIC ONLY. No physical USB RGB control.
 *
 * Sinowealth known RGB operations can write persistent configuration.
 * Do not send configuration reports from Render() at 30/60 FPS.
 *
 * Separate project from Tuya/Battletron.
 */
export function Name() { return "Glorious Model O Eternal Wired (RGB research)"; }
export function Publisher() { return "bilinabilinski"; }
export function VendorId() { return 0x3794; }
export function ProductId() { return 0xA000; }
export function Type() { return "hid"; }
export function DeviceType() { return "mouse"; }
export function Size() { return [3, 3]; }
export function DefaultPosition() { return [225, 120]; }
export function DefaultScale() { return 15.0; }
export function LedNames() { return ["RGB preview - USB output disabled"]; }
export function LedPositions() { return [[1, 1]]; }

// Do not claim the normal pointer interface.
export function Validate(endpoint) { return endpoint.interface === 1; }

export function ControllableParameters() {
    return [{
        property: "LogCanvasPreview",
        group: "lighting",
        label: "Loguj kolory Canvas (bez sterowania mysza)",
        type: "boolean",
        default: false
    }];
}

let frameCount = 0;
let lastLogged = "";

export function Initialize() {
    frameCount = 0;
    lastLogged = "";
    device.log("Model O Eternal: SignalRGB Canvas preview ready. Physical RGB output is DISABLED.");
}

export function Render() {
    // Live SignalRGB effect frame is available, but the mouse's safe
    // non-persistent RGB transport protocol is still unknown.
    const color = device.color(1, 1);
    if (!color || color.length < 3) return;
    const rgb = [clamp(color[0]), clamp(color[1]), clamp(color[2])];
    frameCount++;
    if (LogCanvasPreview && frameCount % 120 === 0) {
        const value = rgb.join(",");
        if (value !== lastLogged) {
            device.log("Canvas preview only: " + value);
            lastLogged = value;
        }
    }
}

export function Shutdown() {
    // Never change RGB, DPI, macros, firmware, or USB state.
}
function clamp(x) {
    const n = Number(x);
    return Number.isFinite(n) ? Math.max(0, Math.min(255, Math.round(n))) : 0;
}
