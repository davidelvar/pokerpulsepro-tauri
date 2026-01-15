const { createCanvas } = require('canvas');
const fs = require('fs');
const path = require('path');

function drawIcon(ctx, size) {
  const s = size / 512;
  
  // Background gradient
  const grad = ctx.createLinearGradient(0, 0, size, size);
  grad.addColorStop(0, '#10b981');
  grad.addColorStop(1, '#059669');
  
  // Rounded rectangle background
  const r = 96 * s;
  const m = 32 * s;
  
  // Draw rounded rect manually (roundRect may not be available)
  ctx.beginPath();
  ctx.moveTo(m + r, m);
  ctx.lineTo(size - m - r, m);
  ctx.arcTo(size - m, m, size - m, m + r, r);
  ctx.lineTo(size - m, size - m - r);
  ctx.arcTo(size - m, size - m, size - m - r, size - m, r);
  ctx.lineTo(m + r, size - m);
  ctx.arcTo(m, size - m, m, size - m - r, r);
  ctx.lineTo(m, m + r);
  ctx.arcTo(m, m, m + r, m, r);
  ctx.closePath();
  
  ctx.fillStyle = grad;
  ctx.shadowColor = 'rgba(0,0,0,0.3)';
  ctx.shadowBlur = 16 * s;
  ctx.shadowOffsetY = 4 * s;
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;
  
  // Spade symbol
  ctx.save();
  ctx.translate(size/2, size/2 + 24*s);
  ctx.fillStyle = '#ffffff';
  
  const scale = s * 1.1;
  
  // Top of spade (heart shape inverted)
  ctx.beginPath();
  ctx.moveTo(0, -140 * scale);
  ctx.bezierCurveTo(
    -30 * scale, -120 * scale,
    -110 * scale, -60 * scale,
    -110 * scale, 30 * scale
  );
  ctx.bezierCurveTo(
    -110 * scale, 90 * scale,
    -70 * scale, 115 * scale,
    -35 * scale, 115 * scale
  );
  ctx.bezierCurveTo(
    -15 * scale, 115 * scale,
    0, 90 * scale,
    0, 70 * scale
  );
  ctx.bezierCurveTo(
    0, 90 * scale,
    15 * scale, 115 * scale,
    35 * scale, 115 * scale
  );
  ctx.bezierCurveTo(
    70 * scale, 115 * scale,
    110 * scale, 90 * scale,
    110 * scale, 30 * scale
  );
  ctx.bezierCurveTo(
    110 * scale, -60 * scale,
    30 * scale, -120 * scale,
    0, -140 * scale
  );
  ctx.fill();
  
  // Stem
  ctx.beginPath();
  ctx.moveTo(-25 * scale, 90 * scale);
  ctx.lineTo(-35 * scale, 160 * scale);
  ctx.lineTo(35 * scale, 160 * scale);
  ctx.lineTo(25 * scale, 90 * scale);
  ctx.bezierCurveTo(15 * scale, 110 * scale, -15 * scale, 110 * scale, -25 * scale, 90 * scale);
  ctx.fill();
  
  ctx.restore();
}

const iconsDir = path.join(__dirname, 'src-tauri', 'icons');

// Generate icons at different sizes
const sizes = [
  { size: 512, name: 'icon.png' },
  { size: 256, name: '128x128@2x.png' },
  { size: 128, name: '128x128.png' },
  { size: 32, name: '32x32.png' },
];

sizes.forEach(({ size, name }) => {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');
  drawIcon(ctx, size);
  
  const buffer = canvas.toBuffer('image/png');
  const filePath = path.join(iconsDir, name);
  fs.writeFileSync(filePath, buffer);
  console.log(`Generated: ${name} (${size}x${size})`);
});

console.log('\nPNG icons generated successfully!');
console.log('\nNote: You still need to convert icon.png to icon.ico for Windows.');
console.log('Use: npx @tauri-apps/cli icon src-tauri/icons/icon.png');
