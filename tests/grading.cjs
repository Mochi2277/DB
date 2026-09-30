const assert=require('node:assert/strict');
const {grade}=require('../dist/grading.js');
require('../dist/pm-data.js');
const F=(kind,answer)=>({kind,answer});
assert.equal(grade(F('columns','接続先URL，担当教員番号'),'担当教員番号、接続先ＵＲＬ'),'correct');
assert.equal(grade(F('columns','DCコード，区画番号'),'ＤＣコード\n区画番号'),'correct');
assert.equal(grade(F('columns','DCコード，区画番号'),'DCコード'),'incorrect');
assert.equal(grade(F('columns','DCコード，区画番号'),'DCコード，区画番号，棚番号'),'incorrect');
assert.equal(grade(F('columns','DCコード，区画番号'),'DCコード，区画番号，区画番号'),'incorrect');
assert.equal(grade(F('columns','[DCコード]'),'DCコード'),'correct');
assert.equal(grade(F('text','①'),'１'),'correct');
assert.equal(grade(F('sql','SUM(獲得ポイント数)'),'sum （ 獲得ポイント数 ）'),'correct');
assert.equal(grade(F('sql','残高反映F IS FALSE'),'残高反映F ISFALSE'),'review');
assert.equal(grade(F('sql','a, b, c'),'b, a, c'),'review');
assert.equal(grade(F('sql',"status = 'A'"),"status = 'a'"),'review');
assert.equal(grade(F('prose','行を追加する。'),'行を追加する'),'correct');
assert.equal(grade(F('prose','行を追加する。'),'行を追加しない。'),'review');
assert.equal(grade(F('prose',['行を追加する。','レコードを追加する。']),'レコードを追加する'),'correct');
assert.equal(grade(F('text','第1正規形'),'第2正規形'),'incorrect');
assert.equal(grade(F('text','解答'),'　 '),'empty');
assert.equal(grade(F('manual','図'),'任意'),'manual');
const fields=globalThis.PM_FIELDS['pm2-2'],ki=fields.find(f=>f.label==='キ'),ke=fields.find(f=>f.label==='ケ');
const moved={question:'pm2-2',values:{キ:ki.answer+'，基準在庫数',ケ:ke.answer.replace('基準在庫数，','')}};
assert.equal(grade(ki,moved.values.キ,moved),'correct');
assert.equal(grade(ke,moved.values.ケ,moved),'correct');
const duplicated={question:'pm2-2',values:{キ:ki.answer+'，基準在庫数',ケ:ke.answer}};
assert.equal(grade(ki,duplicated.values.キ,duplicated),'incorrect');
let auto=0,manual=0;
for(const [q,items] of Object.entries(globalThis.PM_FIELDS)){
 assert.equal(new Set(items.map(f=>f.id)).size,items.length);
 for(const f of items){if(f.kind==='manual'){manual++;continue;}auto++;
 const answers=Array.isArray(f.answer)?f.answer:[f.answer];
 for(const a of answers)assert.equal(grade(f,a),'correct',`${q} ${f.id} canonical answer`);
 assert.equal(grade(f,''),'empty');
 }
}
console.log(`PASS: 20 edge cases; ${auto} automatic fields and ${manual} self-review fields across 5 questions.`);


require('./history.cjs');
