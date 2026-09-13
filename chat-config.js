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

