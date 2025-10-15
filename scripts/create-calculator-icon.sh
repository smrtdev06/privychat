#!/bin/bash

# Create a professional calculator icon using ImageMagick
# This will look like a legitimate calculator app for stealth purposes

# Create the base icon (1024x1024) with rounded corners
convert -size 1024x1024 \
  gradient:'#1e40af-#3b82f6' \
  -draw "roundrectangle 0,0,1024,1024,150,150" \
  resources/base.png

# Create calculator display area (dark blue rectangle)
convert -size 824x150 xc:'#0f172a' resources/display.png

# Create the main icon composition
convert resources/base.png \
  \( resources/display.png -geometry +100+120 \) -composite \
  -gravity northeast -pointsize 80 -font "DejaVu-Sans-Mono-Bold" -fill '#22d3ee' -annotate +140+170 "0" \
  resources/icon_stage1.png

# Add calculator buttons (4x4 grid)
convert resources/icon_stage1.png \
  -fill '#3b82f6' -draw "roundrectangle 120,340,280,500,20,20" \
  -fill '#3b82f6' -draw "roundrectangle 320,340,480,500,20,20" \
  -fill '#3b82f6' -draw "roundrectangle 520,340,680,500,20,20" \
  -fill '#6366f1' -draw "roundrectangle 720,340,880,500,20,20" \
  -fill '#3b82f6' -draw "roundrectangle 120,540,280,700,20,20" \
  -fill '#3b82f6' -draw "roundrectangle 320,540,480,700,20,20" \
  -fill '#3b82f6' -draw "roundrectangle 520,540,680,700,20,20" \
  -fill '#6366f1' -draw "roundrectangle 720,540,880,700,20,20" \
  -fill '#3b82f6' -draw "roundrectangle 120,740,280,900,20,20" \
  -fill '#3b82f6' -draw "roundrectangle 320,740,480,900,20,20" \
  -fill '#3b82f6' -draw "roundrectangle 520,740,680,900,20,20" \
  -fill '#6366f1' -draw "roundrectangle 720,740,880,900,20,20" \
  -fill '#3b82f6' -draw "roundrectangle 120,940,280,1100,20,20" \
  -fill '#3b82f6' -draw "roundrectangle 320,940,480,1100,20,20" \
  -fill '#10b981' -draw "roundrectangle 520,940,680,1100,20,20" \
  -fill '#6366f1' -draw "roundrectangle 720,940,880,1100,20,20" \
  resources/icon_stage2.png

# Add button text (white)
convert resources/icon_stage2.png \
  -font "DejaVu-Sans-Bold" -pointsize 70 -fill white -gravity center \
  -draw "text -322,-242 '7'" \
  -draw "text -122,-242 '8'" \
  -draw "text 78,-242 '9'" \
  -draw "text 278,-242 '÷'" \
  -draw "text -322,-42 '4'" \
  -draw "text -122,-42 '5'" \
  -draw "text 78,-42 '6'" \
  -draw "text 278,-42 '×'" \
  -draw "text -322,158 '1'" \
  -draw "text -122,158 '2'" \
  -draw "text 78,158 '3'" \
  -draw "text 278,158 '-'" \
  -draw "text -322,358 '0'" \
  -draw "text -122,358 '.'" \
  -draw "text 78,358 '='" \
  -draw "text 278,358 '+'" \
  resources/icon.png

# Clean up temporary files
rm -f resources/base.png resources/display.png resources/icon_stage1.png resources/icon_stage2.png

echo "✅ Calculator icon created: resources/icon.png"
