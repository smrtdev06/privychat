#!/bin/bash

# Create a calculator splash screen (2732x2732) for iOS and Android
# This will show during app launch to maintain the stealth calculator disguise

# Create base with blue gradient
convert -size 2732x2732 \
  gradient:'#1e40af-#3b82f6' \
  resources/splash-base.png

# Create the calculator display area
convert -size 2200x400 xc:'#0f172a' resources/splash-display.png

# Composite the display onto the base
convert resources/splash-base.png \
  \( resources/splash-display.png -geometry +266+600 \) -composite \
  -gravity north -pointsize 200 -font "DejaVu-Sans-Mono-Bold" -fill '#22d3ee' -annotate +900+750 "0" \
  resources/splash-stage1.png

# Add calculator buttons (4x4 grid)
# Button dimensions: 425x425, gap: 100
convert resources/splash-stage1.png \
  -fill '#3b82f6' -draw "roundrectangle 316,1100,741,1525,40,40" \
  -fill '#3b82f6' -draw "roundrectangle 841,1100,1266,1525,40,40" \
  -fill '#3b82f6' -draw "roundrectangle 1366,1100,1791,1525,40,40" \
  -fill '#6366f1' -draw "roundrectangle 1891,1100,2316,1525,40,40" \
  -fill '#3b82f6' -draw "roundrectangle 316,1625,741,2050,40,40" \
  -fill '#3b82f6' -draw "roundrectangle 841,1625,1266,2050,40,40" \
  -fill '#3b82f6' -draw "roundrectangle 1366,1625,1791,2050,40,40" \
  -fill '#6366f1' -draw "roundrectangle 1891,1625,2316,2050,40,40" \
  -fill '#3b82f6' -draw "roundrectangle 316,2150,741,2575,40,40" \
  -fill '#3b82f6' -draw "roundrectangle 841,2150,1266,2575,40,40" \
  -fill '#3b82f6' -draw "roundrectangle 1366,2150,1791,2575,40,40" \
  -fill '#6366f1' -draw "roundrectangle 1891,2150,2316,2575,40,40" \
  -fill '#3b82f6' -draw "roundrectangle 316,2675,741,3100,40,40" \
  -fill '#3b82f6' -draw "roundrectangle 841,2675,1266,3100,40,40" \
  -fill '#10b981' -draw "roundrectangle 1366,2675,1791,3100,40,40" \
  -fill '#6366f1' -draw "roundrectangle 1891,2675,2316,3100,40,40" \
  resources/splash-stage2.png

# Add button text
convert resources/splash-stage2.png \
  -font "DejaVu-Sans-Bold" -pointsize 180 -fill white -gravity center \
  -draw "text -838,-529 '7'" \
  -draw "text -313,-529 '8'" \
  -draw "text 212,-529 '9'" \
  -draw "text 737,-529 '÷'" \
  -draw "text -838,-4 '4'" \
  -draw "text -313,-4 '5'" \
  -draw "text 212,-4 '6'" \
  -draw "text 737,-4 '×'" \
  -draw "text -838,521 '1'" \
  -draw "text -313,521 '2'" \
  -draw "text 212,521 '3'" \
  -draw "text 737,521 '-'" \
  -draw "text -838,1046 '0'" \
  -draw "text -313,1046 '.'" \
  -draw "text 212,1046 '='" \
  -draw "text 737,1046 '+'" \
  resources/splash.png

# Clean up
rm -f resources/splash-base.png resources/splash-display.png resources/splash-stage1.png resources/splash-stage2.png

echo "✅ Calculator splash screen created: resources/splash.png"
