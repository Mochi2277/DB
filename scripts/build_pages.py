from pathlib import Path
base=Path(__file__).resolve().parents[1]
s=(base/'api/worker.mjs').read_text(encoding='utf-8').replace('export default {async fetch','const apiHandler={async fetch')
s+='\nexport default {fetch(request,env,ctx){return new URL(request.url).pathname.startsWith("/api/")?apiHandler.fetch(request,env,ctx):env.ASSETS.fetch(request);}};\n'
(base/'dist/_worker.js').write_text(s,encoding='utf-8')
