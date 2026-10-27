const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
module.exports=function({page,root,origin}){
 const datasets=fs.readdirSync(__dirname).filter(f=>/^explanations-\d{4}\.json$/.test(f)).sort().reverse().map(f=>JSON.parse(fs.readFileSync(path.join(__dirname,f),'utf8'))).filter(d=>d.year>=2016);
 const urls=[],catalog=[],byYear={};
 for(const d of datasets){byYear[d.year]=d;
 const c={};c.window=c;vm.createContext(c);for(const file of ['data.js','pm-data.js','archive-data.js','meta-2025.js'])vm.runInContext(fs.readFileSync(path.join(root,file),'utf8'),c);
 const {esc,paras,am,pm}=require('../dist/explanation-render.js'),entry=c.EXAM_ARCHIVE[d.year],official=d.year===2025?c.PM_FIELDS[d.pm.key]:entry.fields[d.pm.key],files=entry.files,amSource=d.year===2025?c.EXAM:entry.am,pmMeta=(entry.pmMeta||c.META_2025).pm1.questions[0];
 assert.equal(d.am.length,25);assert.equal(new Set(d.am.map(q=>q.n)).size,25);
 for(const q of d.am)assert.equal(q.answer,amSource.find(a=>a.n===q.n)?.answer,`AM ${q.n}`);
 assert.deepEqual(d.pm.fields.map(f=>f.id).sort(),Array.from(official,f=>f.id).sort());
 const write=(file,title,desc,body)=>{page(file,title,desc,body,[{name:'解説一覧',href:origin+'/explanations'},{name:title,href:origin+'/'+file.replace('.html','')}]);urls.push('/'+file.replace('.html',''));};
 const policy=`<aside class="explanation-policy"><h2>この解説について</h2><p>${esc(d.policy)}</p><p>作成・確認日：${esc(d.updated)}。問題・公式解答例・採点講評の出典：<a href="${c.EXAM_ARCHIVE[d.year].source}">IPA ${d.year}年度の過去問題</a>。</p><p><a href="https://github.com/Mochi2277/DB/issues/new" target="_blank" rel="noopener">誤り・改善点を報告する（GitHubへのログインが必要）</a>。年度・問題番号・該当箇所を添えてください。</p></aside>`;
 const amFile=n=>`explain-${d.year}-am2-${String(n).padStart(2,'0')}.html`;
 for(const q of d.am){const source=amSource.find(a=>a.n===q.n),title=`${d.year}年度 午前Ⅱ 問${q.n} 解説：${q.title}`;
  write(amFile(q.n),title,`${title}。正解${q.answer}の理由、他の選択肢の確認、復習ポイントを掲載。IPAの問題原本・公式解答例と照らして学べます。`,
   `<p><a href="./?year=${d.year}&amp;question=${q.n}">この問題を演習する</a> ／ <a href="${files.am2_qs}#page=${source.page}">問題原本 ${source.page}ページ</a> ／ <a href="${files.am2_ans}">公式解答例PDF</a></p><figure><img class="explanation-question" src="${source.image||`questions/${d.year}/${q.n}.jpg`}" alt="${d.year}年度 午前Ⅱ 問${q.n}の問題文・図表・選択肢（IPA公式PDFを画像化）"><figcaption>出典：IPA ${esc(entry.label)} データベーススペシャリスト試験</figcaption></figure><h2>正解：${q.answer}</h2><article class="explanation-body">${am(q)}</article><nav class="seo-nav" aria-label="前後の解説">${q.n>1?`<a href="${amFile(q.n-1)}">← 問${q.n-1}</a>`:''}<a href="explanations.html">解説一覧</a>${q.n<25?`<a href="${amFile(q.n+1)}">問${q.n+1} →</a>`:''}</nav>${policy}`);
 }
 const pmLinks=[];
 for(const pmQuestion of [d.pm,...(d.pm2||[])]){
 const [mode,num]=pmQuestion.key.split('-'), number=Number(num), modeLabel=mode==='pm2'?'午後Ⅱ':'午後Ⅰ';
 const official=d.year===2025?c.PM_FIELDS[pmQuestion.key]:entry.fields[pmQuestion.key],pmMeta=(entry.pmMeta||c.META_2025)[mode].questions[number-1];
 assert.deepEqual(pmQuestion.fields.map(f=>f.id).sort(),Array.from(official,f=>f.id).sort());
 const fieldTitle=f=>`設問${f.section}${f.part||''}${f.label?' '+f.label:''}`;
 write(`explain-${d.year}-${mode}-${number}.html`,`${d.year}年度 ${modeLabel} 問${number} 解説：${pmQuestion.title}`,`${d.year}年度 ${modeLabel}問${number}「${pmQuestion.title}」を全${pmQuestion.fields.length}項目で解説。本文の根拠から解答の考え方を確認できます。`,
 `<p><a href="./?year=${d.year}&amp;mode=${mode}&amp;question=${number}">この問題を演習する</a> ／ <a href="${files[mode+'_qs']}#page=${pmMeta.start}">問題原本PDF（${pmMeta.start}〜${pmMeta.end}ページ）</a> ／ <a href="${files[mode+'_ans']}">公式解答例PDF</a> ／ <a href="${files[mode+'_cmnt']}">採点講評PDF</a></p><h2>最初に整理すること</h2>${paras(pmQuestion.intro)}${pmQuestion.subtypes?`<div class="seo-table-wrap"><table class="seo-answer-table"><caption>講義形態と二つの分類</caption><thead><tr><th>講義形態</th><th>時間固定</th><th>オンライン</th><th>固有の属性の例</th></tr></thead><tbody>${pmQuestion.subtypes.map(r=>`<tr>${r.map(v=>`<td>${esc(v)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`:''}${paras(pmQuestion.overview)}<h2>設問・空欄別の解説</h2><nav class="seo-nav" aria-label="解説の目次">${official.map(f=>`<a href="#field-${f.id}">${esc(fieldTitle(f))}</a>`).join('')}</nav>${pmQuestion.fields.map(f=>{const a=official.find(v=>v.id===f.id);return `<section class="explanation-body" id="field-${f.id}"><h2>${esc(fieldTitle(a))}</h2><p><strong>公式解答例：</strong>${(Array.isArray(a.answer)?a.answer:[a.answer]).map(esc).join(' ／ ')}</p>${a.kind==='columns'?'<p class="muted">主キー・外部キーの下線は公式解答例で確認してください。以下の文字列は下線を再現していません。</p>':''}${pm(f)}<p>${f.pages.map(p=>`<a href="${files[mode+'_qs']}#page=${p}">問題 ${p}ページ</a>`).join(' ／ ')}</p>${a.kind==='manual'?`<p><a href="${files[mode+'_ans']}#page=${a.answerPage||(d.year===2025&&mode==='pm2'&&number===2&&(f.id.startsWith('2-')||Number(f.id.split('-')[1])>=20)?3:pmMeta.ans[0])}">図表・記述の公式解答を確認する ↗</a></p>`:''}</section>`;}).join('')}${policy}`);
 pmLinks.push(`<h3>${modeLabel} 問${number}</h3><p><a href="explain-${d.year}-${mode}-${number}.html">${esc(pmQuestion.title)}</a>（全${pmQuestion.fields.length}項目）</p>`);
 }
 catalog.push(`<section><h2>${d.year}年度 午前Ⅱ</h2><ol>${d.am.map(q=>`<li><a href="explain-${d.year}-am2-${String(q.n).padStart(2,'0')}.html">問${q.n}：${esc(q.title)}</a></li>`).join('')}</ol>${pmLinks.join('')}</section>`);
 }
 page('explanations.html','データベーススペシャリスト 過去問の解説一覧','年度別の午前Ⅱ25問と午後Ⅰ問1、午後Ⅱの解説。正解の理由、誤答の理由、本文の根拠と復習ポイントを確認できます。',`<p>解説を収録している年度：${datasets.map(d=>d.year+'年度').join('・')}。各年度の午前Ⅱ25問と午後Ⅰ問1、午後Ⅱ問1・問2（${datasets.filter(d=>d.pm2?.length).map(d=>d.year+'年度').join('・')}）を掲載しています。</p><p>他の問題は<a href="years.html">年度選択</a>から公式資料と演習を利用できます。</p>${catalog.join('')}<p>各解説はAIを利用して作成した当サイト独自の解説です。原本・公式解答との照合を行っています。詳しい出典と確認日は各ページに記載しています。</p>`,[{name:'解説一覧',href:origin+'/explanations'}]);
 urls.push('/explanations');
 fs.writeFileSync(path.join(root,'explanations-data.js'),'globalThis.EXPLANATIONS_BY_YEAR='+JSON.stringify(byYear).replace(/</g,'\\u003c')+';\n globalThis.EXPLANATIONS=globalThis.EXPLANATIONS_BY_YEAR[2025];\n');
 return urls;
};
