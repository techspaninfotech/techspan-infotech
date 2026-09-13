/* Live project enquiries use the existing private chat backend. */
(() => {
 'use strict';
 const form=document.getElementById('contact-form');if(!form)return;
 const status=form.querySelector('.form-status'),button=form.querySelector('button[type="submit"]');
 let sending=false,pending=null;
 const show=(text,error=false)=>{status.textContent=text;status.classList.add('show');status.classList.toggle('error',error);};
 function validate(){
  let valid=true;
  form.querySelectorAll('[required]').forEach(field=>{
   const wrapper=field.closest('.field');
   const invalid=field.type==='checkbox'?!field.checked:(!field.value.trim()||!field.checkValidity());
   wrapper?.classList.toggle('invalid',invalid);
   const error=wrapper?.querySelector('.error');
   if(error)error.textContent=invalid?(field.type==='email'?'Enter a valid email address.':field.type==='tel'?'Enter a valid mobile number.':field.type==='checkbox'?'Please accept the privacy notice.':'Complete this field within its allowed length.'):'';
   if(invalid)valid=false;
  });
  if(!valid)form.querySelector('.invalid input,.invalid select,.invalid textarea')?.focus();
  return valid;
 }
 form.addEventListener('submit',async event=>{
  event.preventDefault();if(sending||!validate())return;
  const api=window.TechSpanChat;if(!api){show('Unable to connect. Please use the chatbox or try again later.',true);return;}
  const data=new FormData(form);
  const details={name:String(data.get('name')).trim(),email:String(data.get('email')).trim(),phone:String(data.get('phone')).trim(),consent:data.get('privacy_consent')==='on'};
  const message='Website project enquiry\nService: '+String(data.get('service')).trim()+'\n\n'+String(data.get('message')).trim();
  const fingerprint=JSON.stringify({details,message});
  if(!pending||pending.fingerprint!==fingerprint)pending={fingerprint,session:null,message,clientId:crypto.randomUUID()};
  if(message.length>2000){show('Please shorten your project details.',true);return;}
  sending=true;button.disabled=true;show('Sending your enquiry securely…');
  try{
   if(!pending.session)pending.session=await api.request('/guest/start',{method:'POST',body:details});
   await api.request('/guest/'+pending.session.id+'/messages',{method:'POST',token:pending.session.token,body:{message:pending.message,clientId:pending.clientId}});
   const session=pending.session;
   try{sessionStorage.setItem('techspan-guest-chat',JSON.stringify(session));}catch{}
   window.dispatchEvent(new CustomEvent('techspan:contact-submitted',{detail:session}));
   pending=null;form.reset();show('Enquiry sent to TechSpan! Our team can reply in the chatbox. Keep this page open or return in this browser tab to see replies.');
  }catch(error){
   if(error.status===401&&pending)pending.session=null;
   show(error.message||'Your enquiry could not be confirmed. Please try again.',true);
  }finally{sending=false;button.disabled=false;}
 });
 form.querySelectorAll('[required]').forEach(field=>field.addEventListener('input',()=>{const wrapper=field.closest('.field');wrapper?.classList.remove('invalid');const error=wrapper?.querySelector('.error');if(error)error.textContent='';}));
})();

