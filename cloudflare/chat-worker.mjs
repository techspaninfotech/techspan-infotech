/* TechSpan live chat API. Paste into a NEW techspan-chat Worker.
 * Bind D1 as CHAT_DB. Do not replace techspan-admin-auth.
 * Guest details/messages stay in D1, NEVER in GitHub.
 */
const ORIGINS = new Set(['https://www.techspaninfotech.com','https://techspaninfotech.com']);
const ADMIN = 'techspaninfotech';
const now = () => Math.floor(Date.now()/1000);
const random = () => [...crypto.getRandomValues(new Uint8Array(32))].map(n=>n.toString(16).padStart(2,'0')).join('');
const hash = async text => [...new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(text)))].map(n=>n.toString(16).padStart(2,'0')).join('');
class HttpError extends Error { constructor(status,message){super(message);this.status=status;} }
const fail = (status,message) => {throw new HttpError(status,message);};
const bearer = request => {
 const match = (request.headers.get('Authorization')||'').match(/^Bearer (\S+)$/);
 if(!match)fail(401,'Please sign in again.');
 return match[1];
};
async function json(request){
 if(!request.headers.get('Content-Type')?.includes('application/json'))fail(415,'JSON required.');
 if(Number(request.headers.get('Content-Length'))>10000)fail(413,'Request too large.');
 const reader=request.body?.getReader();if(!reader)fail(400,'Request body required.');
 const decoder=new TextDecoder();let text='',size=0;
 while(true){const chunk=await reader.read();if(chunk.done)break;size+=chunk.value.byteLength;if(size>10000){await reader.cancel();fail(413,'Request too large.');}text+=decoder.decode(chunk.value,{stream:true});}
 text+=decoder.decode();
 try{return JSON.parse(text);}catch{fail(400,'Invalid request.');}
}
async function rate(db,key,limit,seconds){
 const t=now(),bucket=Math.floor(t/seconds),id=key+':'+bucket;
 const row=await db.prepare('INSERT INTO rate_limits(key,count,expires_at) VALUES(?,1,?) ON CONFLICT(key) DO UPDATE SET count=count+1 RETURNING count').bind(id,t+seconds*2).first();
 if(row.count>limit)fail(429,'Too many requests. Please wait and try again.');
}
async function admin(request,db){
 const session=await db.prepare('SELECT expires_at FROM admin_sessions WHERE token_hash=?').bind(await hash(bearer(request))).first();
 if(!session||session.expires_at<=now())fail(401,'Admin session expired. Sign in again.');
}
async function guest(request,db,id){
 const row=await db.prepare('SELECT id FROM conversations WHERE id=? AND token_hash=?').bind(id,await hash(bearer(request))).first();
 if(!row)fail(401,'Chat session unavailable. Start a new chat.');
}
async function thread(db,id,after){
 const conversation=await db.prepare('SELECT id,name,email,phone,created_at,last_activity FROM conversations WHERE id=?').bind(id).first();
 if(!conversation)fail(404,'Conversation not found.');
 const result=await db.prepare('SELECT id,sender,body,created_at FROM messages WHERE conversation_id=? AND id>? ORDER BY id LIMIT 100').bind(id,after).all();
 const presence=await db.prepare("SELECT value FROM chat_meta WHERE key='admin_seen'").first();
 return {conversation,messages:result.results,adminOnline:!!presence&&presence.value>now()-45};
}
async function send(request,db,id,sender){
 const data=await json(request);
 const body=typeof data.message==='string'?data.message.trim():'';
 if(!body||body.length>2000)fail(400,'Message must be 1–2000 characters.');
 if(typeof data.clientId!=='string'||!/^[a-zA-Z0-9-]{16,80}$/.test(data.clientId))fail(400,'Invalid message identifier.');
 const t=now();
 await db.batch([
  db.prepare('INSERT OR IGNORE INTO messages(conversation_id,sender,body,created_at,client_id) VALUES(?,?,?,?,?)').bind(id,sender,body,t,data.clientId),
  db.prepare('UPDATE conversations SET last_activity=? WHERE id=?').bind(t,id)
 ]);
 return {sent:true};
}
async function cleanup(db){
 const cutoff=now()-30*86400;
 // Daily schedule enforces 30 days after the last message, not backups.
 await db.batch([
  db.prepare('DELETE FROM conversations WHERE last_activity<?').bind(cutoff),
  db.prepare('DELETE FROM admin_sessions WHERE expires_at<?').bind(now()),
  db.prepare('DELETE FROM rate_limits WHERE expires_at<?').bind(now())
 ]);
}
export default {
 async scheduled(event,env,ctx){if(env.CHAT_DB)ctx.waitUntil(cleanup(env.CHAT_DB));},
 async fetch(request,env){
  const origin=request.headers.get('Origin');
  const headers={'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Vary':'Origin'};
  if(origin&&ORIGINS.has(origin))headers['Access-Control-Allow-Origin']=origin;
  const reply=(data,status=200)=>new Response(JSON.stringify(data),{status,headers});
  try{
   if(origin&&!ORIGINS.has(origin))fail(403,'Website origin not allowed.');
   if(request.method==='OPTIONS')return new Response(null,{status:204,headers:{...headers,'Access-Control-Allow-Methods':'GET,POST,DELETE,OPTIONS','Access-Control-Allow-Headers':'Content-Type,Authorization','Access-Control-Max-Age':'600'}});
   const url=new URL(request.url),db=env.CHAT_DB;
   if(!db)fail(503,'Chat setup is not complete yet. Please use our contact page.');
   if(url.pathname==='/health'&&request.method==='GET'){
    await db.prepare('SELECT id FROM conversations LIMIT 1').first();
    return reply({ready:true});
   }
   // Hash IP before using it for short-lived abuse limits. Never store raw IP.
   const ip=await hash((request.headers.get('CF-Connecting-IP')||'unknown')+':'+Math.floor(now()/86400));
   if(url.pathname==='/guest/start'&&request.method==='POST'){
    await rate(db,'start:'+ip,5,3600);
    const data=await json(request),name=typeof data.name==='string'?data.name.trim():'',email=typeof data.email==='string'?data.email.trim():'',phone=typeof data.phone==='string'?data.phone.trim():'';
    if(name.length<2||name.length>80)fail(400,'Enter a name between 2 and 80 characters.');
    if(email.length>254||!/^\S+@\S+\.\S+$/.test(email))fail(400,'Enter a valid email address.');
    if(!/^[+0-9 ()-]{7,25}$/.test(phone)||phone.replace(/\D/g,'').length<7||phone.replace(/\D/g,'').length>15)fail(400,'Enter a valid mobile number.');
    if(data.consent!==true)fail(400,'Please accept the chat privacy notice.');
    if(data.website)fail(400,'Invalid request.');
    const id=random(),token=random(),t=now();
    await db.prepare('INSERT INTO conversations(id,name,email,phone,token_hash,created_at,last_activity) VALUES(?,?,?,?,?,?,?)').bind(id,name,email,phone,await hash(token),t,t).run();
    return reply({id,token},201);
   }
   if(url.pathname==='/admin/login'&&request.method==='POST'){
    await rate(db,'login:'+ip,15,600);
    const response=await fetch('https://api.github.com/user',{headers:{Authorization:'Bearer '+bearer(request),Accept:'application/vnd.github+json','User-Agent':'TechSpan-Chat'},signal:AbortSignal.timeout(10000)});
    if(!response.ok)fail(401,'GitHub verification failed. Please sign in again.');
    const user=await response.json();if(user.login?.toLowerCase()!==ADMIN)fail(403,'This account cannot access the chat inbox.');
    const token=random(),expiresAt=now()+8*3600;
    await db.prepare('INSERT INTO admin_sessions(token_hash,expires_at) VALUES(?,?)').bind(await hash(token),expiresAt).run();
    return reply({token,expiresAt,user:ADMIN});
   }
   if(url.pathname.startsWith('/admin/')){
    await admin(request,db);
    if(url.pathname==='/admin/logout'&&request.method==='POST'){
     await db.prepare('DELETE FROM admin_sessions WHERE token_hash=?').bind(await hash(bearer(request))).run();return reply({signedOut:true});
    }
    if(url.pathname==='/admin/inbox'&&request.method==='GET'){
     await db.prepare("INSERT INTO chat_meta(key,value) VALUES('admin_seen',?) ON CONFLICT(key) DO UPDATE SET value=excluded.value").bind(now()).run();
     const result=await db.prepare("SELECT c.id,c.name,c.email,c.phone,c.created_at,c.last_activity,MAX(CASE WHEN c.admin_read_id<0 THEN 1 ELSE 0 END,(SELECT COUNT(*) FROM messages m WHERE m.conversation_id=c.id AND m.sender='guest' AND m.id>c.admin_read_id)) unread,(SELECT body FROM messages m WHERE m.conversation_id=c.id ORDER BY id DESC LIMIT 1) preview FROM conversations c ORDER BY c.last_activity DESC LIMIT 100").all();
     const total=await db.prepare("SELECT COALESCE(SUM(MAX(CASE WHEN c.admin_read_id<0 THEN 1 ELSE 0 END,(SELECT COUNT(*) FROM messages m WHERE m.conversation_id=c.id AND m.sender='guest' AND m.id>c.admin_read_id))),0) count FROM conversations c").first();
     return reply({conversations:result.results,unread:total.count});
    }
    const match=url.pathname.match(/^\/admin\/([a-f0-9]{64})(?:\/messages)?$/);
    if(match){
     const id=match[1];
     if(request.method==='DELETE'){
      await db.prepare('DELETE FROM conversations WHERE id=?').bind(id).run();return reply({deleted:true});
     }
     if(request.method==='GET'){
      const after=Math.max(0,Number(url.searchParams.get('after'))||0),data=await thread(db,id,after);
      await db.prepare('UPDATE conversations SET admin_read_id=MAX(admin_read_id,?) WHERE id=?').bind(data.messages.at(-1)?.id||0,id).run();
      return reply(data);
     }
     if(request.method==='POST'){await thread(db,id,0);return reply(await send(request,db,id,'admin'));}
    }
   }
   const match=url.pathname.match(/^\/guest\/([a-f0-9]{64})(?:\/messages)?$/);
   if(match){
    const id=match[1];await guest(request,db,id);
    if(request.method==='DELETE'){await db.prepare('DELETE FROM conversations WHERE id=?').bind(id).run();return reply({deleted:true});}
    if(request.method==='GET')return reply(await thread(db,id,Math.max(0,Number(url.searchParams.get('after'))||0)));
    if(request.method==='POST'){await rate(db,'message:'+id,20,60);return reply(await send(request,db,id,'guest'));}
   }
   fail(404,'Not found.');
  }catch(error){
   if(!error.status)console.error('Chat request failed:',error.name);
   return reply({error:error.status?error.message:'Chat service is temporarily unavailable. Please try later.'},error.status||503);
  }
 }
};

