/* Optional unread indicator in the content dashboard after chat-inbox login. */
(() => {
 const api=window.TechSpanChat,badge=document.getElementById('chat-dashboard-unread');if(!api||!badge)return;
 async function check(){
  try{
   const session=JSON.parse(sessionStorage.getItem(api.sessionKey));
   if(session?.expiresAt>Date.now()/1000&&!document.hidden){
    const data=await api.request('/admin/inbox',{token:session.token});badge.textContent=data.unread?' · '+data.unread+' unread enquiries':' · Inbox connected';
   }else badge.textContent=' · Open inbox to sign in';
  }catch{badge.textContent=' · Open inbox';}
  setTimeout(check,15000);
 }
 check();
})();

