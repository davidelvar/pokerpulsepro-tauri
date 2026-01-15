const { createCanvas } = require('canvas');
const fs = require('fs');
const path = require('path');

const iconsDir = path.join(__dirname, 'src-tauri', 'icons');

// Generate the poker chip icon
function drawIcon(size) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');
  
  const scale = size / 200;
  const cx = size / 2;
  const cy = size / 2;
  
  // Clear background (transparent)
  ctx.clearRect(0, 0, size, size);
  
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
  
  // Card suits - Spade (top)
  ctx.save();
  ctx.translate(cx, cy - 45 * scale);
  ctx.scale(scale, scale);
  drawSpade(ctx, 0, 0, 1.2);
  ctx.restore();
  
  // Card suits - Heart (right)
  ctx.save();
  ctx.translate(cx + 45 * scale, cy);
  ctx.scale(scale, scale);
  drawHeart(ctx, 0, 0, 0.8);
  ctx.restore();
  
  // Card suits - Diamond (bottom)
  ctx.save();
  ctx.translate(cx, cy + 45 * scale);
  ctx.scale(scale, scale);
  drawDiamond(ctx, 0, 0, 1);
  ctx.restore();
  
  // Card suits - Club (left)
  ctx.save();
  ctx.translate(cx - 45 * scale, cy);
  ctx.scale(scale, scale);
  drawClub(ctx, 0, 0, 0.8);
  ctx.restore();
  
  // Center white circle
  ctx.beginPath();
  ctx.arc(cx, cy, 18 * scale, 0, Math.PI * 2);
  ctx.fillStyle = 'white';
  ctx.fill();
  
  // Center spade symbol
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(scale, scale);
  drawSpade(ctx, 0, 0, 0.9, '#DC2626');
  ctx.restore();
  
  return canvas;
}

function drawSpade(ctx, x, y, s, color = 'white') {
  ctx.fillStyle = color;
  ctx.beginPath();
  // Spade body
  ctx.moveTo(x, y - 12 * s);
  ctx.bezierCurveTo(x - 10 * s, y - 8 * s, x - 12 * s, y + 2 * s, x - 8 * s, y + 6 * s);
  ctx.bezierCurveTo(x - 4 * s, y + 9 * s, x - 2 * s, y + 6 * s, x, y + 4 * s);
  ctx.bezierCurveTo(x + 2 * s, y + 6 * s, x + 4 * s, y + 9 * s, x + 8 * s, y + 6 * s);
  ctx.bezierCurveTo(x + 12 * s, y + 2 * s, x + 10 * s, y - 8 * s, x, y - 12 * s);
  ctx.fill();
  // Stem
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
  // Three circles for club
  ctx.beginPath();
  ctx.arc(x - 6 * s, y - 2 * s, 6 * s, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(x + 6 * s, y - 2 * s, 6 * s, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(x, y - 10 * s, 6 * s, 0, Math.PI * 2);
  ctx.fill();
  // Stem
  ctx.beginPath();
  ctx.moveTo(x - 3 * s, y + 2 * s);
  ctx.lineTo(x - 4 * s, y + 12 * s);
  ctx.lineTo(x + 4 * s, y + 12 * s);
  ctx.lineTo(x + 3 * s, y + 2 * s);
  ctx.fill();
}

// Generate the main icon at 512x512 (Tauri CLI will generate all sizes from this)
const icon = drawIcon(512);
const iconPath = path.join(iconsDir, 'icon.png');
fs.writeFileSync(iconPath, icon.toBuffer('image/png'));
console.log('Generated: icon.png (512x512)');

console.log('\nNow run: npm run tauri icon src-tauri/icons/icon.png');
