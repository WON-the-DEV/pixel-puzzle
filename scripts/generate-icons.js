/**
 * PWA 아이콘 생성 스크립트
 * Node.js Canvas 없이 직접 PNG 바이너리 생성
 * 보라색 그라데이션 배경에 5x5 노노그램 그리드
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// 간단한 PNG 생성 (비압축)
function createPNG(width, height, pixels) {
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

  const rawData = [];
  for (let y = 0; y < height; y++) {
    rawData.push(0);
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      rawData.push(pixels[idx], pixels[idx + 1], pixels[idx + 2], pixels[idx + 3]);
    }
  }
  const rawBuf = Buffer.from(rawData);

  const deflateBlocks = [];
  const BLOCK_SIZE = 65535;
  for (let i = 0; i < rawBuf.length; i += BLOCK_SIZE) {
    const end = Math.min(i + BLOCK_SIZE, rawBuf.length);
    const isLast = end === rawBuf.length;
    const blockData = rawBuf.subarray(i, end);
    const blockLen = blockData.length;
    deflateBlocks.push(isLast ? 1 : 0);
    deflateBlocks.push(blockLen & 0xff, (blockLen >> 8) & 0xff);
    deflateBlocks.push(~blockLen & 0xff, (~blockLen >> 8) & 0xff);
    for (let j = 0; j < blockData.length; j++) {
      deflateBlocks.push(blockData[j]);
    }
  }

  const adler = adler32(rawBuf);
  const zlibData = Buffer.alloc(2 + deflateBlocks.length + 4);
  zlibData[0] = 0x78;
  zlibData[1] = 0x01;
  Buffer.from(deflateBlocks).copy(zlibData, 2);
  const adlerOffset = 2 + deflateBlocks.length;
  zlibData[adlerOffset] = (adler >> 24) & 0xff;
  zlibData[adlerOffset + 1] = (adler >> 16) & 0xff;
  zlibData[adlerOffset + 2] = (adler >> 8) & 0xff;
  zlibData[adlerOffset + 3] = adler & 0xff;

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

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  return Buffer.concat([
    signature,
    makeChunk('IHDR', ihdr),
    makeChunk('IDAT', zlibData),
    makeChunk('IEND', Buffer.alloc(0)),
  ]);
}

// 색상 보간
function lerp(a, b, t) {
  return Math.round(a + (b - a) * t);
}

function generateIcon(size) {
  const pixels = new Uint8Array(size * size * 4);

  // 보라색 그라데이션 배경 (좌상 → 우하)
  // #6c5ce7 → #a855f7 → #7c3aed
  const c1 = { r: 88, g: 72, b: 214 };   // 좌상 (더 진한 보라)
  const c2 = { r: 168, g: 85, b: 247 };   // 우하 (밝은 보라)

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const t = (x / size + y / size) / 2; // diagonal gradient
      const idx = (y * size + x) * 4;
      pixels[idx] = lerp(c1.r, c2.r, t);
      pixels[idx + 1] = lerp(c1.g, c2.g, t);
      pixels[idx + 2] = lerp(c1.b, c2.b, t);
      pixels[idx + 3] = 255;
    }
  }

  // 둥근 모서리
  const cornerRadius = Math.floor(size * 0.22);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
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
        pixels[idx + 3] = 0;
      } else if (dist > cornerRadius - 1.5) {
        // Anti-aliasing edge
        const idx = (y * size + x) * 4;
        pixels[idx + 3] = Math.round(255 * (cornerRadius - dist) / 1.5);
      }
    }
  }

  // 5x5 노노그램 그리드
  const padding = Math.floor(size * 0.18);
  const gridArea = size - padding * 2;
  const cellSize = Math.floor(gridArea / 5);
  const gap = Math.max(2, Math.floor(size * 0.025));
  const offsetX = Math.floor((size - cellSize * 5) / 2);
  const offsetY = Math.floor((size - cellSize * 5) / 2);

  // 패턴: 비대칭 노노그램 느낌 (더 아이코닉한 모양)
  const pattern = [
    [1, 0, 1, 1, 0],
    [1, 1, 0, 1, 1],
    [0, 1, 1, 1, 0],
    [1, 1, 0, 1, 1],
    [0, 1, 1, 0, 1],
  ];

  for (let gr = 0; gr < 5; gr++) {
    for (let gc = 0; gc < 5; gc++) {
      const x0 = offsetX + gc * cellSize + gap;
      const y0 = offsetY + gr * cellSize + gap;
      const w = cellSize - gap * 2;
      const h = cellSize - gap * 2;
      const r = Math.max(2, Math.floor(w * 0.12));

      const isFilled = pattern[gr][gc] === 1;
      // 채워진 셀: 흰색, 빈 셀: 반투명 흰색 테두리만
      const fillR = isFilled ? 255 : 0;
      const fillG = isFilled ? 255 : 0;
      const fillB = isFilled ? 255 : 0;
      const fillA = isFilled ? 240 : 0;
      const borderA = isFilled ? 0 : 60; // 빈 셀만 테두리

      for (let y = y0; y < y0 + h && y < size; y++) {
        for (let x = x0; x < x0 + w && x < size; x++) {
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
            if (isFilled) {
              // 흰색 채움 (약간의 alpha blending)
              pixels[idx] = fillR;
              pixels[idx + 1] = fillG;
              pixels[idx + 2] = fillB;
              pixels[idx + 3] = fillA;
            } else {
              // 빈 셀: 테두리만 (가장자리 2px)
              const isBorder = (x - x0 < 2 || x >= x0 + w - 2 || y - y0 < 2 || y >= y0 + h - 2);
              if (isBorder) {
                const bgIdx = idx;
                // Alpha blend white border over gradient
                const alpha = borderA / 255;
                pixels[bgIdx] = Math.round(pixels[bgIdx] * (1 - alpha) + 255 * alpha);
                pixels[bgIdx + 1] = Math.round(pixels[bgIdx + 1] * (1 - alpha) + 255 * alpha);
                pixels[bgIdx + 2] = Math.round(pixels[bgIdx + 2] * (1 - alpha) + 255 * alpha);
              }
            }
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
