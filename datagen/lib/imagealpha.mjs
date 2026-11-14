// imagealpha.mjs - classify a texture's alpha usage from the real pixel data (PNG + TGA, no deps).
//   "opaque"  : no transparency at all
//   "binary"  : pixels are fully opaque or fully transparent (cut-out)  -> render_method alpha_test
//   "partial" : has translucent pixels                                  -> render_method blend
//   "unknown" : could not decode (callers fall back to the safe choice)
import zlib from "node:zlib";

const PNG_SIG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

function summarize(alphaValues) {
  let hasZero = false, hasPartial = false;
  for (const a of alphaValues) {
    if (a === 255) continue;
    if (a === 0) hasZero = true; else { hasPartial = true; break; }
  }
  return hasPartial ? "partial" : hasZero ? "binary" : "opaque";
}

function paeth(a, b, c) {
  const p = a + b - c, pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c);
  return pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
}

export function classifyPng(buf) {
  if (buf.length < 33 || !buf.subarray(0, 8).equals(PNG_SIG)) return "unknown";
  let pos = 8, ihdr, trns = null;
  const idat = [];
  while (pos + 8 <= buf.length) {
    const len = buf.readUInt32BE(pos), type = buf.toString("ascii", pos + 4, pos + 8);
    const data = buf.subarray(pos + 8, pos + 8 + len);
    if (type === "IHDR") ihdr = { w: data.readUInt32BE(0), h: data.readUInt32BE(4), depth: data[8], ct: data[9], interlace: data[12] };
    else if (type === "tRNS") trns = data;
    else if (type === "IDAT") idat.push(data);
    else if (type === "IEND") break;
    pos += 12 + len;
  }
  if (!ihdr) return "unknown";
  const { w, h, depth, ct } = ihdr;
  const channels = { 0: 1, 2: 3, 3: 1, 4: 2, 6: 4 }[ct];
  if (!channels) return "unknown";
  if (ct === 2 || ct === 0) return trns ? "binary" : "opaque";          // no alpha channel (colour-key only)
  if (ct === 3 && !trns) return "opaque";
  if (ihdr.interlace !== 0) return "unknown";                           // Adam7 + alpha: not decoded

  let raw;
  try { raw = zlib.inflateSync(Buffer.concat(idat)); } catch { return "unknown"; }
  const bitsPerPixel = channels * depth, bpp = Math.max(1, bitsPerPixel >> 3), rowBytes = Math.ceil((w * bitsPerPixel) / 8);
  if (raw.length < (rowBytes + 1) * h) return "unknown";

  const alpha = [];
  let prev = Buffer.alloc(rowBytes);
  for (let y = 0; y < h; y++) {
    const off = y * (rowBytes + 1), ft = raw[off];
    const row = Buffer.from(raw.subarray(off + 1, off + 1 + rowBytes));
    for (let i = 0; i < rowBytes; i++) {
      const a = i >= bpp ? row[i - bpp] : 0, b = prev[i], c = i >= bpp ? prev[i - bpp] : 0;
      let add = 0;
      if (ft === 1) add = a; else if (ft === 2) add = b; else if (ft === 3) add = (a + b) >> 1; else if (ft === 4) add = paeth(a, b, c);
      else if (ft !== 0) return "unknown";
      row[i] = (row[i] + add) & 255;
    }
    if (ct === 6) { const step = depth === 8 ? 4 : 8, ao = depth === 8 ? 3 : 6; for (let x = 0; x < w; x++) alpha.push(row[x * step + ao]); }
    else if (ct === 4) { const step = depth === 8 ? 2 : 4, ao = depth === 8 ? 1 : 2; for (let x = 0; x < w; x++) alpha.push(row[x * step + ao]); }
    else if (ct === 3) {
      const mask = (1 << depth) - 1;
      for (let x = 0; x < w; x++) {
        const bit = x * depth, byte = row[bit >> 3], shift = 8 - depth - (bit & 7);
        const idx = depth === 8 ? byte : (byte >> shift) & mask;
        alpha.push(idx < trns.length ? trns[idx] : 255);
      }
    }
    prev = row;
  }
  return summarize(alpha);
}

export function classifyTga(buf) {
  if (buf.length < 18) return "unknown";
  const idLen = buf[0], cmType = buf[1], imgType = buf[2], cmLen = buf.readUInt16LE(5), cmDepth = buf[7];
  const w = buf.readUInt16LE(12), h = buf.readUInt16LE(14), depth = buf[16];
  if (![2, 10].includes(imgType)) return "unknown";
  if (depth === 24) return "opaque";
  if (depth !== 32) return "unknown";
  let pos = 18 + idLen + (cmType ? cmLen * (cmDepth >> 3) : 0);
  const total = w * h, alpha = [];
  if (imgType === 2) {
    for (let i = 0; i < total; i++) alpha.push(buf[pos + i * 4 + 3]);
  } else {
    while (alpha.length < total && pos < buf.length) {
      const head = buf[pos++], count = (head & 0x7f) + 1;
      if (head & 0x80) { const a = buf[pos + 3]; pos += 4; for (let i = 0; i < count; i++) alpha.push(a); }
      else for (let i = 0; i < count; i++) { alpha.push(buf[pos + 3]); pos += 4; }
    }
    if (alpha.length < total) return "unknown";
  }
  return summarize(alpha);
}

export function classifyImage(buf, ext) {
  try { return ext === ".tga" ? classifyTga(buf) : classifyPng(buf); } catch { return "unknown"; }
}
