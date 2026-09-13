/* Public URLs only: no passwords or GitHub/Cloudflare secrets here. */
window.TechSpanChat = {
 apiBase: 'https://techspan-chat.techspaninfotech.workers.dev',
 oauthBase: 'https://techspan-admin-auth.techspaninfotech.workers.dev',
 sessionKey: 'techspan-chat-admin-session',
 async request(path, {token,method='GET',body}={}) {
  const controller=new AbortController();
  const timer=setTimeout(()=>controller.abort(),15000);
  try {
   const headers={};if(token)headers.Authorization='Bearer '+token;
   if(body)headers['Content-Type']='application/json';
   const response=await fetch(this.apiBase+path,{method,headers,body:body?JSON.stringify(body):undefined,cache:'no-store',signal:controller.signal});
   const data=await response.json();
   if(!response.ok){const error=new Error(data.error||'Chat request failed.');error.status=response.status;throw error;}
   return data;
  } catch(error) {
   if(error.status)throw error;
   throw new Error('Chat is not available yet or the connection was interrupted. Please try again or use Contact.');
  } finally {clearTimeout(timer);}
 }
};


/* Only activity flags leave the browser; drafts are never transmitted. */
window.TechSpanChat.trackTyping = function({input,indicator,context,active,peer}){
 const api=this;let idle,remoteExpiry,previous=null,lastSent=0,chain=Promise.resolve(),checking=false;
 const hide=()=>{indicator.hidden=true;clearTimeout(remoteExpiry);};
 const enqueue=(ctx,typing)=>{
  const queuedAt=Date.now();
  chain=chain.catch(()=>{}).then(()=>{if(typing&&(!previous||previous.id!==ctx.id||Date.now()-queuedAt>2200))return;return api.request('/'+ctx.role+'/'+ctx.id+'/typing',{token:ctx.token,method:'POST',body:{typing}});}).catch(()=>{});
 };
 const stop=()=>{
  clearTimeout(idle);
  if(previous)enqueue(previous,false);
  previous=null;lastSent=0;hide();
 };
 input.addEventListener('input',()=>{
  const ctx=context();
  if(!ctx||!active()||!input.value.trim()){stop();return;}
  if(previous&&(previous.id!==ctx.id||previous.token!==ctx.token))stop();
  previous=ctx;clearTimeout(idle);
  if(Date.now()-lastSent>=3000){lastSent=Date.now();enqueue(ctx,true);}
  idle=setTimeout(stop,2200);
 });
 input.addEventListener('blur',stop);
 document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();});
 async function check(){
  const ctx=context();
  if(!ctx||!active()||document.hidden){hide();return;}
  if(checking)return;checking=true;
  try{
   const data=await api.request('/'+ctx.role+'/'+ctx.id+'/typing',{token:ctx.token});
   const current=context();
   if(!current||current.id!==ctx.id||current.token!==ctx.token||!active()||document.hidden)return;
   indicator.hidden=!data[peer+'Typing'];clearTimeout(remoteExpiry);
   if(!indicator.hidden)remoteExpiry=setTimeout(hide,10000);
  }catch{hide();}finally{checking=false;}
 }
 setInterval(check,2000);
 return {stop};
};
