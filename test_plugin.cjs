// Optional developer check: node test_plugin.cjs
const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const src = fs.readFileSync(__dirname + '/Glorious_Model_O_Eternal_Wired.js', 'utf8');
const code = src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '');
assert(!/device\.(?:write|send_report|control_transfer|send_feature_report)\s*\(/.test(code), 'USB writes are forbidden in diagnostic mode');
const messages = [];
const ctx = {device:{color:()=>[20,50,100], log:s=>messages.push(s), write:()=>{throw Error('UNSAFE USB WRITE');}, send_report:()=>{throw Error('UNSAFE USB WRITE');}}, LogCanvasPreview:true};
vm.createContext(ctx);
vm.runInContext(src.replace(/export function /g,'function ') + '\nthis.api={VendorId,ProductId,Validate,Initialize,Render,Shutdown};',ctx);
assert.equal(ctx.api.VendorId(),0x3794);
assert.equal(ctx.api.ProductId(),0xA000);
assert.equal(ctx.api.Validate({interface:1}),true);
assert.equal(ctx.api.Validate({interface:0}),false);
ctx.api.Initialize(); for (let i=0;i<250;i++) ctx.api.Render(); ctx.api.Shutdown();
assert(messages.some(m=>m.includes('Canvas preview only: 20,50,100')));
console.log('PASS: VID/PID, HID interface, canvas preview, zero USB writes');
