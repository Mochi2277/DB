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
