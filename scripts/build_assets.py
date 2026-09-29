"""Fetch hash-verified official PDFs and reproduce the display images."""
from pathlib import Path
import hashlib, json, urllib.request
import pypdfium2 as pdfium
from PIL import Image

base=Path(__file__).resolve().parents[1]/'dist'
for item in json.loads((base/'sources.json').read_text(encoding='utf-8')):
    path=base/item['file']
    path.parent.mkdir(parents=True,exist_ok=True)
    data=path.read_bytes() if path.exists() else urllib.request.urlopen(item['url'],timeout=90).read()
    if hashlib.sha256(data).hexdigest()!=item['sha256']:
        raise ValueError('Official source changed; review before publishing: '+item['file'])
    path.write_bytes(data)
    name=path.stem.removeprefix('2025r07a_db_')
    dest=base/'pages'/name;dest.mkdir(parents=True,exist_ok=True)
    with pdfium.PdfDocument(path) as doc:
        for i in range(len(doc)):
            page=doc[i];bitmap=page.render(scale=1.8)
            im=bitmap.to_pil().convert('RGB');im.save(dest/f'{i+1}.jpg',quality=88)
            bitmap.close();page.close()
    print('Verified and rendered',name)
ranges=[(3,.075,.395),(3,.395,.64),(4,.075,.525),(4,.525,.91),(5,.075,.34),(5,.34,.82),(6,.075,.41),(7,.075,.89),(8,.075,.70),(8,.70,.89),(9,.075,.60),(10,.075,.88),(11,.075,.355),(11,.355,.70),(12,.075,.40),(12,.40,.59),(12,.59,.80),(13,.075,.365),(13,.365,.555),(13,.555,.90),(14,.075,.275),(14,.275,.59),(15,.075,.705),(15,.705,.89),(16,.075,.34)]
(base/'questions').mkdir(exist_ok=True)
for n,(pg,y0,y1) in enumerate(ranges,1):
    with Image.open(base/f'pages/am2_qs/{pg}.jpg') as im:
        im.crop((int(im.width*.10),int(im.height*y0),int(im.width*.95),int(im.height*y1))).save(base/f'questions/{n}.jpg',quality=92)
