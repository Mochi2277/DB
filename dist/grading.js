(function(root){
 'use strict';
 const normalize=s=>String(s).normalize('NFKC').trim();
 const name=s=>normalize(s).toLowerCase().replace(/[\s「」“”]/g,'');
 // Brackets printed in the official answer do not affect name comparison.
 // All listed names are still required; no bracketed column is silently omitted.
 const columns=s=>normalize(s).replace(/[\[\]{}｛｝]/g,'').split(/[,、，\n]+/).map(name).filter(Boolean).sort();
 const equalList=(a,b)=>JSON.stringify(columns(a))===JSON.stringify(columns(b));
 const sql=s=>{const tokens=normalize(s).match(/'(?:''|[^'])*'|"(?:""|[^"])*"|[\p{L}\p{N}_#$]+|<>|!=|<=|>=|\S/gu)||[];return tokens.map(t=>/^['"]/.test(t)?t:t.toLowerCase()).join('|');};
 const prose=s=>name(s).replace(/[。、,.]/g,'');
 function grade(field,value,context={}){
  if(field.kind==='manual')return 'manual';
  if(!normalize(value))return 'empty';
  let answers=Array.isArray(field.answer)?field.answer:[field.answer];
  if(context.question==='pm2-2'&&field.section===1&&field.part==='(3)'){
   // IPA explicitly allows 基準在庫数 in キ instead of ケ, but never twice.
   const ki=context.values?.['キ']||'',ke=context.values?.['ケ']||'';
   const hasKi=columns(ki).includes(name('基準在庫数'));
   const hasKe=columns(ke).includes(name('基準在庫数'));
   if(field.label==='キ'&&hasKi&&!hasKe)answers=[field.answer+'，基準在庫数'];
   if(field.label==='ケ'&&hasKi&&!hasKe)answers=[field.answer.replace('基準在庫数，','')];
  }
  const compare=field.kind==='columns'?equalList:field.kind==='sql'?(a,b)=>sql(a)===sql(b):field.kind==='prose'?(a,b)=>prose(a)===prose(b):(a,b)=>name(a)===name(b);
  if(answers.some(a=>compare(value,a)))return 'correct';
  return field.reviewMismatch||['sql','prose'].includes(field.kind)?'review':'incorrect';
 }
 root.PMGrader={grade,columns,sql};
 if(typeof module!=='undefined'&&module.exports)module.exports=root.PMGrader;
})(globalThis);
