const assert=require('node:assert/strict');
const fs=require('node:fs');const path=require('node:path');const crypto=require('node:crypto');
globalThis.window=globalThis;require('../dist/archive-data.js');require('../dist/data.js');require('../dist/pm-data.js');const grader=require('../dist/grading.js');
const data=globalThis.EXAM_ARCHIVE;assert.equal(Object.keys(data).length,17);let total=25,fields=109,auto=97;
for(let y=2009;y<=2025;y++){
 const exam=data[y];assert.equal(exam.id,`${y}-db`);assert.equal(Object.keys(exam.files).length,8);
 for(const file of Object.values(exam.files))assert.ok(fs.existsSync(path.join(__dirname,'../dist',file)),file);
 if(y===2025)continue;
 assert.equal(exam.am.length,25);total+=exam.am.length;
 exam.am.forEach((q,i)=>{assert.equal(q.n,i+1);assert.ok(['ア','イ','ウ','エ'].includes(q.answer));assert.ok(q.crop[1]<q.crop[3]&&q.crop[3]<=1);});
 for(const mode of ['pm1','pm2']){
  const meta=exam.pmMeta[mode];assert.equal(meta.questions.length,mode==='pm1'?3:2);
  meta.questions.forEach((q,i)=>{
   assert.ok(q.start<=q.end);assert.ok(q.end<=meta.pages);const fs=exam.fields[`${mode}-${i+1}`];assert.ok(fs.length);assert.equal(new Set(fs.map(f=>f.id)).size,fs.length);
   for(const f of fs){fields++;assert.ok(f.section>=1&&f.section<=q.sets);assert.ok(f.answerPage<=meta.answerPages);if(f.kind!=='manual'){auto++;assert.equal(grader.grade(f,Array.isArray(f.answer)?f.answer[0]:f.answer,{question:`${y}-${mode}-${i+1}`}), 'correct');assert.equal(grader.grade(f,'this is not an answer'), 'review');}}
  });
 }
}
const a=data[2024].fields['pm1-1'].find(f=>f.label==='a'&&f.section===1);
assert.equal(grader.grade(a,'プレゼント相手アカウント#,クーポン#,受講生アカウント#'),'correct');
const b=data[2024].fields['pm1-1'].find(f=>f.label==='b'&&f.section===1);
assert.equal(grader.grade(b,'選択肢＃、設問＃'),'correct');
const sources=JSON.parse(fs.readFileSync(path.join(__dirname,'../dist/sources.json'),'utf8'));assert.equal(sources.length,136);
for(const s of sources)assert.equal(crypto.createHash('sha256').update(fs.readFileSync(path.join(__dirname,'../dist',s.file))).digest('hex'),s.sha256);
console.log(`Archive verified: 17 years, ${total} morning questions, ${fields} afternoon fields (${auto} auto comparison), 136 official PDF hashes.`);
