// This script generates placeholder PWA icons
// In production, replace these with your actual app icons

const fs = require('fs');
const path = require('path');

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

const svgIcon = `
<svg width="SIZE" height="SIZE" viewBox="0 0 SIZE SIZE" xmlns="http://www.w3.org/2000/svg">
  <rect width="SIZE" height="SIZE" fill="#8b5cf6" rx="SIZE_RADIUS"/>
  <text x="50%" y="50%" font-family="system-ui, -apple-system, sans-serif" font-size="SIZE_FONT" font-weight="bold" fill="white" text-anchor="middle" dominant-baseline="middle">F</text>
</svg>
`;

// Create icons directory if it doesn't exist
const publicDir = path.join(__dirname, '..', 'public');

sizes.forEach(size => {
  const radius = Math.round(size * 0.1);
  const fontSize = Math.round(size * 0.5);
  const svg = svgIcon
    .replace(/SIZE/g, size)
    .replace(/SIZE_RADIUS/g, radius)
    .replace(/SIZE_FONT/g, fontSize);
  
  const filename = path.join(publicDir, `icon-${size}x${size}.svg`);
  
  // For now, create SVG placeholders
  // In production, these should be converted to PNG
  fs.writeFileSync(filename, svg);
  console.log(`Created ${filename}`);
});

console.log('\nNote: These are SVG placeholders. For production, convert to PNG format.');
console.log('You can use tools like:');
console.log('- https://cloudconvert.com/svg-to-png');
console.log('- ImageMagick: convert icon-512x512.svg icon-512x512.png');
console.log('- Or create proper icons using a design tool');