(function(){
 'use strict';
 const $=id=>document.getElementById(id),base=(globalThis.STUDY_CONFIG?.apiBase||'').replace(/\/$/,''),years=Object.values(globalThis.EXAM_ARCHIVE).sort((a,b)=>b.year-a.year);
 let token='',records=[],busy=false;try{token=sessionStorage.getItem('db-practice-session-v1')||'';}catch{}
 const el=(tag,text,cls)=>{const e=document.createElement(tag);if(text!==undefined)e.textContent=text;if(cls)e.className=cls;return e;};
 async function api(path){const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),20000);try{const r=await fetch(base+'/api/'+path,{headers:{Authorization:'Bearer '+token},cache:'no-store',signal:controller.signal});const data=await r.json();if(!r.ok){const e=new Error(data.error||'読み込みに失敗しました。');e.status=r.status;throw e;}return data;}finally{clearTimeout(timer);}}
 function clear(){records=[];$('history-years').replaceChildren();$('history-stats').replaceChildren();$('history-stats').hidden=true;$('history-filter-wrap').hidden=true;}
 function render(){
  const valid=records.filter(r=>r.summary),active=valid.filter(r=>r.summary.hasActivity),answered=valid.reduce((n,r)=>n+r.summary.morning.answered,0),graded=valid.reduce((n,r)=>n+r.summary.morning.graded,0),correct=valid.reduce((n,r)=>n+r.summary.morning.correct,0);
  const stats=$('history-stats');stats.replaceChildren();for(const [name,value] of [['取り組んだ年度',`${active.length} / 17`],['午前Ⅱ 解答済み',`${answered} / 425問`],['午前Ⅱ 正答率',graded?`${Math.round(correct/graded*100)}%`:'—']]){const box=el('div');box.append(el('span',name),el('strong',value));if(name.includes('正答率'))box.append(el('small',`採点済み ${graded}問中 ${correct}問正解`));stats.append(box);}stats.hidden=false;$('history-filter-wrap').hidden=false;
  const container=$('history-years');container.replaceChildren();
  for(const record of records){if(!record.error&&!record.summary.hasActivity&&!$('history-all').checked)continue;const {exam,summary:s}=record,details=el('details',undefined,'history-year'),heading=el('summary');heading.append(el('strong',exam.label));
   if(record.error){heading.append(el('span','取得できませんでした','history-error'));details.append(heading,el('p','通信に失敗しました。「更新」で再取得してください。'));container.append(details);continue;}
   heading.append(el('span',`午前Ⅱ ${s.morning.correct}問正解 / ${s.morning.graded}問採点`),el('span',`午後 入力 ${s.afternoon.reduce((n,r)=>n+r.entered,0)}項目`));const scores=s.afternoon.filter(r=>r.score!==null);if(scores.length)heading.append(el('span','自己採点：'+scores.map(r=>`${r.mode==='pm1'?'午後Ⅰ':'午後Ⅱ'}問${r.q} ${r.score}点`).join(' ／ ')));details.append(heading);
   const body=el('div',undefined,'history-body'),link=el('a','この年度を解く →','history-study');link.href='./?year='+exam.year;body.append(link,el('p',record.updatedAt?'最終保存：'+new Date(record.updatedAt*1000).toLocaleString('ja-JP'):'保存データはありません。','muted'));
   body.append(el('h2','午前Ⅱ'),el('p',`解答済み ${s.morning.answered} / 25問・正解 ${s.morning.correct}問・不正解 ${s.morning.graded-s.morning.correct}問・未採点 ${s.morning.answered-s.morning.graded}問`));
   const grid=el('div',undefined,'history-question-grid'),labels={correct:'正解',incorrect:'不正解',pending:'未採点',empty:'未回答'};
   for(const row of s.morning.rows){const cell=el('div',undefined,'history-question '+row.status);cell.append(el('strong',`問${row.n}`),el('span',row.answer||'—'),el('small',labels[row.status]));grid.append(cell);}body.append(grid,el('h2','午後Ⅰ・Ⅱ'));
   const cards=el('div',undefined,'history-pm-grid');for(const r of s.afternoon){const card=el('section',undefined,'history-pm');card.append(el('h3',`${r.mode==='pm1'?'午後Ⅰ':'午後Ⅱ'} 問${r.q}`),el('p',`入力 ${r.entered} / ${r.total}項目`),el('p',`自動一致 ${r.correct}・不一致 ${r.incorrect}・要確認 ${r.review}`),el('p',`自己評価で正解 ${r.selfCorrect}項目`),el('strong',r.score===null?'自己採点：未入力':`自己採点：${r.score} / ${r.max}点`));cards.append(card);}body.append(cards);details.append(body);container.append(details);
  }
  if(!container.children.length)container.append(el('p','まだ回答履歴がありません。問題を解いて保存すると、ここに成績が表示されます。','history-empty'));
 }
 async function load(){if(busy)return;busy=true;clear();$('history-refresh').disabled=true;$('history-login').hidden=true;$('history-user').textContent='';$('history-status').textContent='保存した成績を読み込んでいます…';
  try{if(!token){$('history-login').hidden=false;$('history-status').textContent='';return;}const me=await api('me');$('history-user').textContent='ID：'+me.user.username;let expired=false;
   for(let i=0;i<years.length;i+=4){const chunk=await Promise.all(years.slice(i,i+4).map(async exam=>{try{const r=await api('progress?exam='+encodeURIComponent(exam.id));return {exam,updatedAt:r.updatedAt,summary:globalThis.summarizeProgress(r.progress,exam,exam.year===2025?globalThis.EXAM:exam.am,exam.year===2025?globalThis.PM_FIELDS:exam.fields,globalThis.PMGrader)};}catch(e){if(e.status===401)expired=true;return {exam,error:true};}}));records.push(...chunk);if(expired){const e=new Error('ログインの有効期限が切れました。');e.status=401;throw e;}}
   render();const errors=records.filter(r=>r.error).length;$('history-status').textContent=errors?`${errors}年度の取得に失敗しました。集計は取得できた年度のみです。「更新」で再取得できます。`:'';
  }catch(e){clear();$('history-status').textContent=e.name==='AbortError'?'通信がタイムアウトしました。「更新」で再取得してください。':e.message;if(e.status===401){token='';try{sessionStorage.removeItem('db-practice-session-v1');}catch{}$('history-user').textContent='';$('history-login').hidden=false;}}
  finally{busy=false;$('history-refresh').disabled=false;}
 }
 $('history-refresh').onclick=load;$('history-all').onchange=render;load();
})();
