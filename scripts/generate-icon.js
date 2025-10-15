const fs = require('fs');
const { createCanvas } = require('canvas');

// Create a 1024x1024 icon (standard size for app icons)
const canvas = createCanvas(1024, 1024);
const ctx = canvas.getContext('2d');

// Background - dark blue gradient
const gradient = ctx.createLinearGradient(0, 0, 0, 1024);
gradient.addColorStop(0, '#1e3a8a');
gradient.addColorStop(1, '#1e40af');
ctx.fillStyle = gradient;
ctx.fillRect(0, 0, 1024, 1024);

// Add rounded corners
ctx.globalCompositeOperation = 'destination-in';
ctx.beginPath();
ctx.roundRect(0, 0, 1024, 1024, 180);
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
    
    // Draw button
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.roundRect(x, y, buttonSize, buttonSize, 20);
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
