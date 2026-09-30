import urllib.request,tarfile,io,pathlib,json,hashlib,base64
m=json.load(urllib.request.urlopen('https://registry.npmjs.org/pdfjs-dist/6.3.289')); data=urllib.request.urlopen(m['dist']['tarball']).read();assert 'sha512-'+base64.b64encode(hashlib.sha512(data).digest()).decode()==m['dist']['integrity'];t=tarfile.open(fileobj=io.BytesIO(data),mode='r:gz');root=pathlib.Path(__file__).resolve().parents[1]/'dist'/'vendor';root.mkdir(parents=True,exist_ok=True)
for name in ['package/build/pdf.mjs','package/build/pdf.worker.mjs','package/LICENSE']:(root/pathlib.Path(name).name).write_bytes(t.extractfile(name).read())
for entry in t.getmembers():
 if entry.isfile() and any(entry.name.startswith('package/'+p+'/') for p in ['cmaps','standard_fonts','wasm']):
  rel=pathlib.PurePosixPath(entry.name).relative_to('package');target=root/rel;target.parent.mkdir(parents=True,exist_ok=True);target.write_bytes(t.extractfile(entry).read())
(root/'pdfjs-version.json').write_text(json.dumps({'package':'pdfjs-dist','version':m['version'],'source':m['dist']['tarball'],'integrity':m['dist']['integrity']},indent=2),encoding='utf-8')
print(len(list(root.rglob('*'))))
