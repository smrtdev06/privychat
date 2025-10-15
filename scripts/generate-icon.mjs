import fs from 'fs';
import { createCanvas } from 'canvas';

// Create a 1024x1024 icon (standard size for app icons)
const canvas = createCanvas(1024, 1024);
const ctx = canvas.getContext('2d');

// Background - dark blue gradient
const gradient = ctx.createLinearGradient(0, 0, 0, 1024);
gradient.addColorStop(0, '#1e3a8a');
gradient.addColorStop(1, '#1e40af');
ctx.fillStyle = gradient;
ctx.fillRect(0, 0, 1024, 1024);

// Add rounded corners effect by drawing a solid roundrect
ctx.globalCompositeOperation = 'destination-in';
ctx.beginPath();
const radius = 180;
ctx.moveTo(radius, 0);
ctx.lineTo(1024 - radius, 0);
ctx.quadraticCurveTo(1024, 0, 1024, radius);
ctx.lineTo(1024, 1024 - radius);
ctx.quadraticCurveTo(1024, 1024, 1024 - radius, 1024);
ctx.lineTo(radius, 1024);
ctx.quadraticCurveTo(0, 1024, 0, 1024 - radius);
ctx.lineTo(0, radius);
ctx.quadraticCurveTo(0, 0, radius, 0);
ctx.closePath();
ctx.fill();
ctx.globalCompositeOperation = 'source-over';

// Calculator display
ctx.fillStyle = '#0f172a';
ctx.fillRect(100, 120, 824, 150);
ctx.fillStyle = '#22d3ee';
ctx.font = 'bold 80px monospace';
ctx.textAlign = 'right';
ctx.fillText('123.45', 880, 210);

// Calculator buttons grid
const buttonColors = {
  number: '#3b82f6',
  operator: '#6366f1',
  equals: '#10b981'
};

const buttons = [
  ['7', '8', '9', '÷'],
  ['4', '5', '6', '×'],
  ['1', '2', '3', '-'],
  ['0', '.', '=', '+']
];

const buttonSize = 160;
const buttonGap = 40;
const startX = 120;
const startY = 340;

buttons.forEach((row, rowIndex) => {
  row.forEach((btn, colIndex) => {
    const x = startX + colIndex * (buttonSize + buttonGap);
    const y = startY + rowIndex * (buttonSize + buttonGap);
    
    // Determine button color
    let color = buttonColors.number;
    if (['+', '-', '×', '÷'].includes(btn)) color = buttonColors.operator;
    if (btn === '=') color = buttonColors.equals;
    
    // Draw button with rounded corners
    ctx.fillStyle = color;
    ctx.beginPath();
    const br = 20; // button radius
    ctx.moveTo(x + br, y);
    ctx.lineTo(x + buttonSize - br, y);
    ctx.quadraticCurveTo(x + buttonSize, y, x + buttonSize, y + br);
    ctx.lineTo(x + buttonSize, y + buttonSize - br);
    ctx.quadraticCurveTo(x + buttonSize, y + buttonSize, x + buttonSize - br, y + buttonSize);
    ctx.lineTo(x + br, y + buttonSize);
    ctx.quadraticCurveTo(x, y + buttonSize, x, y + buttonSize - br);
    ctx.lineTo(x, y + br);
    ctx.quadraticCurveTo(x, y, x + br, y);
    ctx.closePath();
    ctx.fill();
    
    // Button shadow for depth
    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.fillRect(x, y + buttonSize - 10, buttonSize, 10);
    
    // Button text
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 70px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(btn, x + buttonSize / 2, y + buttonSize / 2);
  });
});

// Save the icon
const buffer = canvas.toBuffer('image/png');
fs.writeFileSync('resources/icon.png', buffer);
console.log('✅ Icon generated: resources/icon.png');
