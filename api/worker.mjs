import {scrypt, randomBytes, randomUUID, createHash, timingSafeEqual} from 'node:crypto';
const SESSION_SECONDS=8*60*60;
const COST={N:32768,r:8,p:3,maxmem:64*1024*1024};
const digest=s=>createHash('sha256').update(s).digest('hex');
const derive=(password,salt)=>new Promise((resolve,reject)=>scrypt(password,salt,32,COST,(err,key)=>err?reject(err):resolve(key)));
export async function hashPassword(password){const salt=randomBytes(16).toString('hex');return `scrypt-v1$${salt}$${(await derive(password,salt)).toString('hex')}`;}
export async function verifyPassword(password,stored){const [v,salt,hash]=stored.split('$');if(v!=='scrypt-v1'||!/^[a-f0-9]{32}$/.test(salt)||!/^[a-f0-9]{64}$/.test(hash))return false;return timingSafeEqual(await derive(password,salt),Buffer.from(hash,'hex'));}
class ApiError extends Error{constructor(status,message){super(message);this.status=status;}}
const fail=(status,message)=>{throw new ApiError(status,message);};
async function body(request){if(!(request.headers.get('content-type')||'').startsWith('application/json'))fail(415,'JSON形式が必要です。');const reader=request.body?.getReader();if(!reader)fail(400,'入力がありません。');let chunks=[],size=0;while(true){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>150000){await reader.cancel();fail(413,'解答が長すぎます。');}chunks.push(value);}try{const b=JSON.parse(Buffer.concat(chunks).toString('utf8'));if(!b||typeof b!=='object'||Array.isArray(b))fail(400,'入力形式が不正です。');return b;}catch(e){if(e instanceof ApiError)throw e;fail(400,'入力形式が不正です。');}}
function credentials(b){const username=typeof b.username==='string'?b.username.trim().toLowerCase():'';if(!/^[a-z0-9_]{3,32}$/.test(username))fail(400,'IDは半角英数字と_で3〜32文字です。');if(typeof b.password!=='string'||b.password.length<12||b.password.length>128)fail(400,'パスワードは12〜128文字です。');return {username,password:b.password};}
export function validateProgress(p){
 if(!p||p.version!==1||p.exam!=='2025-db'||!p.am||!p.pm)fail(400,'保存データの形式が不正です。');
 const am=p.am;if(!Array.isArray(am.answers)||am.answers.length!==25||am.answers.some(x=>x!==null&&!['ア','イ','ウ','エ'].includes(x)))fail(400,'午前の解答が不正です。');
 if(!Array.isArray(am.checked)||am.checked.length!==25||am.checked.some(x=>typeof x!=='boolean'))fail(400,'採点データが不正です。');
 const out={version:1,exam:'2025-db',am:{answers:am.answers,checked:am.checked,summary:!!am.summary},pm:{}};
 for(const mode of ['pm1','pm2']){
  const src=p.pm[mode];if(!src||typeof src!=='object')fail(400,'午後の解答が不正です。');const dst={answers:{},checked:{},manual:{},scores:{}};
  for(const kind of ['answers','checked','manual','scores']){
   const map=src[kind]||{};if(!map||typeof map!=='object'||Array.isArray(map)||Object.keys(map).length>150)fail(400,'解答項目が不正です。');
   for(const [k,v] of Object.entries(map)){
    if(kind==='scores'){if(!/^[1-3]$/.test(k)||!Number.isInteger(v)||v<0||v>(mode==='pm1'?50:100))fail(400,'自己採点が不正です。');}
    else {if(!/^[1-3]:[1-3]-\d{1,3}$/.test(k))fail(400,'解答番号が不正です。');if(kind==='answers'&&(typeof v!=='string'||v.length>8000))fail(400,'解答は1項目8000文字以内です。');if(kind==='checked'&&typeof v!=='boolean')fail(400,'採点データが不正です。');if(kind==='manual'&&!['','correct','incorrect'].includes(v))fail(400,'自己評価が不正です。');}
    dst[kind][k]=v;
   }
  }out.pm[mode]=dst;
 }return out;
}
async function limit(db,key,max,now){const window=900,expiry=(Math.floor(now/window)+1)*window;const bucket=digest(key+':'+expiry);const r=await db.prepare('INSERT INTO rate_limits(bucket,count,expires_at) VALUES (?,1,?) ON CONFLICT(bucket) DO UPDATE SET count=count+1 RETURNING count').bind(bucket,expiry).first();if(r.count>max)fail(429,'試行回数が多いため、15分ほど待って再試行してください。');}
async function identity(request,db,now){const raw=request.headers.get('authorization')||'';if(!/^Bearer [a-f0-9]{64}$/.test(raw))fail(401,'ログインしてください。');const hash=digest(raw.slice(7));const user=await db.prepare('SELECT users.id,users.username FROM sessions JOIN users ON users.id=sessions.user_id WHERE token_hash=? AND expires_at>?').bind(hash,now).first();if(!user)fail(401,'ログインの有効期限が切れました。');return {...user,tokenHash:hash};}
async function session(db,user,now){const token=randomBytes(32).toString('hex');await db.prepare('INSERT INTO sessions(token_hash,user_id,expires_at) VALUES (?,?,?)').bind(digest(token),user.id,now+SESSION_SECONDS).run();return {token,user:{username:user.username},expiresAt:now+SESSION_SECONDS};}
async function route(request,env,now){
 const db=env.DB,path=new URL(request.url).pathname,method=request.method;
 if(path==='/api/health'&&method==='GET')return {ok:true};
 if(['/api/register','/api/login'].includes(path)&&method==='POST'){
  const ip=request.headers.get('CF-Connecting-IP')||'local';await limit(db,'ip:'+path+':'+ip,path.endsWith('register')?5:30,now);
  const {username,password}=credentials(await body(request));await limit(db,'user:'+username,10,now);
  if(path==='/api/register'){
   const id=randomUUID(),hash=await hashPassword(password);
   try{await db.batch([db.prepare('INSERT INTO users(id,username,password_hash,created_at) VALUES (?,?,?,?)').bind(id,username,hash,now),db.prepare('INSERT INTO progress(user_id,updated_at) VALUES (?,?)').bind(id,now)]);}catch(e){if(String(e).includes('UNIQUE'))fail(409,'このIDは使用できません。別のIDを選んでください。');throw e;}
   return session(db,{id,username},now);
  }
  const user=await db.prepare('SELECT id,username,password_hash FROM users WHERE username=?').bind(username).first();
  // Perform the same expensive KDF even for nonexistent IDs.
  const valid=await verifyPassword(password,user?.password_hash||'scrypt-v1$00000000000000000000000000000000$'+'0'.repeat(64));
  if(!user||!valid)fail(401,'IDまたはパスワードが違います。');return session(db,user,now);
 }
 const user=await identity(request,db,now);
 await limit(db,'api:'+user.id,500,now);
 if(path==='/api/me'&&method==='GET')return {user:{username:user.username}};
 if(path==='/api/logout'&&method==='POST'){await db.prepare('DELETE FROM sessions WHERE token_hash=?').bind(user.tokenHash).run();return {ok:true};}
 if(path==='/api/progress'&&method==='GET'){const row=await db.prepare('SELECT payload,revision,updated_at FROM progress WHERE user_id=?').bind(user.id).first();return {progress:row.payload?JSON.parse(row.payload):null,revision:row.revision,updatedAt:row.updated_at};}
 if(path==='/api/progress'&&method==='PUT'){
  const b=await body(request);if(!Number.isSafeInteger(b.revision)||b.revision<0)fail(400,'保存番号が不正です。');const payload=JSON.stringify(validateProgress(b.progress));
  const row=await db.prepare('UPDATE progress SET payload=?,revision=revision+1,updated_at=? WHERE user_id=? AND revision=? RETURNING revision').bind(payload,now,user.id,b.revision).first();
  if(!row)fail(409,'別の画面で更新されています。保存済みデータを読み直してください。');return {revision:row.revision,updatedAt:now};
 }
 fail(404,'見つかりません。');
}
export default {async fetch(request,env){
 const origin=request.headers.get('origin');const allowed=(env.ALLOWED_ORIGINS||'').split(',').map(s=>s.trim()).filter(Boolean);
 const headers={'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Vary':'Origin'};
 if(origin&&!allowed.includes(origin))return new Response(JSON.stringify({error:'許可されていない接続元です。'}),{status:403,headers});
 if(origin)headers['Access-Control-Allow-Origin']=origin;
 if(request.method==='OPTIONS')return new Response(null,{status:204,headers:{...headers,'Access-Control-Allow-Methods':'GET,POST,PUT,OPTIONS','Access-Control-Allow-Headers':'Content-Type,Authorization','Access-Control-Max-Age':'600'}});
 try{const result=await route(request,env,Math.floor(Date.now()/1000));return new Response(JSON.stringify(result),{headers});}
 catch(e){return new Response(JSON.stringify({error:e instanceof ApiError?e.message:'保存サービスでエラーが発生しました。しばらくして再試行してください。'}),{status:e instanceof ApiError?e.status:500,headers});}
 },async scheduled(event,env){const now=Math.floor(Date.now()/1000);await env.DB.batch([env.DB.prepare('DELETE FROM sessions WHERE expires_at<=?').bind(now),env.DB.prepare('DELETE FROM rate_limits WHERE expires_at<=?').bind(now)]);}};
