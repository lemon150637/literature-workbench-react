export function validateChat(body){
 if(!body||typeof body.question!=='string'||!body.question.trim()||body.question.length>2000)throw new Error('问题长度应为 1–2000 字。');
 if(!Array.isArray(body.sources)||body.sources.length<1||body.sources.length>8)throw new Error('应提供 1–8 条检索材料。');
 const ids=new Set();for(const s of body.sources){if(!/^S[1-8]$/.test(s.id)||ids.has(s.id)||typeof s.text!=='string'||s.text.length>1800||!['document_text','verbatim_excerpt','personal_thought'].includes(s.kind))throw new Error('检索材料格式不正确。');ids.add(s.id)}
 return {question:body.question.trim(),sources:body.sources.map(s=>({id:s.id,text:s.text,kind:s.kind,title:String(s.title||'').slice(0,300),author:String(s.author||'').slice(0,100),paragraph:s.paragraph||null,isDemo:!!s.isDemo}))};
}
export function parseAnswer(content,sources){
 const text=String(content).trim().replace(/^```(?:json)?\s*/,'').replace(/\s*```$/,'');
 let data;try{data=JSON.parse(text)}catch{throw new Error('模型返回的格式无法校验，请重试。')}
 const valid=new Set(sources.map(s=>s.id));
 if(typeof data.answer!=='string'||!data.answer.trim()||data.answer.length>20000||!Array.isArray(data.citationIds)||data.citationIds.some(id=>!valid.has(id)))throw new Error('模型引用了不存在的来源或返回格式不正确。');
 const inline=[...data.answer.matchAll(/\[(S\d+)\]/g)].map(m=>m[1]);
 if(inline.some(id=>!valid.has(id)||!data.citationIds.includes(id)))throw new Error('模型回答中的引用未通过校验。');
 return {answer:data.answer,citationIds:[...new Set(data.citationIds)]};
}
