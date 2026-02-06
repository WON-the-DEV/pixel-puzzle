/**
 * PWA 아이콘 생성 스크립트
 * Node.js Canvas 없이 직접 PNG 바이너리 생성
 * 보라색 배경에 흰색 5x5 그리드 패턴
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// 간단한 PNG 생성 (비압축)
function createPNG(width, height, pixels) {
  // CRC32 테이블
  const crcTable = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    crcTable[n] = c;
  }

  function crc32(buf, offset, length) {
    let crc = 0xffffffff;
    for (let i = offset; i < offset + length; i++) {
      crc = crcTable[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
    }
    return crc ^ 0xffffffff;
  }

  function adler32(data) {
    let a = 1, b = 0;
    for (let i = 0; i < data.length; i++) {
      a = (a + data[i]) % 65521;
      b = (b + a) % 65521;
    }
    return (b << 16) | a;
  }

  // Raw image data (filter byte + RGBA for each row)
  const rawData = [];
  for (let y = 0; y < height; y++) {
    rawData.push(0); // filter: none
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      rawData.push(pixels[idx], pixels[idx + 1], pixels[idx + 2], pixels[idx + 3]);
    }
  }
  const rawBuf = Buffer.from(rawData);

  // Deflate: store blocks (no compression)
  const deflateBlocks = [];
  const BLOCK_SIZE = 65535;
  for (let i = 0; i < rawBuf.length; i += BLOCK_SIZE) {
    const end = Math.min(i + BLOCK_SIZE, rawBuf.length);
    const isLast = end === rawBuf.length;
    const blockData = rawBuf.subarray(i, end);
    const blockLen = blockData.length;

    deflateBlocks.push(isLast ? 1 : 0); // BFINAL
    deflateBlocks.push(blockLen & 0xff, (blockLen >> 8) & 0xff);
    deflateBlocks.push(~blockLen & 0xff, (~blockLen >> 8) & 0xff);
    for (let j = 0; j < blockData.length; j++) {
      deflateBlocks.push(blockData[j]);
    }
  }

  const adler = adler32(rawBuf);

  // zlib wrapper: CMF + FLG + deflate + adler32
  const zlibData = Buffer.alloc(2 + deflateBlocks.length + 4);
  zlibData[0] = 0x78; // CMF
  zlibData[1] = 0x01; // FLG
  Buffer.from(deflateBlocks).copy(zlibData, 2);
  const adlerOffset = 2 + deflateBlocks.length;
  zlibData[adlerOffset] = (adler >> 24) & 0xff;
  zlibData[adlerOffset + 1] = (adler >> 16) & 0xff;
  zlibData[adlerOffset + 2] = (adler >> 8) & 0xff;
  zlibData[adlerOffset + 3] = adler & 0xff;

  // Build PNG
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  function makeChunk(type, data) {
    const typeBytes = Buffer.from(type);
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length);
    const combined = Buffer.concat([typeBytes, data]);
    const crc = crc32(combined, 0, combined.length);
    const crcBuf = Buffer.alloc(4);
    crcBuf.writeUInt32BE(crc >>> 0);
    return Buffer.concat([len, combined, crcBuf]);
  }

  // IHDR
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;  // bit depth
  ihdr[9] = 6;  // color type: RGBA
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace

  return Buffer.concat([
    signature,
    makeChunk('IHDR', ihdr),
    makeChunk('IDAT', zlibData),
    makeChunk('IEND', Buffer.alloc(0)),
  ]);
}

function generateIcon(size) {
  const pixels = new Uint8Array(size * size * 4);

  // 보라색 배경 (#6c5ce7)
  const bgR = 108, bgG = 92, bgB = 231;
  for (let i = 0; i < size * size; i++) {
    pixels[i * 4] = bgR;
    pixels[i * 4 + 1] = bgG;
    pixels[i * 4 + 2] = bgB;
    pixels[i * 4 + 3] = 255;
  }

  // 둥근 모서리 (알파 0)
  const cornerRadius = Math.floor(size * 0.18);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      // 네 모서리 확인
      let cx, cy;
      if (x < cornerRadius && y < cornerRadius) {
        cx = cornerRadius; cy = cornerRadius;
      } else if (x >= size - cornerRadius && y < cornerRadius) {
        cx = size - cornerRadius - 1; cy = cornerRadius;
      } else if (x < cornerRadius && y >= size - cornerRadius) {
        cx = cornerRadius; cy = size - cornerRadius - 1;
      } else if (x >= size - cornerRadius && y >= size - cornerRadius) {
        cx = size - cornerRadius - 1; cy = size - cornerRadius - 1;
      } else {
        continue;
      }
      const dist = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2);
      if (dist > cornerRadius) {
        const idx = (y * size + x) * 4;
        pixels[idx + 3] = 0; // transparent
      }
    }
  }

  // 5x5 그리드 (흰색)
  const padding = Math.floor(size * 0.2);
  const gridArea = size - padding * 2;
  const cellSize = Math.floor(gridArea / 5);
  const gap = Math.max(1, Math.floor(size * 0.02));
  const offsetX = Math.floor((size - cellSize * 5) / 2);
  const offsetY = Math.floor((size - cellSize * 5) / 2);

  // 노노그램 패턴 (5x5) — 하트 모양
  const pattern = [
    [0, 1, 0, 1, 0],
    [1, 1, 1, 1, 1],
    [1, 1, 1, 1, 1],
    [0, 1, 1, 1, 0],
    [0, 0, 1, 0, 0],
  ];

  for (let gr = 0; gr < 5; gr++) {
    for (let gc = 0; gc < 5; gc++) {
      if (!pattern[gr][gc]) continue;

      const x0 = offsetX + gc * cellSize + gap;
      const y0 = offsetY + gr * cellSize + gap;
      const w = cellSize - gap * 2;
      const h = cellSize - gap * 2;
      const r = Math.max(1, Math.floor(w * 0.15));

      for (let y = y0; y < y0 + h && y < size; y++) {
        for (let x = x0; x < x0 + w && x < size; x++) {
          // 셀 둥근 모서리
          let inside = true;
          if (x < x0 + r && y < y0 + r) {
            inside = Math.sqrt((x - x0 - r) ** 2 + (y - y0 - r) ** 2) <= r;
          } else if (x >= x0 + w - r && y < y0 + r) {
            inside = Math.sqrt((x - x0 - w + r) ** 2 + (y - y0 - r) ** 2) <= r;
          } else if (x < x0 + r && y >= y0 + h - r) {
            inside = Math.sqrt((x - x0 - r) ** 2 + (y - y0 - h + r) ** 2) <= r;
          } else if (x >= x0 + w - r && y >= y0 + h - r) {
            inside = Math.sqrt((x - x0 - w + r) ** 2 + (y - y0 - h + r) ** 2) <= r;
          }

          if (inside) {
            const idx = (y * size + x) * 4;
            pixels[idx] = 255;
            pixels[idx + 1] = 255;
            pixels[idx + 2] = 255;
            pixels[idx + 3] = 255;
          }
        }
      }
    }
  }

  return pixels;
}

// Generate 192x192 and 512x512
for (const size of [192, 512]) {
  const pixels = generateIcon(size);
  const png = createPNG(size, size, pixels);
  const outPath = path.join(__dirname, '..', 'public', `icon-${size}.png`);
  fs.writeFileSync(outPath, png);
  console.log(`✅ Generated icon-${size}.png (${png.length} bytes)`);
}
