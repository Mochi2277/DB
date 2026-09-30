(function(root){
 'use strict';
 function summarize(progress,exam,am,fields,grader){
  const rows=am.map((q,i)=>{const answer=progress?.am?.answers?.[i]||null,checked=!!answer&&!!progress?.am?.checked?.[i];return {n:i+1,answer,status:!answer?'empty':!checked?'pending':answer===q.answer?'correct':'incorrect'};});
  const morning={rows,answered:rows.filter(r=>r.answer).length,graded:rows.filter(r=>['correct','incorrect'].includes(r.status)).length,correct:rows.filter(r=>r.status==='correct').length};
  const afternoon=[];
  for(const mode of ['pm1','pm2'])for(let q=1;q<=(mode==='pm1'?3:2);q++){
   const source=progress?.pm?.[mode]||{},all=fields[`${mode}-${q}`]||[],values={};
   for(const f of all)if(f.section===1&&f.part==='(3)')values[f.label]=source.answers?.[`${q}:${f.id}`]||'';
   const context={question:exam.year===2025?`${mode}-${q}`:`${exam.year}-${mode}-${q}`,values};
   const result={mode,q,total:all.length,entered:0,correct:0,review:0,incorrect:0,selfCorrect:0,score:source.scores?.[q]??null,max:mode==='pm1'?50:100};
   for(const f of all){const key=`${q}:${f.id}`,answer=source.answers?.[key]||'';if(answer.trim())result.entered++;if(!source.checked?.[key])continue;const grade=grader.grade(f,answer,context);if(['correct','review','incorrect'].includes(grade))result[grade]++;if(['manual','review'].includes(grade)&&source.manual?.[key]==='correct')result.selfCorrect++;}
   afternoon.push(result);
  }
  return {morning,afternoon,hasActivity:morning.answered>0||afternoon.some(r=>r.entered||r.score!==null||r.selfCorrect||r.correct||r.review||r.incorrect)};
 }
 root.summarizeProgress=summarize;if(typeof module!=='undefined')module.exports=summarize;
})(globalThis);
