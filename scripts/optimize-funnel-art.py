from pathlib import Path
from PIL import Image
root = Path('microlandings/public/top5/art')
for source in root.glob('*.png'):
    image = Image.open(source).convert('RGBA')
    target = source.with_suffix('.webp')
    image.save(target, 'WEBP', quality=90, method=6)
    print(f'{source.name}: {source.stat().st_size / 1024:.0f} KB -> {target.name}: {target.stat().st_size / 1024:.0f} KB')
