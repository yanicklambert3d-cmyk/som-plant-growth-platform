(() => {
'use strict';
const projectUrl='https://nndsridxgxepsvmaglhf.supabase.co',publishableKey='sb_publishable_-9VG45l2okQVtpG7_kL8gw_aGsjBN7-',bucket='som-diaries-test',maxBytes=20*1024*1024;
let active=false,preparedFile=null,preparedMeta=null,received=false,formUI=null;
function emit(type,detail){document.dispatchEvent(new CustomEvent(type,{detail}));}
function refresh(){if(!formUI)return;formUI.button.disabled=active||!preparedFile||received;formUI.open.disabled=active;formUI.form.classList.toggle('som-upload-received',received);formUI.form.classList.toggle('som-upload-ready',!!preparedFile&&!received);formUI.button.value=received?'Uploaded':'Upload';}
async function submit(file,onProgress=()=>{}){
 if(active)throw Error('busy');
 if(!file||file.size===0||file.size>maxBytes||!/\.pdf$/i.test(file.name))throw Error('invalid-pdf');
 active=true;
 try{
  const signature=new Uint8Array(await file.slice(0,5).arrayBuffer());if(String.fromCharCode(...signature)!=='%PDF-')throw Error('invalid-pdf');
  const random=new Uint8Array(6);crypto.getRandomValues(random);const parts={};new Intl.DateTimeFormat('en-GB',{timeZone:'Europe/Lisbon',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date()).forEach(p=>parts[p.type]=p.value);
  const name='test/SOM_'+parts.year+'-'+parts.month+'-'+parts.day+'_'+Array.from(random,n=>n.toString(16).padStart(2,'0')).join('')+'.pdf';
  return await new Promise((resolve,reject)=>{
   const xhr=new XMLHttpRequest();xhr.open('POST',projectUrl+'/storage/v1/object/'+bucket+'/'+name,true);xhr.setRequestHeader('apikey',publishableKey);xhr.setRequestHeader('Content-Type','application/pdf');xhr.setRequestHeader('x-upsert','false');xhr.timeout=180000;
   xhr.upload.addEventListener('progress',e=>{if(e.lengthComputable)onProgress(Math.round(e.loaded/e.total*100));});
   xhr.onload=()=>{let response;try{response=JSON.parse(xhr.responseText);}catch(_){}
    if(xhr.status>=200&&xhr.status<300&&response&&(response.Key===bucket+'/'+name||typeof response.Id==='string'&&response.Id.length>0)){onProgress(100);resolve({filename:name});}
    else reject(Error('upload-failed'));};
   xhr.onerror=xhr.ontimeout=()=>reject(Error('connection-failed'));xhr.onabort=()=>reject(Error('upload-aborted'));xhr.send(file);
  });
 }finally{active=false;}
}

async function prepare(file,metadata={}){
 if(active)throw Error('busy');if(!file||file.size===0||file.size>maxBytes)throw Error('invalid-pdf');
 const signature=new Uint8Array(await file.slice(0,5).arrayBuffer());if(String.fromCharCode(...signature)!=='%PDF-')throw Error('invalid-pdf');
 preparedFile=file;preparedMeta={contentVersion:metadata.contentVersion,language:metadata.language};received=false;refresh();
 if(formUI){formUI.status.textContent='Your diary is ready. Click Upload to submit it.';formUI.progress.style.display='none';}
 emit('som:diary-ready',{...preparedMeta,animate:metadata.animate!==false,restored:!!metadata.restored});
}
function clearPrepared(){if(active)return;preparedFile=null;preparedMeta=null;received=false;refresh();if(formUI){formUI.status.textContent='Complete and prepare your diary to activate Upload.';formUI.progress.style.display='none';}emit('som:diary-invalidated');}
window.SOMDiaryUpload={prepare,clearPrepared,maxBytes,hasPrepared:()=>!!preparedFile};
document.addEventListener('DOMContentLoaded',()=>{
 const form=document.getElementById('formUpload');if(!form)return;
 const button=form.querySelector('[type="submit"]'),progress=document.getElementById('barraProgresso'),status=document.getElementById('estado'),open=document.getElementById('som-diary-open');
 formUI={form,button,progress,status,open};refresh();status.textContent='Complete and prepare your diary to activate Upload.';
 document.addEventListener('som:diary-submission-restored',()=>{received=true;preparedFile=null;preparedMeta=null;refresh();status.textContent='Your diary has been received successfully.';});
 form.addEventListener('submit',async e=>{
  e.preventDefault();if(active||!preparedFile||received)return;const file=preparedFile,metadata={...preparedMeta};
  button.disabled=true;open.disabled=true;progress.style.display='block';progress.value=0;status.textContent='Uploading diary…';
  try{const receipt=await submit(file,p=>{progress.value=p;});received=true;preparedFile=null;preparedMeta=null;status.textContent='Your diary has been received successfully.';emit('som:diary-uploaded',{...receipt,...metadata});}
  catch(_){status.textContent='The diary could not be submitted. Click Upload to try again.';emit('som:diary-upload-failed');}
  finally{refresh();}
 });
});
})();
