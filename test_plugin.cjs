const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync(__dirname + '/Glorious_Model_O_Eternal_Wired.js','utf8').replace(/export function /g,'function ');
function run({apply=false, reportValid=true, bothEndpoints=true, repeat=2}={}) {
  const calls=[];
  const device={
    log:m=>calls.push(['log',String(m)]),
    set_endpoint:(...values)=>calls.push(['endpoint',...values]),
    send_report:(bytes,size)=>calls.push(['send',size,Array.from(bytes)]),
    pause:n=>calls.push(['pause',n]),
    get_report:()=>{calls.push(['read']);const b=Array(520).fill(0);b[0]=reportValid?4:0;return b;}
  };
  const context={device,EternalPreset:'Static',EternalColor:'#7900FF',
    EternalBrightness:100,EternalSpeed:'Medium',EternalProfile:'1',EternalApplyOnce:apply};
  vm.createContext(context);
  vm.runInContext(source+';this.api={VendorId,ProductId,Validate,Initialize,Render,Shutdown}',context);
  const ep={interface:1,usage:1,usage_page:0xff01,collection:3};
  assert.equal(context.api.Validate(ep),true);
  assert.equal(context.api.Validate({interface:0,usage:1,usage_page:0xff01,collection:3}),false);
  if(bothEndpoints) context.api.Validate({interface:1,usage:1,usage_page:0xff00,collection:5});
  assert.equal(context.api.VendorId(),0x3794);
  assert.equal(context.api.ProductId(),0xa000);
  context.api.Initialize();
  context.EternalApplyOnce=false; context.api.Render(); // arm only after observing OFF
  context.EternalApplyOnce=apply;
  for(let i=0;i<repeat;i++)context.api.Render();
  context.api.Shutdown();
  return calls;
}
// ON already persisted at startup must not trigger a write until OFF -> ON.
const persistedOn=run({apply:true,repeat:0});
assert.equal(persistedOn.filter(e=>e[0]==='send').length,0);
const off=run({apply:false});
assert.equal(off.filter(e=>e[0]==='send').length,0,'off: USB must be silent');
const good=run({apply:true});
const writes=good.filter(e=>e[0]==='send');
assert.deepEqual(writes.map(e=>e[1]),[6,520],'exactly two one-shot manufacturer reports');
assert.deepEqual(writes[0][2],[5,17,0,0,0,0],'profile select packet');
const packet=writes[1][2];
assert.deepEqual(packet.slice(57,60),[121,255,0],'RGB color is RBG on the wire');
assert.equal(packet[53],2,'static effect ID');
assert.equal(packet[56],0x42,'100% brightness + medium speed');
assert.equal(packet[61],1,'one color');
assert.equal(good.filter(e=>e[0]==='read').length,1,'one HID read');
const bad=run({apply:true,reportValid:false});
assert.deepEqual(bad.filter(e=>e[0]==='send').map(e=>e[1]),[6],
 'invalid readback: no 520-byte config write');
const noAux=run({apply:true,bothEndpoints:false});
assert.equal(noAux.filter(e=>e[0]==='send').length,0,'both endpoints required');
console.log('PASS simulated HID: correct model, manual-only, readback guard, RBG, one-shot limit');
