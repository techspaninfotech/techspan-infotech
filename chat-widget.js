/* Guest chat: PII is sent only after validation and consent. */
(() => {
 'use strict';
 const api=window.TechSpanChat,key='techspan-guest-chat';if(!api)return;
 const root=document.createElement('div');root.className='tschat';
 root.innerHTML=`<section class="tschat-panel" id="tschat-panel" aria-label="TechSpan live chat" hidden>
 <div class="tschat-head"><div><strong>Chat with TechSpan</strong><small id="tschat-presence" role="status"><span class="tschat-online-dot" aria-hidden="true" hidden></span><span class="tschat-presence-text">A real conversation with our team</span></small></div><button type="button" aria-label="Close chat">×</button></div>
 <form class="tschat-start"><p>Tell us a little about yourself before we start.</p>
 <label for="tschat-name">Name *</label><input id="tschat-name" name="name" required minlength="2" maxlength="80" autocomplete="name">
 <label for="tschat-phone">Mobile number *</label><input id="tschat-phone" name="phone" type="tel" required minlength="7" maxlength="25" pattern="[+0-9 ()-]{7,25}" autocomplete="tel" placeholder="+91 …">
 <label for="tschat-email">Email address *</label><input id="tschat-email" name="email" type="email" required maxlength="254" autocomplete="email">
 <div class="tschat-honey" aria-hidden="true"><label>Website<input name="website" tabindex="-1" autocomplete="off"></label></div>
 <label class="tschat-consent"><input type="checkbox" name="consent" required><span>I agree to TechSpan storing my contact details and messages in Cloudflare to respond to this enquiry. Chats are removed after 30 days of inactivity when scheduled cleanup is enabled. Do not share passwords, payment details or sensitive information.</span></label>
 <button class="tschat-primary" type="submit">Start conversation →</button></form>
 <div class="tschat-room" hidden><div class="tschat-messages" role="log" aria-live="polite" aria-label="Chat messages"><div class="tschat-welcome">Welcome! Send your question below. Our team will reply here when available.</div></div>
 <div class="chat-typing" hidden role="status" aria-live="polite"><span class="chat-typing-dots" aria-hidden="true"><i></i><i></i><i></i></span><span>Admin is typing…</span></div>
 <form class="tschat-compose"><textarea aria-label="Your message" rows="2" maxlength="2000" required placeholder="Write your message…"></textarea><button type="submit" aria-label="Send message">Send</button></form><details class="tschat-privacy"><summary>Privacy &amp; options</summary><div class="tschat-privacy-content"><p>Your contact details and messages are stored in Cloudflare to respond to your enquiry. Chats are removed after 30 days of inactivity by daily cleanup. Please do not share passwords or payment details.</p><p>You can delete your chat and details below. This permanently removes the active conversation and its messages.</p><button class="tschat-delete" type="button">Delete my chat &amp; details</button></div></details></div>
 <p class="tschat-status" role="status" aria-live="polite"></p></section>
 <button class="tschat-launch" type="button" aria-expanded="false" aria-controls="tschat-panel">◉ Let's chat <span class="tschat-badge" hidden>0</span></button>`;
 document.body.appendChild(root);
 const panel=root.querySelector('.tschat-panel'),launch=root.querySelector('.tschat-launch'),status=root.querySelector('.tschat-status'),start=root.querySelector('.tschat-start'),room=root.querySelector('.tschat-room'),messages=root.querySelector('.tschat-messages'),compose=root.querySelector('.tschat-compose'),badge=root.querySelector('.tschat-badge');
 let session=null,last=0,busy=false,timer,unread=0,pending=null;
 try{session=JSON.parse(sessionStorage.getItem(key));if(!session?.id||!session?.token)session=null;}catch{}
 const typing=api.trackTyping({input:compose.querySelector('textarea'),indicator:root.querySelector('.chat-typing'),context:()=>session?{...session,role:'guest'}:null,active:()=>!panel.hidden,peer:'admin'});
 const notice=text=>{status.textContent=text;};
 const save=()=>{try{if(session)sessionStorage.setItem(key,JSON.stringify(session));else sessionStorage.removeItem(key);}catch{}};
 const setPresence=(online,text)=>{
  root.querySelector('.tschat-online-dot').hidden=!online;
  root.querySelector('.tschat-presence-text').textContent=text;
 };
 const renderRoom=()=>{
  start.hidden=!!session;room.hidden=!session;
  if(!session){typing.stop();root.querySelector('.tschat-privacy').open=false;setPresence(false,'A real conversation with our team');}
 };renderRoom();
 const updateBadge=()=>{badge.hidden=!unread;badge.textContent=String(unread);};
 function append(message){
  const bubble=document.createElement('div');bubble.className='chat-bubble'+(message.sender==='guest'?' own':'');bubble.textContent=message.body;
  const time=document.createElement('small');time.textContent=(message.sender==='admin'?'TechSpan · ':'You · ')+new Date(message.created_at*1000).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'});bubble.appendChild(time);messages.appendChild(bubble);
 }
 async function poll(){
  clearTimeout(timer);if(!session||busy||document.hidden){timer=setTimeout(poll,5000);return;}
  busy=true;
  const pollSession=session;
  try{
   const data=await api.request('/guest/'+pollSession.id+'/messages?after='+last,{token:pollSession.token});
   if(session?.id!==pollSession.id)return;
   for(const message of data.messages){if(message.id<=last)continue;append(message);last=message.id;if(panel.hidden&&message.sender==='admin')unread++;}
   if(data.messages.length&&!panel.hidden)messages.scrollTop=messages.scrollHeight;
   setPresence(data.adminOnline,data.adminOnline?'Admin active':'Leave a message — we will reply here');
   updateBadge();notice('');
  }catch(error){if(session?.id!==pollSession.id)return;setPresence(false,'Connection interrupted — retrying');notice(error.message);if(error.status===401){session=null;save();renderRoom();}}
  finally{busy=false;timer=setTimeout(poll,panel.hidden?15000:5000);}
 }
 launch.addEventListener('click',()=>{panel.hidden=!panel.hidden;if(panel.hidden)typing.stop();launch.setAttribute('aria-expanded',String(!panel.hidden));if(!panel.hidden){unread=0;updateBadge();if(session)poll();else start.querySelector('input').focus();}});
 root.querySelector('.tschat-head button').addEventListener('click',()=>{typing.stop();panel.hidden=true;launch.setAttribute('aria-expanded','false');launch.focus();});
 root.addEventListener('keydown',event=>{if(event.key==='Escape'){typing.stop();panel.hidden=true;launch.setAttribute('aria-expanded','false');launch.focus();}});
 start.addEventListener('submit',async event=>{
  event.preventDefault();if(!start.reportValidity())return;
  const button=start.querySelector('button');button.disabled=true;notice('Connecting securely…');
  try{
   await api.request('/health');const data=new FormData(start);
   session=await api.request('/guest/start',{method:'POST',body:{name:data.get('name'),phone:data.get('phone'),email:data.get('email'),website:data.get('website'),consent:data.get('consent')==='on'}});
   save();start.reset();last=0;renderRoom();notice('');compose.querySelector('textarea').focus();poll();
  }catch(error){notice(error.message);}finally{button.disabled=false;}
 });
 compose.addEventListener('submit',async event=>{
  event.preventDefault();const input=compose.querySelector('textarea'),text=input.value.trim();if(!session||!text||text.length>2000)return;
  typing.stop();const button=compose.querySelector('button');button.disabled=true;
  if(!pending||pending.message!==text)pending={message:text,clientId:crypto.randomUUID()};
  try{await api.request('/guest/'+session.id+'/messages',{token:session.token,method:'POST',body:pending});input.value='';pending=null;notice('');poll();}catch(error){notice(error.message);}finally{button.disabled=false;}
 });
 root.querySelector('.tschat-delete').addEventListener('click',async()=>{
  if(!session||!confirm('Delete your chat, contact details and all messages? This cannot be undone.'))return;
  typing.stop();try{await api.request('/guest/'+session.id,{token:session.token,method:'DELETE'});session=null;save();last=0;messages.querySelectorAll('.chat-bubble').forEach(el=>el.remove());renderRoom();clearTimeout(timer);notice('Your chat and details were deleted.');}catch(error){notice(error.message);}
 });
 window.addEventListener('techspan:contact-submitted',event=>{
  const next=event.detail;if(!next?.id||!next?.token)return;
  typing.stop();session=next;last=0;pending=null;unread=0;save();
  messages.querySelectorAll('.chat-bubble').forEach(el=>el.remove());
  root.querySelector('.tschat-privacy').open=false;
  renderRoom();panel.hidden=false;launch.setAttribute('aria-expanded','true');updateBadge();poll();
 });
 if(session)poll();
})();

