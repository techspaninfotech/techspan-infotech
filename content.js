/* Editable content layer. Static HTML remains the safe offline fallback. */
(async () => {
  'use strict';
  const base = new URL('.', document.currentScript.src);
  const read = async path => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 6000);
    try {
      const response = await fetch(new URL(path, base), {cache:'no-cache',signal:controller.signal});
      if (!response.ok) throw new Error('Content unavailable');
      return await response.json();
    } finally { clearTimeout(timer); }
  };
  try {
    const ids = [...new Set([...document.querySelectorAll('[data-cms-block]')].map(el => el.dataset.cmsBlock))];
    const results = await Promise.allSettled(ids.map(async id => ({id,data:await read('content/'+id+'.json')})));
    for (const result of results) {
      if (result.status !== 'fulfilled') continue;
      const {id,data} = result.value;
      if (!Array.isArray(data.entries)) continue;
      const values = new Map(data.entries.map(item => [item.key,item.value]));
      document.querySelectorAll('[data-cms-block]').forEach(el => {
        if (el.dataset.cmsBlock !== id) return;
        const value = values.get(el.dataset.cmsKey);
        // Preserve original gradients/icons while content is unchanged.
        if (typeof value === 'string' && el.textContent.trim() !== value.trim()) el.textContent = value;
      });
    }
    try {
      const settings = await read('content/settings.json');
      const replacements = [
        ['hello@techspaninfotech.example',settings.email],
        ['+91 00000 00000',settings.phone],
        ['Maharashtra, India',settings.location]
      ];
      const walker = document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);
      let node;
      while ((node=walker.nextNode())) {
        if (['SCRIPT','STYLE'].includes(node.parentElement?.tagName)) continue;
        for (const [before,after] of replacements)
          if(typeof after==='string')node.nodeValue=node.nodeValue.split(before).join(after);
      }
      document.querySelectorAll('a[href^="mailto:"]').forEach(a=>{
        if(typeof settings.email==='string')a.href='mailto:'+settings.email.trim();
      });
      document.querySelectorAll('a[href^="tel:"]').forEach(a=>{
        if(typeof settings.phone==='string')a.href='tel:'+settings.phone.replace(/[^+0-9]/g,'');
      });
      document.querySelectorAll('[data-privacy-email]').forEach(a=>{if(typeof settings.email==='string')a.textContent=settings.email;});
      document.querySelectorAll('[data-privacy-phone]').forEach(a=>{if(typeof settings.phone==='string')a.textContent=settings.phone;});
      ['projects','satisfaction','serviceAreas'].forEach((key,index)=>{
        const counter=document.querySelectorAll('.counter')[index];
        const value=Number(settings[key]);
        if(counter&&Number.isFinite(value)&&value>=0){
          counter.dataset.target=String(value);counter.textContent=String(value);
        }
      });
      ['facebook','instagram','linkedin','youtube'].forEach((key,index)=>{
        const anchor=document.querySelectorAll('.socials a')[index];
        if(!anchor||!settings[key])return;
        try{const url=new URL(settings[key]);if(url.protocol==='https:'){anchor.href=url.href;anchor.setAttribute('aria-label',key);}}catch{}
      });
    } catch { /* Keep fallback settings. */ }
  } catch { /* Keep static page content. */ }
  finally {
    const script=document.createElement('script');
    script.src=new URL('script.js',base).href;
    document.body.appendChild(script);
  }
})();