const { createCanvas } = require('canvas');
const fs = require('fs');
const path = require('path');

const iconsDir = path.join(__dirname, 'src-tauri', 'icons');

// Convert canvas to 24-bit BMP buffer (required for NSIS)
function canvasToBmp24(canvas) {
  const width = canvas.width;
  const height = canvas.height;
  const ctx = canvas.getContext('2d');
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;
  
  // BMP row size must be multiple of 4 bytes
  const rowSize = Math.ceil((width * 3) / 4) * 4;
  const pixelDataSize = rowSize * height;
  
  // BMP file header (14 bytes) + DIB header (40 bytes) + pixel data
  const fileSize = 54 + pixelDataSize;
  const buffer = Buffer.alloc(fileSize);
  
  // BMP File Header (14 bytes)
  buffer.write('BM', 0);                          // Signature
  buffer.writeUInt32LE(fileSize, 2);              // File size
  buffer.writeUInt32LE(0, 6);                     // Reserved
  buffer.writeUInt32LE(54, 10);                   // Pixel data offset
  
  // DIB Header (BITMAPINFOHEADER - 40 bytes)
  buffer.writeUInt32LE(40, 14);                   // DIB header size
  buffer.writeInt32LE(width, 18);                 // Width
  buffer.writeInt32LE(height, 22);                // Height (positive = bottom-up)
  buffer.writeUInt16LE(1, 26);                    // Color planes
  buffer.writeUInt16LE(24, 28);                   // Bits per pixel (24-bit)
  buffer.writeUInt32LE(0, 30);                    // Compression (none)
  buffer.writeUInt32LE(pixelDataSize, 34);        // Image size
  buffer.writeInt32LE(2835, 38);                  // X pixels per meter
  buffer.writeInt32LE(2835, 42);                  // Y pixels per meter
  buffer.writeUInt32LE(0, 46);                    // Colors in color table
  buffer.writeUInt32LE(0, 50);                    // Important colors
  
  // Pixel data (bottom-up, BGR format)
  for (let y = height - 1; y >= 0; y--) {
    const rowOffset = 54 + (height - 1 - y) * rowSize;
    for (let x = 0; x < width; x++) {
      const srcIdx = (y * width + x) * 4;
      const dstIdx = rowOffset + x * 3;
      buffer[dstIdx] = data[srcIdx + 2];     // B
      buffer[dstIdx + 1] = data[srcIdx + 1]; // G
      buffer[dstIdx + 2] = data[srcIdx];     // R
    }
  }
  
  return buffer;
}

// Draw the poker chip logo
function drawPokerChipLogo(ctx, cx, cy, size) {
  const scale = size / 200;
  
  // Outer circle - poker chip (red)
  ctx.beginPath();
  ctx.arc(cx, cy, 90 * scale, 0, Math.PI * 2);
  ctx.fillStyle = '#DC2626';
  ctx.fill();
  
  // White ring segments (12 lines around the edge)
  ctx.strokeStyle = 'white';
  ctx.lineWidth = 8 * scale;
  ctx.lineCap = 'round';
  
  for (let i = 0; i < 12; i++) {
    const angle = (i * 30 * Math.PI) / 180;
    const x1 = cx + Math.cos(angle) * 75 * scale;
    const y1 = cy + Math.sin(angle) * 75 * scale;
    const x2 = cx + Math.cos(angle) * 90 * scale;
    const y2 = cy + Math.sin(angle) * 90 * scale;
    
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  }
  
  // Inner white circle
  ctx.beginPath();
  ctx.arc(cx, cy, 65 * scale, 0, Math.PI * 2);
  ctx.fillStyle = 'white';
  ctx.fill();
  
  // Center red circle
  ctx.beginPath();
  ctx.arc(cx, cy, 55 * scale, 0, Math.PI * 2);
  ctx.fillStyle = '#DC2626';
  ctx.fill();
  
  // Card suits
  const suitScale = scale;
  
  // Spade (top)
  drawSpade(ctx, cx, cy - 45 * scale, suitScale * 1.2, 'white');
  // Heart (right)
  drawHeart(ctx, cx + 45 * scale, cy, suitScale * 0.8);
  // Diamond (bottom)
  drawDiamond(ctx, cx, cy + 45 * scale, suitScale);
  // Club (left)
  drawClub(ctx, cx - 45 * scale, cy, suitScale * 0.8);
  
  // Center white circle
  ctx.beginPath();
  ctx.arc(cx, cy, 18 * scale, 0, Math.PI * 2);
  ctx.fillStyle = 'white';
  ctx.fill();
  
  // Center spade symbol
  drawSpade(ctx, cx, cy, suitScale * 0.9, '#DC2626');
}

function drawSpade(ctx, x, y, s, color = 'white') {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x, y - 12 * s);
  ctx.bezierCurveTo(x - 10 * s, y - 8 * s, x - 12 * s, y + 2 * s, x - 8 * s, y + 6 * s);
  ctx.bezierCurveTo(x - 4 * s, y + 9 * s, x - 2 * s, y + 6 * s, x, y + 4 * s);
  ctx.bezierCurveTo(x + 2 * s, y + 6 * s, x + 4 * s, y + 9 * s, x + 8 * s, y + 6 * s);
  ctx.bezierCurveTo(x + 12 * s, y + 2 * s, x + 10 * s, y - 8 * s, x, y - 12 * s);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(x - 3 * s, y + 4 * s);
  ctx.lineTo(x - 4 * s, y + 12 * s);
  ctx.lineTo(x + 4 * s, y + 12 * s);
  ctx.lineTo(x + 3 * s, y + 4 * s);
  ctx.fill();
}

function drawHeart(ctx, x, y, s) {
  ctx.fillStyle = 'white';
  ctx.beginPath();
  ctx.moveTo(x, y + 10 * s);
  ctx.bezierCurveTo(x - 15 * s, y - 5 * s, x - 15 * s, y - 15 * s, x, y - 8 * s);
  ctx.bezierCurveTo(x + 15 * s, y - 15 * s, x + 15 * s, y - 5 * s, x, y + 10 * s);
  ctx.fill();
}

function drawDiamond(ctx, x, y, s) {
  ctx.fillStyle = 'white';
  ctx.beginPath();
  ctx.moveTo(x, y - 12 * s);
  ctx.lineTo(x + 8 * s, y);
  ctx.lineTo(x, y + 12 * s);
  ctx.lineTo(x - 8 * s, y);
  ctx.closePath();
  ctx.fill();
}

function drawClub(ctx, x, y, s) {
  ctx.fillStyle = 'white';
  ctx.beginPath();
  ctx.arc(x - 6 * s, y - 2 * s, 6 * s, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(x + 6 * s, y - 2 * s, 6 * s, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(x, y - 10 * s, 6 * s, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(x - 3 * s, y + 2 * s);
  ctx.lineTo(x - 4 * s, y + 12 * s);
  ctx.lineTo(x + 4 * s, y + 12 * s);
  ctx.lineTo(x + 3 * s, y + 2 * s);
  ctx.fill();
}

// NSIS Installer Sidebar Image (164x314)
function drawSidebar() {
  const width = 164;
  const height = 314;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');
  
  // Black background
  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, width, height);
  
  // Draw logo at top
  drawPokerChipLogo(ctx, width / 2, 85, 120);
  
  // "PokerPulse Pro" - white bold text
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 18px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('PokerPulse Pro', width / 2, 175);
  
  // "Tournament Manager & Timer" - white regular text
  ctx.font = '11px system-ui, sans-serif';
  ctx.fillText('Tournament Manager', width / 2, 200);
  ctx.fillText('& Timer', width / 2, 215);
  
  return canvas;
}

// NSIS Header/Banner Image (150x57)
function drawHeader() {
  const width = 150;
  const height = 57;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');
  
  // White background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);
  
  // Draw small logo on the left
  drawPokerChipLogo(ctx, 30, height / 2, 45);
  
  // "PokerPulse Pro" - black text
  ctx.fillStyle = '#000000';
  ctx.font = 'bold 12px system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText('PokerPulse Pro', 58, height / 2);
  
  return canvas;
}

// MSI/WiX Banner Image (493x58) - shown at top of interior installer pages
function drawMsiBanner() {
  const width = 493;
  const height = 58;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');
  
  // White background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);
  
  // Draw small logo on the left
  drawPokerChipLogo(ctx, 35, height / 2, 48);
  
  // "PokerPulse Pro" - black bold text
  ctx.fillStyle = '#000000';
  ctx.font = 'bold 18px system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText('PokerPulse Pro', 70, height / 2);
  
  return canvas;
}

// MSI/WiX Dialog Image (493x312) - shown on left side of welcome/completion pages
function drawMsiDialog() {
  const width = 493;
  const height = 312;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');
  
  // Black background
  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, width, height);
  
  // Draw logo centered
  drawPokerChipLogo(ctx, width / 2, 120, 180);
  
  // "PokerPulse Pro" - white bold text
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 24px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('PokerPulse Pro', width / 2, 245);
  
  // "Tournament Manager & Timer" - white regular text
  ctx.font = '14px system-ui, sans-serif';
  ctx.fillText('Tournament Manager & Timer', width / 2, 275);
  
  return canvas;
}

// Generate and save as 24-bit BMP (required for NSIS)
const sidebar = drawSidebar();
fs.writeFileSync(path.join(iconsDir, 'nsis-sidebar.bmp'), canvasToBmp24(sidebar));
console.log('Generated: nsis-sidebar.bmp (164x314)');

const header = drawHeader();
fs.writeFileSync(path.join(iconsDir, 'nsis-header.bmp'), canvasToBmp24(header));
console.log('Generated: nsis-header.bmp (150x57)');

// MSI images
const msiBanner = drawMsiBanner();
fs.writeFileSync(path.join(iconsDir, 'msi-banner.bmp'), canvasToBmp24(msiBanner));
console.log('Generated: msi-banner.bmp (493x58)');

const msiDialog = drawMsiDialog();
fs.writeFileSync(path.join(iconsDir, 'msi-dialog.bmp'), canvasToBmp24(msiDialog));
console.log('Generated: msi-dialog.bmp (493x312)');

console.log('\nInstaller images generated!');
