(function(){
 'use strict';
 const byId=id=>document.getElementById(id),base=(globalThis.STUDY_CONFIG?.apiBase||'').replace(/\/$/,'');
 const tokenKey='db-practice-session-v1';let token='',user=null,revision=0,ready=false,lastSaved='',lastObserved='',timer=null,pending=null,remote=null,conflict=false;
 try{token=sessionStorage.getItem(tokenKey)||'';}catch{}
 const status=message=>{byId('save-status').textContent=message;};
 const snapshot=()=>JSON.stringify(globalThis.StudyState.snapshot());
 function remember(value){token=value;try{if(value)sessionStorage.setItem(tokenKey,value);else sessionStorage.removeItem(tokenKey);}catch{}}
 async function api(path,method='GET',data){
  const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),15000);
  try{const response=await fetch(base+'/api/'+path,{method,headers:{'Content-Type':'application/json',...(token?{Authorization:'Bearer '+token}:{})},...(data?{body:JSON.stringify(data)}:{}),signal:controller.signal,cache:'no-store'});const result=await response.json();if(!response.ok){const error=new Error(result.error||'通信に失敗しました。');error.status=response.status;throw error;}return result;}
  catch(e){if(e.name==='AbortError')throw new Error('通信がタイムアウトしました。解答はこの画面に残っています。');throw e;}finally{clearTimeout(timeout);}
 }
 function render(){byId('account-login').hidden=!!user;byId('account-controls').hidden=!user;byId('account-name').textContent=user?`ID：${user.username}`:'ゲスト';byId('save-now').disabled=!ready||conflict;}
 function observe(){const current=snapshot();if(current===lastObserved)return;lastObserved=current;if(!user||!ready||conflict)return;status('未保存の変更があります');clearTimeout(timer);timer=setTimeout(()=>save().catch(()=>{}),1200);}
 async function save(){
  if(!user||!ready||conflict)return;
  if(pending){await pending;if(snapshot()!==lastSaved)return save();return;}
  const content=snapshot();if(content===lastSaved)return;
  status('保存中…');pending=api('progress','PUT',{revision,progress:JSON.parse(content)}).then(r=>{revision=r.revision;lastSaved=content;status('保存済み '+new Date(r.updatedAt*1000).toLocaleTimeString('ja-JP'));}).catch(e=>{if(e.status===409){conflict=true;ready=false;byId('reload-saved').hidden=false;}if(e.status===401){ready=false;remember('');byId('reauth').hidden=false;}status(e.message);render();throw e;}).finally(()=>{pending=null;});
  await pending;if(snapshot()!==lastSaved)return save();
 }
 function useRemote(){if(remote.progress)globalThis.StudyState.restore(remote.progress);revision=remote.revision;lastSaved=remote.progress?snapshot():'';lastObserved=snapshot();ready=true;conflict=false;byId('choose-progress').hidden=true;byId('reload-saved').hidden=true;render();status('保存済みの解答を読み込みました');if(!remote.progress)save().catch(()=>{});}
 async function loadProgress(){remote=await api('progress');revision=remote.revision;
  if(remote.progress&&globalThis.StudyState.hasAnswers()&&snapshot()!==JSON.stringify(remote.progress)){ready=false;byId('choose-progress').hidden=false;status('保存済みの解答が見つかりました。どちらを使うか選んでください。');}
  else useRemote();render();
 }
 function openLogin(){byId('auth-error').textContent='';byId('password').value='';byId('auth-dialog').showModal();byId('username').focus();}
 byId('account-login').onclick=openLogin;byId('reauth').onclick=openLogin;
 byId('auth-close').onclick=()=>byId('auth-dialog').close();
 byId('auth-form').onsubmit=async event=>{
  event.preventDefault();const form=event.currentTarget;if(!form.reportValidity())return;
  if(!base){byId('auth-error').textContent='保存サービスはまだ公開設定中です。問題演習はゲストで利用できます。';return;}
  const username=byId('username').value.trim(),password=byId('password').value,register=event.submitter?.id==='register-account';
  for(const b of form.querySelectorAll('button[type=submit]'))b.disabled=true;
  try{const r=await api(register?'register':'login','POST',{username,password});remember(r.token);user=r.user;byId('password').value='';byId('reauth').hidden=true;ready=false;render();await loadProgress();byId('auth-dialog').close();}
  catch(e){byId('auth-error').textContent=e.message;}
  finally{for(const b of form.querySelectorAll('button[type=submit]'))b.disabled=false;}
 };
 byId('use-saved').onclick=useRemote;
 byId('use-current').onclick=()=>{revision=remote.revision;lastSaved='';lastObserved=snapshot();ready=true;conflict=false;byId('choose-progress').hidden=true;render();save().catch(()=>{});};
 byId('save-now').onclick=()=>save().catch(()=>{});
 byId('reload-saved').onclick=()=>{ready=false;loadProgress().catch(e=>status(e.message));};
 byId('account-logout').onclick=async()=>{
  if(conflict||!byId('choose-progress').hidden){status('先に保存済みの解答と現在の解答のどちらを使うか選んでください。');return;}clearTimeout(timer);try{if(ready&&!conflict)await save();await api('logout','POST');remember('');user=null;ready=false;conflict=false;lastSaved='';globalThis.StudyState.reset();lastObserved=snapshot();byId('choose-progress').hidden=true;byId('reload-saved').hidden=true;byId('reauth').hidden=true;render();status('ログアウトしました。この画面の解答は消去しました。');}catch(e){status(e.message+' ログアウトは完了していません。');}
 };
 document.addEventListener('input',()=>queueMicrotask(observe));document.addEventListener('change',()=>queueMicrotask(observe));document.addEventListener('click',()=>queueMicrotask(observe));
 window.addEventListener('beforeunload',event=>{if(user&&snapshot()!==lastSaved){event.preventDefault();event.returnValue='';}});
 lastObserved=snapshot();render();status(base?'ゲストの解答は保存されません。ログインすると自動保存されます。':'ゲストで利用中（回答保存サービスは公開設定中）');
 if(base&&token)api('me').then(r=>{user=r.user;render();return loadProgress();}).catch(e=>{if(e.status===401)remember('');status(e.message);});
})();
