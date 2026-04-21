import sys
import os
try:
    from PIL import Image
    import colorsys
except ImportError:
    print("Missing PIL. Installing...")
    os.system("pip3 install Pillow --break-system-packages")
    from PIL import Image
    import colorsys

img_path = "/home/mudda5ir/PROJECTS/ms.solutions/BRAND KIT /LOGO.png"
if not os.path.exists(img_path):
    print("File not found")
    sys.exit(1)

img = Image.open(img_path)
img = img.convert("RGB")
img = img.resize((150, 150))
colors = img.getcolors(150*150)
sorted_colors = sorted(colors, key=lambda t: t[0], reverse=True)

for count, color in sorted_colors[:5]:
    hex_color = "#{:02x}{:02x}{:02x}".format(color[0], color[1], color[2])
    print(f"Color: {hex_color} - Count: {count}")
