import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

function createPng(width, height, renderFn) {
  const buffer = Buffer.alloc(width * height * 4);
  
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      const [r, g, b, a] = renderFn(x, y, width, height);
      buffer[idx] = r;
      buffer[idx + 1] = g;
      buffer[idx + 2] = b;
      buffer[idx + 3] = a;
    }
  }

  // PNG Filter type 0 for each line
  const rawData = Buffer.alloc(height * (width * 4 + 1));
  for (let y = 0; y < height; y++) {
    rawData[y * (width * 4 + 1)] = 0; // Filter 0
    buffer.copy(rawData, y * (width * 4 + 1) + 1, y * width * 4, (y + 1) * width * 4);
  }

  const compressed = zlib.deflateSync(rawData);

  // Helper chunk writer
  function writeChunk(type, data) {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length, 0);
    const typeBuf = Buffer.from(type, 'ascii');
    const crcBuf = Buffer.alloc(4);
    const crc = crc32(Buffer.concat([typeBuf, data]));
    crcBuf.writeUInt32BE(crc >>> 0, 0);
    return Buffer.concat([len, typeBuf, data, crcBuf]);
  }

  // CRC32 implementation
  function crc32(buf) {
    let crc = -1;
    for (let i = 0; i < buf.length; i++) {
      let c = (crc ^ buf[i]) & 0xff;
      for (let k = 0; k < 8; k++) {
        c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
      }
      crc = (crc >>> 8) ^ c;
    }
    return (crc ^ -1);
  }

  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

  // IHDR
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // Bit depth
  ihdr[9] = 6; // Color type: RGBA
  ihdr[10] = 0; // Compression
  ihdr[11] = 0; // Filter
  ihdr[12] = 0; // Interlace

  const ihdrChunk = writeChunk('IHDR', ihdr);
  const idatChunk = writeChunk('IDAT', compressed);
  const iendChunk = writeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

// Render "آرومش کن" Icon: Dialogue Bubbles + Heart + Soothing Gradient
function renderIcon(x, y, w, h) {
  const nx = (x / w) * 2 - 1; // -1 to 1
  const ny = (y / h) * 2 - 1; // -1 to 1
  const dist = Math.sqrt(nx * nx + ny * ny);

  // Background Gradient (Purplish Lavender)
  let r = 139 - ny * 20; // #8B5CF6 to #6D28D9
  let g = 92 - ny * 25;
  let b = 246 - ny * 20;
  let a = 255;

  // Maskable background container
  if (dist > 0.95) {
    const edgeAlpha = Math.max(0, Math.min(255, Math.floor((1.0 - dist) / 0.05 * 255)));
    a = edgeAlpha;
  }

  // Draw two overlapping chat bubbles forming a heart motif in center
  // Left Bubble: center (-0.2, -0.05), radius 0.4
  const dLeft = Math.sqrt((nx + 0.18) * (nx + 0.18) + (ny + 0.05) * (ny + 0.05));
  // Right Bubble: center (0.2, -0.05), radius 0.4
  const dRight = Math.sqrt((nx - 0.18) * (nx - 0.18) + (ny + 0.05) * (ny + 0.05));

  // Heart formula: (x^2 + y^2 - 1)^3 - x^2 * y^3 <= 0
  const hx = nx * 2.2;
  const hy = (ny + 0.08) * -2.2; // flip y
  const heartVal = Math.pow(hx * hx + hy * hy - 0.65, 3) - hx * hx * Math.pow(hy, 3);

  const isBubble = (dLeft < 0.38) || (dRight < 0.38) || (ny > 0.1 && ny < 0.45 && Math.abs(nx) < 0.32);

  if (heartVal <= 0.05) {
    // Glowing Warm Heart in Center
    r = 255;
    g = 182 - Math.floor(ny * 40);
    b = 193;
  } else if (isBubble) {
    // Soft White/Light Lavender Bubble Container
    r = 255;
    g = 250;
    b = 255;
  }

  return [Math.max(0, Math.min(255, Math.floor(r))), Math.max(0, Math.min(255, Math.floor(g))), Math.max(0, Math.min(255, Math.floor(b))), a];
}

const iconsDir = path.resolve('public/icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

console.log('Generating PWA PNG Icons...');
fs.writeFileSync(path.join(iconsDir, 'icon-192.png'), createPng(192, 192, renderIcon));
fs.writeFileSync(path.join(iconsDir, 'icon-512.png'), createPng(512, 512, renderIcon));
fs.writeFileSync(path.join(iconsDir, 'icon-180.png'), createPng(180, 180, renderIcon));

console.log('Icons successfully generated!');
