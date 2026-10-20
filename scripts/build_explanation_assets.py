"""Reproduce question crops for authored archive explanations from verified PDFs."""
from pathlib import Path
import json,subprocess
import pypdfium2 as pdfium
root=Path(__file__).resolve().parents[1]
js="const fs=require('fs'),vm=require('vm'),c={};vm.createContext(c);vm.runInContext(fs.readFileSync('dist/archive-data.js','utf8'),c);process.stdout.write(JSON.stringify(c.EXAM_ARCHIVE));"
archive=json.loads(subprocess.check_output(['node','-e',js],cwd=root,encoding='utf-8'))
for content in sorted((root/'scripts').glob('explanations-????.json')):
 year=json.loads(content.read_text(encoding='utf-8'))['year']
 if year==2025:continue
 entry=archive[str(year)];dest=root/'dist/questions'/str(year);dest.mkdir(parents=True,exist_ok=True)
 with pdfium.PdfDocument(root/'dist'/entry['files']['am2_qs']) as pdf:
  for q in entry['am']:
   target=dest/f"{q['n']}.jpg"
   if target.exists():continue
   pg=pdf[q['page']-1];bm=pg.render(scale=1.8);im=bm.to_pil().convert('RGB');x0,y0,x1,y1=q['crop']
   im.crop((int(im.width*x0),int(im.height*y0),int(im.width*x1),int(im.height*y1))).save(target,quality=92)
   bm.close();pg.close()
 print('Explanation images:',year)
