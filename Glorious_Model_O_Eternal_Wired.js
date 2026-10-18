/*
 * Glorious Model O Eternal Wired — SignalRGB 0.4.0
 * USB VID:PID = 3794:A000. Experimental animation pipeline.
 * IMPORTANT: USB transport is explicitly disabled.
 *
 * No persistent config writes or unverified RGB packets are emitted.
 * This prepares a paced, change-detecting animation output path for
 * a FUTURE verified volatile-RGB protocol.
 */
export function Name() { return "Glorious Model O Eternal Wired (RGB research v0.4)"; }
export function Publisher() { return "bilinabilinski"; }
export function VendorId() { return 0x3794; }
export function ProductId() { return 0xA000; }
export function Type() { return "hid"; }
export function DeviceType() { return "mouse"; }
export function Size() { return [3, 3]; }
export function DefaultPosition() { return [225, 120]; }
export function DefaultScale() { return 15.0; }
export function LedNames() { return ["Eternal RGB preview (USB disabled)"]; }
export function LedPositions() { return [[1, 1]]; }

// Interface may vary across firmware/Windows HID enumerations.
// Match the HID collection only in test builds after verifying endpoints.
export function Validate(endpoint) { return endpoint.interface === 1; }

export function ControllableParameters() {
    return [
        {
            property: "EternalPreview",
            group: "lighting",
            label: "Loguj wybrane klatki animacji (USB wylaczone)",
            type: "boolean",
            default: false
        },
        {
            property: "EternalRate",
            group: "lighting",
            label: "Docelowe FPS po potwierdzeniu protokolu",
            type: "combobox",
            values: ["10", "20", "30", "60"],
            default: "30"
        }
    ];
}

// Strict boundary: hardware transport is absent, not a guessed HID command.
const LIVE_RGB_PROTOCOL_VERIFIED = false;
const MIN_RGB_CHANGE = 1;
const PREVIEW_LOG_EVERY = 90;
let queued = null;
let lastCommitted = null;
let frameCounter = 0;
let acceptedFrames = 0;
let suppressedFrames = 0;
let deliveredFrames = 0;
let logCounter = 0;

function clamp(value) {
    const n = Number(value);
    return Number.isFinite(n) ? Math.max(0, Math.min(255, Math.round(n))) : 0;
}
function changed(a, b) {
    if (!a || !b) return true;
    return Math.max(Math.abs(a[0] - b[0]), Math.abs(a[1] - b[1]), Math.abs(a[2] - b[2])) >= MIN_RGB_CHANGE;
}
function currentFps() {
    const rate = Number(EternalRate);
    return [10, 20, 30, 60].includes(rate) ? rate : 30;
}
function transportVolatileRgb(rgb) {
    // DO NOT REPLACE WITH Sinowealth config feature writes.
    // Only implement this function after a verified, NON-PERSISTENT
    // live-RGB report with matching 3794:A000 firmware is documented.
    return false;
}
export function Initialize() {
    queued = null;
    lastCommitted = null;
    frameCounter = acceptedFrames = suppressedFrames = deliveredFrames = logCounter = 0;
    device.log("Eternal v0.4: animation staging active, USB disabled; no mouse LEDs will change.");
}
export function Render() {
    const color = device.color(1, 1);
    if (!color || color.length < 3) return;
    const rgb = [clamp(color[0]), clamp(color[1]), clamp(color[2])];
    frameCounter++;
    // Keep only the newest frame. No backlog.
    queued = rgb;
    // This counter-based pacing is approximate and depends on SignalRGB's
    // render callback cadence (commonly ~60 FPS). Never claim exact timing.
    const interval = Math.max(1, Math.round(60 / currentFps()));
    if (frameCounter % interval !== 0) return;
    if (!changed(queued, lastCommitted)) {
        suppressedFrames++;
        return;
    }
    lastCommitted = queued.slice();
    acceptedFrames++;
    if (LIVE_RGB_PROTOCOL_VERIFIED && transportVolatileRgb(queued)) {
        deliveredFrames++;
    }
    logCounter++;
    if (EternalPreview && logCounter % PREVIEW_LOG_EVERY === 0) {
        device.log("RGB preview " + queued.join(",") +
          " | sampled=" + frameCounter + " | staged=" + acceptedFrames +
          " | unchanged=" + suppressedFrames + " | USB sent=" + deliveredFrames);
    }
}
export function Shutdown() {
    device.log("Eternal v0.4 stopped; USB sent=" + deliveredFrames + " (expected 0)");
}
