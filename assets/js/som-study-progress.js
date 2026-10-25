document.addEventListener('DOMContentLoaded',function(){
 let stage=0,timer=null,arrivalTimer=null,sequence=0;
 const tracker=document.querySelector('.som-step-tracker');if(!tracker)return;
 const status=document.getElementById('som-flow-status'),questionnaire=document.getElementById('downloadBtn-1');
 const percent=n=>n===0?'0%':n===1?'50%':'100%';
 function render(updateBar=true){
  tracker.querySelectorAll('[data-som-step]').forEach(item=>{const n=Number(item.dataset.somStep),done=n<=stage,current=n===stage+1;item.classList.toggle('is-complete',done);item.classList.toggle('is-current',current);item.classList.toggle('is-pending',!done&&!current);item.querySelector('.som-tracker-marker').textContent=done?'✓':String(n);item.querySelector('.som-tracker-state').textContent=done?'Completed':current?'Current step':'Pending';if(current)item.setAttribute('aria-current','step');else item.removeAttribute('aria-current');});
  if(updateBar)tracker.style.setProperty('--som-progress',percent(stage));
  status.textContent=stage===0?'Step 1: complete your diary and choose Prepare diary and continue.':stage===1?'Your diary is ready. Click Upload in Step 2 to submit it.':'Diary received. Open and complete the questionnaire in Step 3.';
  if(questionnaire){questionnaire.setAttribute('aria-disabled',stage<2?'true':'false');questionnaire.classList.toggle('som-awaiting-upload',stage<2);}
 }
 function transition(next,animate=true){
  if(next===stage){render();return;}
  document.documentElement.classList.remove('som-energy-view');const previous=stage;stage=next;sequence++;const currentSequence=sequence;clearTimeout(timer);clearTimeout(arrivalTimer);tracker.classList.remove('is-energizing');tracker.querySelectorAll('[data-som-step]').forEach(item=>item.classList.remove('is-arriving'));
  const reduce=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if(!animate||next<previous||reduce){render();return;}
  document.documentElement.classList.add('som-energy-view');tracker.scrollIntoView({behavior:'auto',block:'center'});
  tracker.style.setProperty('--som-energy-from',percent(previous));tracker.style.setProperty('--som-energy-to',percent(next));tracker.style.setProperty('--som-progress',percent(previous));render(false);void tracker.offsetWidth;
  requestAnimationFrame(()=>requestAnimationFrame(()=>{if(currentSequence!==sequence)return;document.documentElement.classList.remove('som-energy-view');tracker.classList.add('is-energizing');tracker.style.setProperty('--som-progress',percent(next));timer=setTimeout(()=>{if(currentSequence!==sequence)return;tracker.style.setProperty('--som-energy-from',percent(next));tracker.classList.remove('is-energizing');const current=tracker.querySelector('[data-som-step="'+(stage+1)+'"]');if(current){current.classList.add('is-arriving');arrivalTimer=setTimeout(()=>current.classList.remove('is-arriving'),700);}if(stage===2)questionnaire?.focus({preventScroll:true});},1450);}));
 }
 document.addEventListener('som:diary-ready',event=>transition(1,event.detail?.animate!==false));
 document.addEventListener('som:diary-invalidated',()=>transition(0,false));
 document.addEventListener('som:diary-uploaded',()=>transition(2,true));
 document.addEventListener('som:diary-submission-restored',()=>transition(2,false));
 if(questionnaire)questionnaire.addEventListener('click',event=>{if(stage<2){event.preventDefault();status.textContent='Submit your diary using Upload in Step 2 before starting the questionnaire.';return;}status.textContent='Questionnaire opened in another tab. Complete it there; this page cannot verify its submission.';});
 render();
});