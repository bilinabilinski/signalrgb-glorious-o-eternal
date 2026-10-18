// Glorious Model O Eternal: offline ONLY configuration report builder.
// WARNING: This is a configuration write format, NOT a proven live RGB format.
// NEVER send these reports in SignalRGB Render(), especially not at 30/60 FPS.
export const VID=0x3794, PID=0xa000, REPORT_BYTES=520;
function byte(n) { if (!Number.isInteger(n)||n<0||n>255) throw new RangeError('byte 0..255 required'); return n; }
export function readProfileRequest(profileIndex=0) {
  if (!Number.isInteger(profileIndex)||profileIndex<0||profileIndex>14) throw new RangeError('invalid profile');
  const packet=new Uint8Array(6);
  packet[0]=5; packet[1]=(profileIndex+1)*16+1;
  return packet;
}
export function buildStaticConfig({readback,profileIndex=0,red,green,blue,brightness=100,speed=50}) {
  // Require real readback from identical physical device/profile; no guessed reports.
  if (!(readback instanceof Uint8Array)||readback.length!==520||readback[0]!==4)
    throw new TypeError('520-byte HID report 4 readback required');
  if (!Number.isInteger(brightness)||brightness<0||brightness>100||![0,50,100].includes(speed))
    throw new RangeError('unsupported brightness/speed');
  const result=new Uint8Array(520);
  result.set(readback.subarray(7,127),8);
  result[0]=4;
  result[1]=readProfileRequest(profileIndex)[1];
  result[3]=123;
  result[8]=100;
  result[53]=2; // NormallyOn (static)
  const b=brightness<20?0:brightness<=40?1:brightness<=60?2:brightness<=80?3:4;
  const s=speed===0?1:speed===50?2:3;
  result[56]=(b<<4)|s;
  result[57]=byte(red);
  result[58]=byte(blue); // RBG wire order
  result[59]=byte(green);
  result[61]=1;
  return result; // OFFLINE ANALYSIS; DO NOT TRANSMIT AUTOMATICALLY
}