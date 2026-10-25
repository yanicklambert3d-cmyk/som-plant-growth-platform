(() => {
'use strict';
const questions=[
 ['Ao tocar no solo da planta, que sensações surgem?',''],
 ['Que mudanças observas na planta ou no seu ambiente?','Tais como…'],
 ['Que sinais a planta demonstrou hoje (se algum)?','Como reagiste ou respondeste a esses sinais?'],
 ['Fizeste algo de forma diferente em resposta à planta?','O que guiou essa decisão?'],
 ['O ambiente (luz, temperatura, localização…) influenciou a planta?','Ou a tua interação com ela?'],
 ['Estás a começar a notar padrões, ritmos ou interações recorrentes?','']
];
const labels=['O meu diário','Boas-vindas','Pré-experimento','Germinação','Ambiente e intenção',...questions.map((_,i)=>'Registo diário '+(i+1)),'Pós-experimento','Rever e concluir'];
const empty=()=>({version:2,language:'en',contentVersion:0,prepared:null,submission:null,email:'',preChoice:null,postChoice:null,germination:{smell:['','',''],see:['','',''],touch:['','',''],environment:['','',''],intention:''},entries:questions.map(()=>({day:'',date:'',reflection:'',photo:''})),currentPage:0,updatedAt:null});
function text(v,max=30000){if(typeof v!=='string'||v.length>max)throw Error('Texto inválido');return v;}
function choice(v){if(v===null||Number.isInteger(v)&&v>=1&&v<=6)return v;throw Error('Escolha inválida');}
function validate(raw){
 if(!raw||raw.version!==2)throw Error('Formato de diário inválido');
 const d=empty();if(raw.language!==undefined&&!['pt','en'].includes(raw.language))throw Error('Idioma inválido');d.language=raw.language||'pt';d.email=text(raw.email,254);d.preChoice=choice(raw.preChoice);d.postChoice=choice(raw.postChoice);
 for(const key of ['smell','see','touch','environment']){const values=raw.germination?.[key];if(!Array.isArray(values)||values.length!==3)throw Error('Germinação inválida');d.germination[key]=values.map(v=>text(v,120));}
 d.germination.intention=text(raw.germination.intention);
 if(!Array.isArray(raw.entries)||raw.entries.length!==6)throw Error('Registos inválidos');
 d.entries=raw.entries.map(e=>{const result={day:text(e.day,30),date:text(e.date,10),reflection:text(e.reflection),photo:text(e.photo,3000000)};if(result.date&&!/^\d{4}-\d{2}-\d{2}$/.test(result.date))throw Error('Data inválida');if(result.photo&&!/^data:image\/jpeg;base64,[A-Za-z0-9+/=]+$/.test(result.photo))throw Error('Imagem inválida');return result;});
 d.currentPage=Number.isInteger(raw.currentPage)&&raw.currentPage>=0&&raw.currentPage<labels.length?raw.currentPage:0;
 d.updatedAt=typeof raw.updatedAt==='string'?raw.updatedAt:null;d.contentVersion=Number.isSafeInteger(raw.contentVersion)&&raw.contentVersion>=0?raw.contentVersion:0;const prepared=raw.prepared;if(prepared&&prepared.contentVersion===d.contentVersion&&['pt','en'].includes(prepared.language))d.prepared={contentVersion:d.contentVersion,language:prepared.language};const receipt=raw.submission;if(receipt&&receipt.contentVersion===d.contentVersion&&typeof receipt.filename==='string'&&/^test\/SOM_\d{4}-\d{2}-\d{2}_[a-f0-9]{12}\.pdf$/.test(receipt.filename)&&typeof receipt.submittedAt==='string')d.submission={filename:receipt.filename,contentVersion:d.contentVersion,submittedAt:receipt.submittedAt};return d;
}
function migrate(raw){if(raw?.version===1){const d=empty();d.entries[0]={day:'',date:raw.date||'',reflection:raw.reflection||'',photo:raw.photo||''};return validate(d);}return validate(raw);}
function pending(d){const p=[];if(!d.preChoice)p.push({page:2,label:'Escolha pré-experimento'});for(const [key,label] of [['smell','Cheiro'],['see','Observação das sementes'],['touch','Colocar as sementes'],['environment','Ambiente']])if(d.germination[key].some(v=>!v.trim()))p.push({page:key==='environment'?4:3,label});if(!d.germination.intention.trim())p.push({page:4,label:'Intenção'});d.entries.forEach((e,i)=>{if(!e.reflection.trim()||!e.photo||(!e.date&&!e.day.trim()))p.push({page:i+5,label:'Registo diário '+(i+1)});});if(!d.postChoice)p.push({page:11,label:'Escolha pós-experimento'});return p;}
window.SOMDiaryModel={questions,labels,empty,validate,migrate,pending};
})();