// Checks an uploaded file by its bytes, not by its name or the type the
// browser claims. Anything that is not a real JPEG, PNG, WebP or HEIC image
// is refused before it goes anywhere.

function sniff(buf) {
  if (!buf || buf.length < 16) return null;
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return "image/jpeg";
  if (buf.slice(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return "image/png";
  if (buf.toString("ascii", 0, 4) === "RIFF" && buf.toString("ascii", 8, 12) === "WEBP") return "image/webp";
  if (buf.toString("ascii", 4, 8) === "ftyp") {
    const brand = buf.toString("ascii", 8, 12);
    if (["heic", "heix", "hevc", "heim", "heis"].includes(brand)) return "image/heic";
    if (["mif1", "msf1"].includes(brand)) return "image/heif";
  }
  return null;
}

// Width and height, or null when the header can't be read (HEIC, or a
// damaged file).
function dimensions(buf, type) {
  try {
    if (type === "image/png") return { w: buf.readUInt32BE(16), h: buf.readUInt32BE(20) };
    if (type === "image/webp") {
      const chunk = buf.toString("ascii", 12, 16);
      if (chunk === "VP8 ") return { w: buf.readUInt16LE(26) & 0x3fff, h: buf.readUInt16LE(28) & 0x3fff };
      if (chunk === "VP8L") {
        const b = buf.readUInt32LE(21);
        return { w: (b & 0x3fff) + 1, h: ((b >> 14) & 0x3fff) + 1 };
      }
      if (chunk === "VP8X") return { w: buf.readUIntLE(24, 3) + 1, h: buf.readUIntLE(27, 3) + 1 };
    }
    if (type === "image/jpeg") {
      let i = 2;
      while (i < buf.length - 9) {
        if (buf[i] !== 0xff) { i++; continue; }
        const marker = buf[i + 1];
        if (marker === 0xd8 || marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) { i += 2; continue; }
        const len = buf.readUInt16BE(i + 2);
        if (marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker)) {
          return { w: buf.readUInt16BE(i + 7), h: buf.readUInt16BE(i + 5) };
        }
        i += 2 + len;
      }
    }
  } catch (e) {
    return null;
  }
  return null;
}

// Returns { type, w, h } or throws with a user-facing code.
function check(buf, { maxBytes }) {
  if (!buf || !buf.length) throw Object.assign(new Error("Empty upload"), { code: "empty" });
  if (buf.length > maxBytes) throw Object.assign(new Error("Too large"), { code: "too_large" });
  const type = sniff(buf);
  if (!type) throw Object.assign(new Error("Not an image"), { code: "bad_type" });
  const dim = dimensions(buf, type);
  if (dim && (dim.w < 80 || dim.h < 80)) throw Object.assign(new Error("Too small"), { code: "too_small" });
  if (dim && (dim.w > 12000 || dim.h > 12000)) throw Object.assign(new Error("Too big in pixels"), { code: "too_large" });
  return { type, w: dim ? dim.w : null, h: dim ? dim.h : null };
}

module.exports = { sniff, dimensions, check };
