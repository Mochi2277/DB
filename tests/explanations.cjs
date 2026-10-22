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
// 2022: missing author survives two left joins; NOT EXISTS selects leaves.
assert.deepEqual(db.prepare("WITH doc(id,author,approver) AS (VALUES(4,500,100)), employee(id,name) AS (VALUES(100,'承認者')) SELECT doc.id,a.name AS author,b.name AS approver FROM doc LEFT JOIN employee a ON a.id=doc.author LEFT JOIN employee b ON b.id=doc.approver").all().map(x=>({...x})),[{id:4,author:null,approver:'承認者'}]);
assert.deepEqual(db.prepare("WITH employee(id,boss) AS (VALUES('S001',NULL),('S002','S001'),('S003','S001'),('S004','S003'),('S005',NULL),('S006','S005'),('S007','S006')) SELECT x.id FROM employee x WHERE NOT EXISTS(SELECT 1 FROM employee y WHERE y.boss=x.id) ORDER BY x.id").all().map(x=>x.id),['S002','S004','S007']);
// 2021: moving right-side conditions to WHERE loses employees without AP.
const qualifications="WITH cert(id,q) AS (VALUES('S001','FE'),('S001','AP'),('S001','DB'),('S002','FE'),('S002','SM'),('S003','FE'),('S004','AP'),('S005',NULL)) ";
assert.deepEqual(db.prepare(qualifications+"SELECT c1.id,c2.q FROM cert c1 LEFT JOIN cert c2 ON c1.id=c2.id AND c1.q='FE' AND c2.q='AP' WHERE c1.q='FE' ORDER BY c1.id").all().map(x=>({...x})),[{id:'S001',q:'AP'},{id:'S002',q:null},{id:'S003',q:null}]);
assert.equal(db.prepare(qualifications+"SELECT count(*) AS n FROM cert c1 LEFT JOIN cert c2 ON c1.id=c2.id WHERE c1.q='FE' AND c2.q='AP'").get().n,1);
assert.deepEqual(db.prepare("WITH items(rowid,member,item,value) AS (VALUES(1,'0111','name','情報太郎'),(2,'0111','date','2021-02-05'),(3,'0112','name','情報花子'),(4,'0112','date','2021-01-30'),(5,'0112','date','2021-02-01'),(6,'0113','name','情報次郎')) SELECT member,MAX(CASE WHEN item='name' THEN value END) AS name,MAX(CASE WHEN item='date' THEN value END) AS date FROM items WHERE rowid IN(SELECT MAX(rowid) FROM items GROUP BY member,item) GROUP BY member ORDER BY member").all().map(x=>({...x})),[{member:'0111',name:'情報太郎',date:'2021-02-05'},{member:'0112',name:'情報花子',date:'2021-02-01'},{member:'0113',name:'情報次郎',date:null}]);
assert.equal(60*32,80*(32-8));assert.ok(60*31>80*(31-8));
// Late award: payment-date selection misses it; unprocessed selection retains it.
assert.deepEqual(db.prepare("WITH payment(id,paid,created,processed) AS (VALUES(1,'2021-10-01','2021-10-03',0),(2,'2021-10-03','2021-10-03',0),(3,'2021-10-01','2021-10-01',1)) SELECT id FROM payment WHERE paid='2021-10-03' ORDER BY id").all().map(x=>x.id),[2]);
assert.deepEqual(db.prepare("WITH payment(id,paid,created,processed) AS (VALUES(1,'2021-10-01','2021-10-03',0),(2,'2021-10-03','2021-10-03',0),(3,'2021-10-01','2021-10-01',1)) SELECT id FROM payment WHERE processed=0 ORDER BY id").all().map(x=>x.id),[1,2]);
console.log('2021/2022 SQL examples: outer joins, latest-value pivot, leaf selection, late point awards and server capacity passed.');
// 2020: FULL JOIN must retain IDs from either side; SAVEPOINT undoes only later work.
assert.deepEqual(db.prepare("WITH r(id,n1) AS (VALUES(1,'AAA'),(2,'BBB'),(3,'CCC')), s(id,n2) AS (VALUES(2,'bbb'),(3,'ccc'),(4,'ddd')) SELECT COALESCE(r.id,s.id) AS id,n1,n2 FROM r FULL JOIN s ON r.id=s.id ORDER BY id").all().map(x=>({...x})),[{id:1,n1:'AAA',n2:null},{id:2,n1:'BBB',n2:'bbb'},{id:3,n1:'CCC',n2:'ccc'},{id:4,n1:null,n2:'ddd'}]);
db.exec('CREATE TABLE savepoint_example(x); BEGIN; INSERT INTO savepoint_example VALUES(1); SAVEPOINT midway; INSERT INTO savepoint_example VALUES(2); ROLLBACK TO midway; RELEASE midway; COMMIT;');
assert.deepEqual(db.prepare('SELECT x FROM savepoint_example').all().map(x=>x.x),[1]);
console.log('2020: FULL JOIN/COALESCE and partial rollback verified.');
// 2019: difference-of-differences equals intersection, including empty/disjoint sets.
for(const [rset,sset] of [[[],[]],[[1,2],[2,3]],[[1],[2]],[[1,2],[1,2]]]){
 const difference=(a,b)=>a.filter(x=>!b.includes(x));
 assert.deepEqual(difference(rset,difference(rset,sset)),rset.filter(x=>sset.includes(x)));
}
// One application per member/event; multiple lottery outcomes may follow it.
db.exec('PRAGMA foreign_keys=ON; CREATE TABLE application2019(event,member,PRIMARY KEY(event,member)); CREATE TABLE lottery2019(event,member,slot,result,PRIMARY KEY(event,member,slot),FOREIGN KEY(event,member) REFERENCES application2019(event,member)); INSERT INTO application2019 VALUES(1,101); INSERT INTO lottery2019 VALUES(1,101,1,0),(1,101,2,1);');
assert.throws(()=>db.exec('INSERT INTO application2019 VALUES(1,101)'));
assert.throws(()=>db.exec('INSERT INTO lottery2019 VALUES(1,102,1,1)'));
assert.equal(db.prepare('SELECT count(*) AS n FROM lottery2019 WHERE member=101').get().n,2);
console.log('2019: set identity, application uniqueness and multistage lottery references passed.');
// 2018: UNIQUE(ID,item) allows other items and other products, not a second value.
db.exec("CREATE TABLE eav2018(id INTEGER NOT NULL,item TEXT NOT NULL,value TEXT NOT NULL,UNIQUE(id,item)); INSERT INTO eav2018 VALUES(1,'name','light'),(1,'price','400'),(2,'name','light');");
assert.throws(()=>db.exec("INSERT INTO eav2018 VALUES(1,'name','different')"));
assert.deepEqual(db.prepare("WITH part(id,name,parent) AS (VALUES(1,'N11-parent',NULL),(2,'N11-child',1),(3,'other',NULL)) SELECT b1.id,b2.id AS parent FROM part b1 LEFT JOIN part b2 ON b1.parent=b2.id WHERE b1.name LIKE '%N11%' ORDER BY b1.id").all().map(x=>({...x})),[{id:1,parent:null},{id:2,parent:1}]);
// Site numbers repeat between customers; the whole composite key must be referenced.
db.exec('CREATE TABLE site2018(customer,site,PRIMARY KEY(customer,site)); CREATE TABLE detail2018(id PRIMARY KEY,customer,site,FOREIGN KEY(customer,site) REFERENCES site2018(customer,site)); INSERT INTO site2018 VALUES(1,1),(2,1); INSERT INTO detail2018 VALUES(1,1,1),(2,2,1);');
assert.throws(()=>db.exec('INSERT INTO detail2018 VALUES(3,3,1)'));
console.log('2018: EAV uniqueness, parent outer join and composite site references passed.');
