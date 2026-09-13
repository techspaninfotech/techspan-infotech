/* Admin tokens are scoped to chat only, expire in 8 hours, and stay in this tab. */
(() => {
 'use strict';
 const api=window.TechSpanChat,$=id=>document.getElementById(id);
 let session=null,selected=null,last=0,timer,busy=false,pending=null,previousUnread=0,known=new Set(),initialized=false;
 try{session=JSON.parse(sessionStorage.getItem(api.sessionKey));if(session?.expiresAt<=Date.now()/1000)session=null;}catch{}
 const status=text=>{$('chat-status').textContent=text;};
 const save=()=>{try{if(session)sessionStorage.setItem(api.sessionKey,JSON.stringify(session));else sessionStorage.removeItem(api.sessionKey);}catch{}};
 function ui(){const signed=!!session;$('chat-login').hidden=signed;$('chat-logout').hidden=!signed;$('chat-notifications').hidden=!signed||!('Notification' in window);$('chat-inbox').hidden=!signed;}
 ui();
 function notify(text){
  status(text);
  if('Notification' in window&&Notification.permission==='granted')new Notification('TechSpan: new guest enquiry',{body:text});
 }
 function bubble(message){
  const node=document.createElement('div');node.className='chat-bubble'+(message.sender==='admin'?' own':'');node.textContent=message.body;
  const time=document.createElement('small');time.textContent=(message.sender==='admin'?'You · ':'Guest · ')+new Date(message.created_at*1000).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'});node.appendChild(time);$('chat-messages').appendChild(node);
 }
 async function messages(){
  if(!selected)return;const id=selected;
  const data=await api.request('/admin/'+id+'/messages?after='+last,{token:session.token});
  if(id!==selected)return;
  $('guest-name').textContent=data.conversation.name;
  $('guest-contact').textContent=data.conversation.email+' · '+data.conversation.phone;
  for(const message of data.messages){if(message.id>last){bubble(message);last=message.id;}}
  if(data.messages.length)$('chat-messages').scrollTop=$('chat-messages').scrollHeight;
 }
 async function select(id){
  selected=id;last=0;pending=null;$('admin-compose').querySelector('textarea').value='';$('chat-messages').replaceChildren();$('admin-compose').hidden=false;$('guest-details').hidden=false;
  document.querySelectorAll('.chat-admin-row').forEach(row=>row.classList.toggle('active',row.dataset.id===id));
  try{await messages();status('');}catch(error){status(error.message);}
 }
 function list(data){
  $('conversation-list').replaceChildren();
  for(const conversation of data.conversations){
   const button=document.createElement('button');button.type='button';button.className='chat-admin-row'+(conversation.id===selected?' active':'');button.dataset.id=conversation.id;
   if(conversation.unread){const badge=document.createElement('b');badge.textContent=conversation.unread;button.appendChild(badge);}
   const title=document.createElement('strong');title.textContent=conversation.name;button.appendChild(title);
   const preview=document.createElement('span');preview.textContent=conversation.preview||'New guest — waiting for first message';button.appendChild(preview);
   const time=document.createElement('span');time.textContent=new Date(conversation.last_activity*1000).toLocaleString();button.appendChild(time);
   button.addEventListener('click',()=>select(conversation.id));$('conversation-list').appendChild(button);
  }
  if(!data.conversations.length){const empty=document.createElement('p');empty.textContent='No conversations yet.';$('conversation-list').appendChild(empty);}
  if(selected&&!data.conversations.some(c=>c.id===selected)){selected=null;last=0;$('guest-details').hidden=true;$('admin-compose').hidden=true;$('chat-messages').textContent='Conversation was deleted or removed by retention cleanup.';}
 }
 async function poll(){
  clearTimeout(timer);if(!session)return;
  if(busy||document.hidden){timer=setTimeout(poll,5000);return;}busy=true;
  try{
   const data=await api.request('/admin/inbox',{token:session.token});
   const fresh=data.conversations.some(c=>!known.has(c.id));
   if(initialized&&(fresh||data.unread>previousUnread))notify('A guest is waiting in your chat inbox.');
   else status('Inbox connected · '+data.unread+' unread');
   known=new Set(data.conversations.map(c=>c.id));initialized=true;previousUnread=data.unread;
   $('unread-count').textContent=data.unread?'('+data.unread+')':'';document.title=(data.unread?'('+data.unread+') ':'')+'Live Chat Inbox | TechSpan';list(data);await messages();
  }catch(error){status(error.message);if(error.status===401){session=null;save();ui();}}
  finally{busy=false;if(session)timer=setTimeout(poll,5000);}
 }
 $('chat-login').addEventListener('click',()=>{
  const button=$('chat-login');button.disabled=true;status('Complete GitHub login in the popup.');
  const auth=new URL('/auth',api.oauthBase);auth.search=new URLSearchParams({provider:'github',site_id:location.hostname}).toString();
  const popup=window.open(auth,'techspan-chat-login','width=700,height=650');
  if(!popup){button.disabled=false;status('Please allow popups, then try again.');return;}
  let finished=false;
  const finish=()=>{finished=true;clearTimeout(timeout);clearInterval(closed);window.removeEventListener('message',receive);button.disabled=false;};
  const receive=async event=>{
   if(event.origin!==new URL(api.oauthBase).origin||event.source!==popup||typeof event.data!=='string')return;
   if(event.data==='authorizing:github'){popup.postMessage('authorizing:github',event.origin);return;}
   const prefix='authorization:github:success:';if(!event.data.startsWith(prefix))return;
   finish();
   try{
    const payload=JSON.parse(event.data.slice(prefix.length));
    session=await api.request('/admin/login',{method:'POST',token:payload.token});
    save();ui();status('Signed in. Loading conversations…');poll();
   }catch(error){status(error.message);}
  };
  window.addEventListener('message',receive);
  const timeout=setTimeout(()=>{if(!finished){finish();status('Login timed out. Please retry.');}},120000);
  const closed=setInterval(()=>{if(popup.closed&&!finished){finish();status('Login window closed. Try again if not signed in.');}},1000);
 });
 $('chat-logout').addEventListener('click',async()=>{
  try{if(session)await api.request('/admin/logout',{method:'POST',token:session.token});}catch{}
  session=null;save();selected=null;last=0;clearTimeout(timer);$('chat-messages').replaceChildren();ui();status('Signed out.');
 });
 $('chat-notifications').addEventListener('click',async()=>{const permission=await Notification.requestPermission();status(permission==='granted'?'Notifications enabled while the inbox is open.':'Browser notifications not enabled. Inbox badges still work.');});
 $('admin-compose').addEventListener('submit',async event=>{
  event.preventDefault();if(!selected||!session)return;const input=$('admin-compose').querySelector('textarea'),message=input.value.trim(),id=selected;if(!message||message.length>2000)return;
  const button=$('admin-compose').querySelector('button');button.disabled=true;
  if(!pending||pending.message!==message)pending={message,clientId:crypto.randomUUID()};
  try{await api.request('/admin/'+id+'/messages',{method:'POST',token:session.token,body:pending});if(selected===id){input.value='';pending=null;await messages();}status('Reply sent.');}catch(error){status(error.message);}finally{button.disabled=false;}
 });
 $('delete-chat').addEventListener('click',async()=>{
  if(!selected||!confirm('Permanently delete this guest’s details and all chat messages?'))return;
  try{await api.request('/admin/'+selected,{method:'DELETE',token:session.token});selected=null;last=0;$('chat-messages').replaceChildren();$('guest-details').hidden=true;$('admin-compose').hidden=true;poll();}catch(error){status(error.message);}
 });
 if(session)poll();
})();

