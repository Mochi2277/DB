const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),vm=require('node:vm');
const dir=path.join(__dirname,'../dist'),read=f=>fs.readFileSync(path.join(dir,f),'utf8');
const urls=[...read('sitemap.xml').matchAll(/<loc>(.*?)<\/loc>/g)].map(m=>m[1]);
const expectedPages=22+26*fs.readdirSync(path.join(__dirname,'../scripts')).filter(f=>/^explanations-\d{4}\.json$/.test(f)).length;
assert.equal(urls.length,expectedPages);assert.equal(new Set(urls).size,expectedPages);
const titles=new Set(),descriptions=new Set();
for(const url of urls){
 const route=new URL(url).pathname,file=route==='/'?'index.html':route.slice(1)+'.html',html=read(file);
 assert.ok(html.includes(`rel="canonical" href="${url}"`),file+' canonical');
 const title=html.match(/<title>(.*?)<\/title>/)[1],description=html.match(/name="description" content="([^"]+)"/)[1];
 assert.ok(!titles.has(title));titles.add(title);assert.ok(!descriptions.has(description));descriptions.add(description);
 assert.equal((html.match(/<h1[ >]/g)||[]).length,1,file+' h1');
 for(const match of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g))JSON.parse(match[1]);
 for(const match of html.matchAll(/(?:href|src)="([^"#?]+)(?:[?#][^"]*)?"/g)){
  const href=match[1];if(/^(https?:|mailto:|data:)/.test(href))continue;
  assert.ok(fs.existsSync(path.join(dir,href==='./'?'index.html':href)),file+' missing '+href);
 }
 if(file.startsWith('db-')){
  assert.equal((html.match(/<th scope="row">問/g)||[]).length,25,file);
  assert.equal((html.match(/class="rakuten-embed"/g)||[]).length,4);
 }
 for(const link of html.matchAll(/<a [^>]*href="https:\/\/hb\.afl\.rakuten\.co\.jp[^>]+>/g))assert.ok(link[0].includes('rel="nofollow sponsored noopener"'));
}
assert.ok(!urls.some(u=>/history|api|\?/.test(u)));
assert.match(read('history.html'),/name="robots" content="noindex/);
assert.match(read('404.html'),/name="robots" content="noindex/);
assert.match(read('robots.txt'),/Sitemap: https:\/\/db-enshushitsu.pages.dev\/sitemap.xml/);
for(const font of ['Regular','Bold'])assert.equal(fs.readFileSync(path.join(dir,`fonts/BIZUDPGothic-${font}.woff2`)).subarray(0,4).toString(),'wOF2');
// Exercise the actual initial question selection, including malformed query values.
const setup=read('app.js').split('const modes=')[0];
for(const [query,q] of [['',0],['?question=25',24],['?question=2',1],['?question=-1',0],['?question=26',0],['?question=abc',0],['?question=1.5',0]]){
 const context={document:{},window:{EXAM:[]},URLSearchParams,location:{search:query}};
 vm.createContext(context);vm.runInContext(setup+';globalThis.initialQ=state.q;',context);assert.equal(context.initialQ,q);
}
console.log('SEO: canonical pages, 17 answer tables, internal links, structured data, ads, fonts and question deep links passed.');

require('./explanations.cjs');
