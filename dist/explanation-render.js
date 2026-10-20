(function(root){
 'use strict';
 const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const paras=a=>a.map(p=>`<p>${esc(p)}</p>`).join('');
 function am(q){return `<h3>正解になる理由</h3>${paras(q.reason)}${q.code?`<pre><code>${esc(q.code)}</code></pre>`:''}<h3>選択肢ごとの確認</h3><dl>${Object.entries(q.choices).map(([k,v])=>`<dt>${esc(k)}${k===q.answer?'（正解）':''}</dt><dd>${esc(v)}</dd>`).join('')}</dl><p class="explanation-tip"><strong>復習ポイント：</strong>${esc(q.tip)}</p>${q.refs?`<p>関連資料：${q.refs.map(([t,u])=>`<a href="${esc(u)}" target="_blank" rel="noopener">${esc(t)}</a>`).join(' ／ ')}</p>`:''}`;}
 function pm(f){return `<p class="muted">根拠：${esc(f.evidence)}</p>${paras(f.reason)}<p class="explanation-tip"><strong>間違えやすい点：</strong>${esc(f.pitfall)}</p>`;}
 const api={esc,paras,am,pm};
 if(typeof module==='object'&&module.exports)module.exports=api;
 root.ExplanationRender=api;
 root.appendExplanation=function(parent,year,mode,n,id){
  const d=root.EXPLANATIONS;if(!d||Number(year)!==d.year)return;
  const q=mode==='am2'?d.am.find(q=>q.n===n):mode==='pm1'&&n===1?d.pm.fields.find(f=>f.id===id):null;
  if(!q)return;
  const box=document.createElement('details');box.className='explanation';
  const summary=document.createElement('summary');summary.textContent='解説を読む';box.append(summary);
  const content=document.createElement('div');content.innerHTML=mode==='am2'?am(q):pm(q);box.append(content);
  const link=document.createElement('a');link.textContent='問題と解説のページを開く ↗';link.target='_blank';link.rel='noopener';
  link.href=mode==='am2'?`explain-${d.year}-am2-${String(n).padStart(2,'0')}.html`:`explain-${d.year}-pm1-1.html#field-${id}`;box.append(link);
  parent.append(box);
 };
})(globalThis);
