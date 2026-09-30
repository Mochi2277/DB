import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync} from 'node:fs';
import worker from '../api/worker.mjs';
export function database(){
 const sqlite=new DatabaseSync(':memory:'); sqlite.exec('PRAGMA foreign_keys=ON');
 sqlite.exec(readFileSync(new URL('../api/migrations/0001_initial.sql',import.meta.url),'utf8'));
 sqlite.exec(readFileSync(new URL('../api/migrations/0002_archive.sql',import.meta.url),'utf8'));
 const db={prepare(sql){return {args:[],bind(...args){this.args=args;return this;},async first(){return sqlite.prepare(sql).get(...this.args)||null;},async run(){return sqlite.prepare(sql).run(...this.args);}};},async batch(statements){sqlite.exec('BEGIN');try{const result=[];for(const s of statements)result.push(await s.run());sqlite.exec('COMMIT');return result;}catch(e){sqlite.exec('ROLLBACK');throw e;}}};return {db,sqlite};
}
const {db,sqlite}=database(),env={DB:db,ALLOWED_ORIGINS:'http://localhost:8765'};
async function call(path,method='GET',body,token,origin='http://localhost:8765'){
 const r=await worker.fetch(new Request('http://localhost/api/'+path,{method,headers:{Origin:origin,'Content-Type':'application/json',...(token?{Authorization:'Bearer '+token}:{})},...(body?{body:JSON.stringify(body)}:{})}),env);return {status:r.status,data:await r.json()};
}
const credentials={username:'alice',password:'test-only-password-123'};
const a=await call('register','POST',credentials);assert.equal(a.status,200);
assert.equal((await call('register','POST',credentials)).status,409);
assert.equal((await call('login','POST',{...credentials,password:'wrong-password-123'})).status,401);
assert.equal((await call('login','POST',credentials)).status,200);
const b=await call('register','POST',{...credentials,username:'bob'});assert.equal(b.status,200);
const progress={version:1,exam:'2025-db',am:{answers:Array(25).fill(null),checked:Array(25).fill(false)},pm:{pm1:{answers:{'1:1-0':'顧客番号'}},pm2:{}}};
assert.equal((await call('progress','PUT',{revision:0,progress},a.data.token)).status,200);
assert.equal((await call('progress','GET',null,a.data.token)).data.progress.pm.pm1.answers['1:1-0'],'顧客番号');
assert.equal((await call('progress','GET',null,b.data.token)).data.progress,null);
assert.equal((await call('progress','PUT',{revision:0,progress},a.data.token)).status,409);
assert.equal((await call('progress','PUT',{revision:1,progress:{...progress,exam:'bad'}},a.data.token)).status,400);
assert.equal((await call('progress')).status,401);
assert.equal((await call('progress','GET',null,a.data.token,'https://evil.example')).status,403);
assert.equal(sqlite.prepare('SELECT password_hash FROM users WHERE username=?').get('alice').password_hash.includes(credentials.password),false);
assert.equal(sqlite.prepare('SELECT token_hash FROM sessions LIMIT 1').get().token_hash===a.data.token,false);
const older={...progress,exam:'2024-db'};
assert.equal((await call('progress?exam=2024-db','PUT',{revision:0,progress:older},a.data.token)).status,200);
assert.equal((await call('progress?exam=2024-db','PUT',{revision:0,progress:older},a.data.token)).status,409);
assert.equal((await call('progress?exam=2024-db','GET',null,a.data.token)).data.progress.exam,'2024-db');
assert.equal((await call('progress?exam=2024-db','GET',null,b.data.token)).data.progress,null);
assert.equal((await call('progress?exam=2009-db','GET',null,a.data.token)).data.progress,null);
assert.equal((await call('progress','GET',null,a.data.token)).data.progress.exam,'2025-db');
assert.equal((await call('progress','PUT',{revision:1,progress:older},a.data.token)).status,400);
assert.equal((await call('progress?exam=2024-db','PUT',{revision:1,progress},a.data.token)).status,400);
assert.equal((await call('progress?exam=1999-db','GET',null,a.data.token)).status,400);
const first2009=await Promise.all([call('progress?exam=2009-db','PUT',{revision:0,progress:{...older,exam:'2009-db'}},a.data.token),call('progress?exam=2009-db','PUT',{revision:0,progress:{...older,exam:'2009-db'}},a.data.token)]);
assert.deepEqual(first2009.map(r=>r.status).sort(),[200,409]);
await call('logout','POST',null,a.data.token);assert.equal((await call('me','GET',null,a.data.token)).status,401);
sqlite.prepare('UPDATE sessions SET expires_at=0').run();assert.equal((await call('me','GET',null,b.data.token)).status,401);
await worker.scheduled(null,env);assert.equal(sqlite.prepare('SELECT count(*) AS n FROM sessions').get().n,0);
for(let i=0;i<6;i++)await call('register','POST',{...credentials,username:'limit'+i});
assert.equal((await call('register','POST',{...credentials,username:'limited'})).status,429);
console.log('API checks passed: registration, login, isolation, persistence, conflicts, validation, CORS, hashing, logout, expiry, cleanup, rate limit');
