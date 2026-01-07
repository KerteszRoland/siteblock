// Simple icon generator - creates basic PNG icons for the extension
// Run with: node create-icons.js

const fs = require("fs");
const path = require("path");
const zlib = require("zlib");

// Create icons directory if it doesn't exist
const iconsDir = path.join(__dirname, "icons");
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir);
}

function createPNG(size) {
  const width = size;
  const height = size;

  // Create raw pixel data (RGBA)
  const pixels = [];
  const cx = size / 2;
  const cy = size / 2;
  const bgRadius = size * 0.35;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const dx = x - cx;
      const dy = y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Background (dark)
      let r = 26,
        g = 26,
        b = 46,
        a = 255;

      // Red circle
      if (dist < bgRadius) {
        r = 255;
        g = 107;
        b = 107;
        a = 255;
      }

      // White X mark
      const lineWidth = size * 0.06;
      const xSize = size * 0.18;
      if (Math.abs(dx) < xSize && Math.abs(dy) < xSize) {
        const onLine1 = Math.abs(dx - dy) < lineWidth;
        const onLine2 = Math.abs(dx + dy) < lineWidth;
        if (onLine1 || onLine2) {
          r = 255;
          g = 255;
          b = 255;
          a = 255;
        }
      }

      // Round corners for background
      const cornerRadius = size * 0.18;
      const inCorner =
        (x < cornerRadius &&
          y < cornerRadius &&
          Math.sqrt((x - cornerRadius) ** 2 + (y - cornerRadius) ** 2) >
            cornerRadius) ||
        (x > width - cornerRadius &&
          y < cornerRadius &&
          Math.sqrt(
            (x - (width - cornerRadius)) ** 2 + (y - cornerRadius) ** 2
          ) > cornerRadius) ||
        (x < cornerRadius &&
          y > height - cornerRadius &&
          Math.sqrt(
            (x - cornerRadius) ** 2 + (y - (height - cornerRadius)) ** 2
          ) > cornerRadius) ||
        (x > width - cornerRadius &&
          y > height - cornerRadius &&
          Math.sqrt(
            (x - (width - cornerRadius)) ** 2 +
              (y - (height - cornerRadius)) ** 2
          ) > cornerRadius);

      if (inCorner) {
        r = 0;
        g = 0;
        b = 0;
        a = 0;
      }

      pixels.push(r, g, b, a);
    }
  }

  return createPNGFromPixels(width, height, pixels);
}

function createPNGFromPixels(width, height, pixels) {
  // Create raw image data with filter bytes
  const rawData = [];
  for (let y = 0; y < height; y++) {
    rawData.push(0); // Filter type: None
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      rawData.push(pixels[i], pixels[i + 1], pixels[i + 2], pixels[i + 3]);
    }
  }

  // Compress the data
  const compressed = zlib.deflateSync(Buffer.from(rawData));

  // Build PNG file
  const chunks = [];

  // PNG signature
  chunks.push(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));

  // IHDR chunk
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr.writeUInt8(8, 8); // Bit depth
  ihdr.writeUInt8(6, 9); // Color type (RGBA)
  ihdr.writeUInt8(0, 10); // Compression
  ihdr.writeUInt8(0, 11); // Filter
  ihdr.writeUInt8(0, 12); // Interlace
  chunks.push(createChunk("IHDR", ihdr));

  // IDAT chunk
  chunks.push(createChunk("IDAT", compressed));

  // IEND chunk
  chunks.push(createChunk("IEND", Buffer.alloc(0)));

  return Buffer.concat(chunks);
}

function createChunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);

  const typeBuffer = Buffer.from(type);
  const crcData = Buffer.concat([typeBuffer, data]);
  const crc = crc32(crcData);

  const crcBuffer = Buffer.alloc(4);
  crcBuffer.writeUInt32BE(crc >>> 0, 0);

  return Buffer.concat([length, typeBuffer, data, crcBuffer]);
}

function crc32(buf) {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc ^= buf[i];
    for (let j = 0; j < 8; j++) {
      crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
    }
  }
  return ~crc;
}

// Generate and save icons
const sizes = [16, 48, 128];

sizes.forEach((size) => {
  const png = createPNG(size);
  const filename = path.join(iconsDir, `icon${size}.png`);
  fs.writeFileSync(filename, png);
  console.log(`Created ${filename}`);
});

console.log("\n✅ Red icons created successfully!");
console.log("You can now load the extension in Chrome.");
