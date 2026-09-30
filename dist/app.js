'use strict';
const $=id=>document.getElementById(id);
const active=globalThis.ACTIVE_EXAM;
const exam=window.EXAM;
const state={mode:'am2',q:0,answers:Array(25).fill(null),checked:Array(25).fill(false),summary:false,pm:{pm1:{q:1,doc:'qs',page:6,answers:{},scores:{}},pm2:{q:1,doc:'qs',page:7,answers:{},scores:{}}}};
const modes={am2:'午前Ⅱ',pm1:'午後Ⅰ',pm2:'午後Ⅱ'};
const pmMeta=active.pmMeta;
for(const mode of ["pm1","pm2"])state.pm[mode].page=pmMeta[mode].questions[0].start;
function pdf(mode,doc){return active.files[`${mode}_${doc}`];}
function element(tag,text,className){const e=document.createElement(tag);if(text!==undefined)e.textContent=text;if(className)e.className=className;return e;}
function renderAM(){
 const q=exam[state.q],selected=state.answers[state.q],checked=state.checked[state.q];
 $('question-title').textContent=`問${q.n}`;
 $('question-source').textContent=`出典：${active.label} データベーススペシャリスト試験 午前Ⅱ 問${q.n}`;
 $('question-image-link').href=pdf('am2','qs')+`#page=${q.page}`;if(q.image){$('question-image').src=q.image;}else globalThis.renderPDFImage('question-image',pdf('am2','qs'),q.page,q.crop);$('question-image').alt=`午前Ⅱ 問${q.n}の問題文・図表・選択肢（公式PDFから画像化）`;
 $('original-link').href=pdf('am2','qs')+`#page=${q.page}`;
 $('choices').replaceChildren();
 for(const a of ['ア','イ','ウ','エ']){const b=element('button',a);b.type='button';b.setAttribute('aria-pressed',String(a===selected));b.setAttribute('aria-label',`選択肢 ${a}`);b.onclick=()=>{state.answers[state.q]=a;state.checked[state.q]=false;renderAM();};$('choices').append(b);}
 $('check-answer').disabled=!selected;$('clear-answer').disabled=!selected;
 $('feedback').hidden=!checked;
 if(checked){const correct=selected===q.answer;$('feedback').className='feedback'+(correct?'':' wrong');$('feedback').replaceChildren(element('strong',correct?`正解です。正解：${q.answer}`:`不正解です。正解：${q.answer} ／ あなたの解答：${selected}`),element('small','IPAの公式解答例に基づいて採点しています。詳細解説は未収録です。'));}
 $('previous').disabled=state.q===0;$('next').disabled=state.q===24;$('position').textContent=`${String(q.n).padStart(2,'0')} / 25`;
 $('question-grid').replaceChildren();
 exam.forEach((item,i)=>{let mark='';const b=element('button',String(item.n));if(state.checked[i]){const correct=state.answers[i]===item.answer;b.className=correct?'correct':'incorrect';mark=correct?'✓':'×';}else if(state.answers[i]){b.className='answered';mark='●';}b.append(element('span',mark,'mark'));b.setAttribute('aria-current',String(i===state.q));b.setAttribute('aria-label',`問${item.n} ${state.checked[i]?(state.answers[i]===item.answer?'正解':'不正解'):(state.answers[i]?'解答済み':'未解答')}`);b.onclick=()=>{state.q=i;renderAM();$('question-title').scrollIntoView({block:'start'});};$('question-grid').append(b);});
 const answered=state.answers.filter(Boolean).length,correct=exam.filter((item,i)=>state.checked[i]&&state.answers[i]===item.answer).length,graded=state.checked.filter(Boolean).length;
 $('progress').value=answered;$('progress-text').textContent=`解答済み ${answered} / 25`;$('score-text').textContent=graded?`確認済み ${graded}問中 ${correct}問正解`:'';
 $('summary').hidden=!state.summary;
 if(state.summary){const total=exam.filter((item,i)=>state.answers[i]===item.answer).length;$('summary').replaceChildren(element('span','現在の採点結果'),element('strong',`${total*4} / 100点`),element('span',`正解 ${total}問・不正解 ${answered-total}問・未解答 ${25-answered}問`),element('p','1問4点。未解答は0点として計算します。'));}
}
$('check-answer').onclick=()=>{if(state.answers[state.q]){state.checked[state.q]=true;renderAM();}};
$('clear-answer').onclick=()=>{state.answers[state.q]=null;state.checked[state.q]=false;renderAM();};
$('previous').onclick=()=>{if(state.q>0){state.q--;renderAM();}};
$('next').onclick=()=>{if(state.q<24){state.q++;renderAM();}};
$('grade-all').onclick=()=>{state.checked=state.answers.map(Boolean);state.summary=true;renderAM();};
function switchMode(mode){state.mode=mode;document.querySelectorAll('#mode-nav button').forEach(b=>{if(b.dataset.mode===mode)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current');});$('am-section').hidden=mode!=='am2';$('pm-section').hidden=mode==='am2';$('section-title').textContent=modes[mode];$('section-kicker').textContent=mode==='am2'?'MULTIPLE CHOICE':'WRITTEN EXAM';$('section-info').textContent={am2:'25問 / 試験時間 40分',pm1:'3問から2問 / 試験時間 90分',pm2:'2問から1問 / 試験時間 120分'}[mode];if(mode!=='am2')renderPM();renderResources();}
document.querySelectorAll('#mode-nav button').forEach(b=>b.onclick=()=>switchMode(b.dataset.mode));
function pageList(){const p=state.pm[state.mode],meta=pmMeta[state.mode],q=meta.questions[p.q-1];if(p.doc==='ans')return q.ans;if(p.doc==='cmnt')return Array.from({length:meta.commentPages||1},(_,i)=>i+1);return [...new Set([...(meta.rulePages||[3,4,5]),...Array.from({length:q.end-q.start+1},(_,i)=>q.start+i)])];}
function renderPM(){
 const mode=state.mode,p=state.pm[mode],meta=pmMeta[mode],q=meta.questions[p.q-1];
 $('pm-question').replaceChildren();meta.questions.forEach((item,i)=>{const o=element('option',`問${i+1}　${item.title}`);o.value=i+1;$('pm-question').append(o);});$('pm-question').value=p.q;
 $('pm-guidance').textContent=`この問題：原本 ${q.start}〜${q.end}ページ。共通の表記ルールもページ選択から確認できます。`;
 $('pm-answer-title').textContent=`問${p.q}　あなたの解答`;
 p.section=p.section||1;p.checked=p.checked||{};p.manual=p.manual||{};
 $('pm-section-select').replaceChildren();
 for(let i=1;i<=q.sets;i++){const o=element('option',`設問${i}`);o.value=i;$('pm-section-select').append(o);}
 if(p.section>q.sets)p.section=1;
 $('pm-section-select').value=p.section;
 renderPMFields();
 $('self-score').setCustomValidity('');$('self-score').max=meta.max;$('self-score').value=p.scores[p.q]??'';$('max-score').textContent=`/ ${meta.max}点`;
 updateScoreStatus();renderDocument();
}

function currentFields(){return globalThis.PM_FIELDS[`${state.mode}-${state.pm[state.mode].q}`];}
function fieldKey(f){return `${state.pm[state.mode].q}:${f.id}`;}
function gradeContext(){const p=state.pm[state.mode],values={};for(const f of currentFields())if(f.section===1&&f.part==='(3)')values[f.label]=p.answers[fieldKey(f)]||'';return {question:active.year===2025?`${state.mode}-${p.q}`:`${active.year}-${state.mode}-${p.q}`,values};}
function fieldResult(f){const p=state.pm[state.mode],key=fieldKey(f);return globalThis.PMGrader.grade(f,p.answers[key]||'',gradeContext());}
function feedbackFor(f){
 const p=state.pm[state.mode],key=fieldKey(f),box=element('div',undefined,'field-feedback');box.id=`result-${f.id}`;
 if(!p.checked[key])return box;
 const result=fieldResult(f),labels={correct:'○ 解答例と一致',incorrect:'× 解答例と不一致',review:'△ 要確認：別表現の可能性があります',empty:'未解答',manual:'図表・記述は公式解答で自己照合'};
 box.classList.add(result);box.append(element('strong',labels[result]));
 if(f.note)box.append(element('small','公式備考：'+f.note));
 if(f.answerPage){const source=element('a',`公式解答例 ${f.answerPage}ページ ↗`);source.href=pdf(state.mode,'ans')+`#page=${f.answerPage}`;source.target='_blank';source.rel='noopener';box.append(source);}
 if(f.kind==='columns')box.append(element('small','カラム名の照合結果です。キーの下線は原本で確認してください。'));
 const detail=element('details');detail.open=result!=='correct';detail.append(element('summary','公式解答例・確認の要点'));
 for(const a of (Array.isArray(f.answer)?f.answer:[f.answer]))detail.append(element('p',a));
 if(active.year===2025&&state.mode==='pm2'&&p.q===2&&['キ','ケ'].includes(f.label))detail.append(element('p','基準在庫数は、ケの代わりにキへ記入してもよい（IPAの備考）。両方の入力を合わせて判定します。'));
 box.append(detail);
 if(['manual','review'].includes(result)){
 const label=element('label','照合後の自己評価 '),select=element('select');
 for(const [value,text] of [['','未確認'],['correct','正解と判断'],['incorrect','要復習']]){const o=element('option',text);o.value=value;select.append(o);}
 select.value=p.manual[key]||'';select.setAttribute('aria-label',`設問${f.section} ${f.part} ${f.label} 自己評価`);select.onchange=()=>{p.manual[key]=select.value;renderPMGradeSummary();};label.append(select);box.append(label);
 }
 return box;
}
function refreshPMFeedback(){for(const f of currentFields().filter(f=>f.section===state.pm[state.mode].section)){const old=document.getElementById(`result-${f.id}`);if(old)old.replaceWith(feedbackFor(f));}renderPMGradeSummary();}
function renderPMFields(){
 const p=state.pm[state.mode];$('writing-fields').replaceChildren();let part=null,group=null;
 for(const f of currentFields().filter(f=>f.section===p.section)){
 if(f.part!==part){part=f.part;group=element('fieldset',undefined,'answer-group');group.append(element('legend',`設問${f.section} ${part}`));$('writing-fields').append(group);}
 const key=fieldKey(f),row=element('div',undefined,'blank-row'),label=element('label',f.label,'blank-label'),input=element(f.kind==='manual'||f.kind==='prose'||f.kind==='columns'?'textarea':'input');
 input.id=`field-${f.id}`;label.htmlFor=input.id;input.value=p.answers[key]||'';input.autocomplete='off';input.spellcheck=false;
 if(input.tagName==='TEXTAREA')input.rows=f.kind==='prose'?3:2;
 input.placeholder=f.kind==='manual'?'解答・メモを入力（図は紙に描いて照合）':f.kind==='columns'?'カラム名を入力（複数は読点区切り）':'解答を入力';
 input.setAttribute('aria-label',`設問${f.section} ${f.part} ${f.label}`);input.setAttribute('aria-describedby',`result-${f.id}`);
 input.oninput=()=>{p.answers[key]=input.value;delete p.checked[key];delete p.manual[key];refreshPMFeedback();};
 const button=element('button',f.kind==='manual'?'解答を見て照合':'採点','secondary field-check');button.type='button';button.setAttribute('aria-label',`設問${f.section} ${f.part} ${f.label}を採点`);button.onclick=()=>{p.checked[key]=true;refreshPMFeedback();};
 row.append(label,input,button,feedbackFor(f));group.append(row);
 }
 renderPMGradeSummary();
}
function renderPMGradeSummary(){
 const p=state.pm[state.mode],counts={correct:0,incorrect:0,review:0,empty:0,manual:0,pending:0},all=currentFields();let selfCorrect=0;
 for(const f of all){const key=fieldKey(f);if(f.kind==='manual'){counts.manual++;if(p.manual[key]==='correct')selfCorrect++;continue;}if(!p.checked[key]){counts.pending++;continue;}const result=fieldResult(f);counts[result]++;if(result==='review'&&p.manual[key]==='correct')selfCorrect++;}
 $('pm-grade-summary').replaceChildren(element('strong',`問${p.q}：一致 ${counts.correct} / ${all.filter(f=>f.kind!=='manual').length}項目`),element('p',`不一致 ${counts.incorrect}・要確認 ${counts.review}・未解答 ${counts.empty}・未採点 ${counts.pending}`),element('small',`図表・記述の自己照合 ${counts.manual}項目 ／ 自己評価で正解 ${selfCorrect}項目。点数換算はしません。`));
}
$('pm-section-select').onchange=e=>{state.pm[state.mode].section=Number(e.target.value);renderPMFields();};
$('grade-pm').onclick=()=>{const p=state.pm[state.mode];for(const f of currentFields())p.checked[fieldKey(f)]=true;refreshPMFeedback();};
function renderDocument(){const mode=state.mode,p=state.pm[mode],list=pageList(),label={qs:'問題',ans:'解答例',cmnt:'採点講評'}[p.doc];if(!list.includes(p.page))p.page=list[0];$('pm-paper-title').textContent=`問${p.q}・${label}`;$('pm-source').textContent=`出典：${active.label} データベーススペシャリスト試験 ${modes[mode]} ${label}${p.doc==='cmnt'?'（全問）':p.doc==='qs'&&p.page<=5?'（共通の表記ルール）':` 問${p.q}`} ／ 原本 ${p.page}ページ`;$('pm-pdf').href=pdf(mode,p.doc)+`#page=${p.page}`;$('page-select').replaceChildren();list.forEach(pg=>{const o=element('option',`${pg}ページ`);o.value=pg;$('page-select').append(o);});$('page-select').value=p.page;$('page-prev').disabled=p.page===list[0];$('page-next').disabled=p.page===list.at(-1);if(active.year===2025){$('pm-image').src=`pages/${mode}_${p.doc}/${p.page}.jpg`;}else globalThis.renderPDFImage('pm-image',pdf(mode,p.doc),p.page);$('pm-image').alt=`${modes[mode]} ${label} 原本${p.page}ページ`;$('pm-image-link').href=pdf(mode,p.doc)+`#page=${p.page}`;document.querySelectorAll('#doc-tabs button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.doc===p.doc)));}
$('pm-question').onchange=e=>{const p=state.pm[state.mode];p.q=Number(e.target.value);p.section=1;p.doc='qs';p.page=pmMeta[state.mode].questions[p.q-1].start;renderPM();};
document.querySelectorAll('#doc-tabs button').forEach(b=>b.onclick=()=>{const p=state.pm[state.mode],q=pmMeta[state.mode].questions[p.q-1];p.doc=b.dataset.doc;p.page=p.doc==='qs'?q.start:p.doc==='ans'?q.ans[0]:1;renderDocument();});
$('page-select').onchange=e=>{state.pm[state.mode].page=Number(e.target.value);renderDocument();};
function turnPage(step){const p=state.pm[state.mode],list=pageList(),i=list.indexOf(p.page)+step;if(i>=0&&i<list.length){p.page=list[i];renderDocument();}}
$('page-prev').onclick=()=>turnPage(-1);$('page-next').onclick=()=>turnPage(1);
$('show-example').onclick=()=>{const p=state.pm[state.mode];p.doc='ans';p.page=pmMeta[state.mode].questions[p.q-1].ans[0];renderDocument();$('pm-paper-title').scrollIntoView({block:'start'});};
function updateScoreStatus(){const p=state.pm[state.mode],value=p.scores[p.q];$('self-status').textContent=value===undefined?'':`問${p.q}：${value} / ${pmMeta[state.mode].max}点（自己評価）`;}
$('self-score').oninput=e=>{const p=state.pm[state.mode],input=e.target;input.setCustomValidity('');if(input.value===''){delete p.scores[p.q];updateScoreStatus();return;}const n=Number(input.value);if(!Number.isInteger(n)||n<0||n>pmMeta[state.mode].max){input.setCustomValidity(`0〜${pmMeta[state.mode].max}の整数を入力してください。`);$('self-status').textContent=`0〜${pmMeta[state.mode].max}の整数を入力してください。`;return;}p.scores[p.q]=n;updateScoreStatus();};
function renderResources(){const mode=state.mode,box=$('resources');box.replaceChildren();const row=element('div',undefined,'resource-row');row.append(element('strong',modes[mode]));for(const doc of (mode==='am2'?['qs','ans']:['qs','ans','cmnt'])){const a=element('a',`${{qs:'問題冊子',ans:'解答例',cmnt:'採点講評'}[doc]} PDF ↓`);a.href=pdf(mode,doc);a.download='';row.append(a);}box.append(row);}
$('year-select').value=String(active.year);$('year-select').onchange=async e=>{e.target.disabled=true;const moved=await globalThis.StudyAccount.changeYear(e.target.value);if(!moved){e.target.value=String(active.year);e.target.disabled=false;}};
 document.querySelector('.edition').textContent=active.label;document.querySelector('.side-info a').href=active.source;document.querySelector('.side-info a').textContent=`IPA ${active.year}年度 過去問題 ↗`;$('am-answer-link').href=pdf('am2','ans');$('source-credit').textContent=`出典：IPA「${active.label} データベーススペシャリスト試験」。問題・解答例・採点講評の著作権はIPAに帰属します。`;
 renderAM();renderResources();

// Public bridge keeps authentication and persistence separate from practice UI.
globalThis.StudyState={
 snapshot(){const pm={};for(const mode of ['pm1','pm2']){const p=state.pm[mode];pm[mode]={answers:{...p.answers},checked:{...(p.checked||{})},manual:{...(p.manual||{})},scores:{...p.scores}};}return {version:1,exam:active.id,am:{answers:[...state.answers],checked:[...state.checked],summary:state.summary},pm};},
 hasAnswers(){return state.answers.some(Boolean)||['pm1','pm2'].some(m=>Object.values(state.pm[m].answers).some(Boolean)||Object.keys(state.pm[m].scores).length);},
 restore(p){if(p?.version!==1||p.exam!==active.id||!Array.isArray(p.am?.answers)||p.am.answers.length!==25)throw new Error('保存データの形式が不正です。');state.answers=[...p.am.answers];state.checked=[...p.am.checked];state.summary=!!p.am.summary;for(const mode of ['pm1','pm2']){const src=p.pm[mode];state.pm[mode].answers={...src.answers};state.pm[mode].checked={...src.checked};state.pm[mode].manual={...src.manual};state.pm[mode].scores={...src.scores};}renderAM();switchMode(state.mode);},
 reset(){this.restore({version:1,exam:active.id,am:{answers:Array(25).fill(null),checked:Array(25).fill(false),summary:false},pm:{pm1:{answers:{},checked:{},manual:{},scores:{}},pm2:{answers:{},checked:{},manual:{},scores:{}}}});}
};
