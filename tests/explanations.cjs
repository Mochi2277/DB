const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),{DatabaseSync}=require('node:sqlite');
const d=require('../scripts/explanations-2025.json'),r=require('../dist/explanation-render.js');
const db=new DatabaseSync(':memory:');
assert.deepEqual({...db.prepare('SELECT 1 AND NULL AS a, 0 AND NULL AS b').get()},{a:null,b:0});
db.exec('CREATE TABLE a(x); CREATE TABLE b(x);');
const sets=[[],[1],[2],[1,2],[1,1],[1,1,2]];
for(const a of sets)for(const b of sets){
 db.exec('DELETE FROM a; DELETE FROM b;');for(const v of a)db.prepare('INSERT INTO a VALUES (?)').run(v);for(const v of b)db.prepare('INSERT INTO b VALUES (?)').run(v);
 const actual=db.prepare(d.am.find(q=>q.n===9).code).all().map(r=>r.x);
 const expected=[...new Set([...a,...b])].filter(x=>a.includes(x)!==b.includes(x)).sort();assert.deepEqual(actual,expected);
}
db.exec('PRAGMA foreign_keys=ON; CREATE TABLE orders(id PRIMARY KEY); CREATE TABLE detail(id, orderid REFERENCES orders(id) ON DELETE CASCADE); INSERT INTO orders VALUES(1),(2); INSERT INTO detail VALUES(10,1),(11,1),(12,2); DELETE FROM orders WHERE id=1;');
assert.deepEqual(db.prepare('SELECT id FROM detail').all().map(r=>r.id),[12]);
for(let a1=0;a1<16;a1++)for(let a2=0;a2<16;a2++)for(let d1=0;d1<16;d1++){const av=d1^a2,ap=a1^a2;assert.equal(d1^av,a2);assert.equal(ap^(d1^av),a1);}
// Exhaustive finite relations: division formula equals the all-required-pairs definition.
for(let mask=0;mask<16;mask++)for(let sm=0;sm<4;sm++){
 const pairs=[[0,0],[0,1],[1,0],[1,1]].filter((_,i)=>mask&(1<<i)),s=[0,1].filter((_,i)=>sm&(1<<i)),c=[...new Set(pairs.map(p=>p[0]))];
 const missing=c.flatMap(x=>s.filter(y=>!pairs.some(p=>p[0]===x&&p[1]===y)).map(y=>[x,y]));
 assert.deepEqual(c.filter(x=>!missing.some(p=>p[0]===x)),c.filter(x=>s.every(y=>pairs.some(p=>p[0]===x&&p[1]===y))));
}
assert.equal(.9*2+.1*20,3.8);
assert.equal(new Set([222,222]).size,1);assert.equal(new Set([222,111]).size,2);
const c={};c.window=c;vm.createContext(c);for(const f of ['data.js','pm-data.js','explanations-data.js'])vm.runInContext(fs.readFileSync(require('path').join(__dirname,'../dist',f),'utf8'),c);
assert.equal(d.am.length,25);for(const q of d.am){assert.equal(q.answer,c.EXAM[q.n-1].answer);assert.deepEqual(Object.keys(q.choices),['ア','イ','ウ','エ']);assert.ok(q.reason.length&&q.tip);assert.ok(r.am(q).includes('復習ポイント'));}
assert.equal(d.pm.fields.length,20);for(const f of d.pm.fields){assert.ok(c.PM_FIELDS['pm1-1'].some(o=>o.id===f.id));assert.ok(f.reason.length&&f.pages.length&&f.evidence&&f.pitfall);}
assert.equal(JSON.stringify(c.EXPLANATIONS),JSON.stringify(d));assert.equal(r.esc('<script>"&'), '&lt;script&gt;&quot;&amp;');
const pmHtml=fs.readFileSync(require('path').join(__dirname,'../dist/explain-2025-pm1-1.html'),'utf8');for(const f of d.pm.fields)assert.ok(pmHtml.includes(`id="field-${f.id}"`));
console.log('Explanations: 25 official answers, 20 PM fields, SQL set/NULL/cascade examples, 4096 XOR cases, division and HTML escaping passed.');

// Every authored year must have complete, source-matched explanations and generated pages.
const path=require('node:path'),base=path.join(__dirname,'..');
vm.runInContext(fs.readFileSync(path.join(base,'dist/archive-data.js'),'utf8'),c);
for(const name of fs.readdirSync(path.join(base,'scripts')).filter(n=>/^explanations-\d{4}\.json$/.test(n))){
 const yearData=JSON.parse(fs.readFileSync(path.join(base,'scripts',name),'utf8'));
 const year=yearData.year,entry=c.EXAM_ARCHIVE[year];
 const am=year===2025?c.EXAM:entry.am,pm=year===2025?c.PM_FIELDS['pm1-1']:entry.fields['pm1-1'];
 assert.equal(yearData.am.length,25);assert.equal(new Set(yearData.am.map(q=>q.n)).size,25);
 for(const q of yearData.am){
  assert.equal(q.answer,am.find(a=>a.n===q.n).answer,`${year} AM ${q.n}`);
  assert.deepEqual(Object.keys(q.choices),['ア','イ','ウ','エ']);
  assert.ok(q.reason.every(p=>p.length>20)&&q.reason.length&&q.tip);
  const html=fs.readFileSync(path.join(base,`dist/explain-${year}-am2-${String(q.n).padStart(2,'0')}.html`),'utf8');
  assert.ok(html.includes(r.esc(q.title)));assert.ok(html.includes(`year=${year}`));
 }
 assert.deepEqual(yearData.pm.fields.map(f=>f.id).sort(),Array.from(pm,f=>f.id).sort());
 const html=fs.readFileSync(path.join(base,`dist/explain-${year}-pm1-1.html`),'utf8');
 for(const f of yearData.pm.fields){assert.ok(f.reason.length&&f.pages.length&&f.evidence&&f.pitfall);assert.ok(html.includes(`id="field-${f.id}"`));}
 assert.equal(JSON.stringify(c.EXPLANATIONS_BY_YEAR[year]),JSON.stringify(yearData));
 console.log(`${year}: 25 AM answers and ${yearData.pm.fields.length} PM explanations verified.`);
}
// 2024: aggregate ignores unmatched NULL, leaves are children absent from parents.
assert.equal(db.prepare('WITH t(x) AS (VALUES(50),(NULL),(250)) SELECT AVG(x) AS v FROM t').get().v,150);
assert.deepEqual(db.prepare("WITH edges(parent,child) AS (VALUES('A','B'),('A','C'),('B','D'),('B','E'),('C','F'),('F','G')) SELECT child AS v FROM edges EXCEPT SELECT parent FROM edges ORDER BY v").all().map(x=>x.v),['D','E','G']);
assert.ok(95n**8n<10n**16n);assert.ok(95n**9n>10n**16n);
// 2023: full outer join retains both unmatched sides; RANK skips after ties.
assert.deepEqual(db.prepare('WITH a(x) AS (VALUES(100),(200),(300),(400)), b(x) AS (VALUES(200),(400),(600),(800)) SELECT COALESCE(a.x,b.x) AS v FROM a FULL OUTER JOIN b ON a.x=b.x WHERE a.x IS NULL OR b.x IS NULL ORDER BY v').all().map(x=>x.v),[100,300,600,800]);
assert.deepEqual(db.prepare('WITH scores(x) AS (VALUES(80),(80),(63)) SELECT RANK() OVER(ORDER BY x DESC) AS r FROM scores ORDER BY x DESC').all().map(x=>x.r),[1,1,3]);
