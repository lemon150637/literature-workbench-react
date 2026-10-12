export const kindLabels={verbatim_excerpt:'原文摘录',personal_thought:'个人思考',document_text:'文献正文'};
export function exportKnowledge(docs,notes,topic='全部主题',kinds=['verbatim_excerpt','personal_thought']){
 const rows=notes.filter(n=>(topic==='全部主题'||n.topic===topic)&&kinds.includes(n.kind));
 const ids=new Set(rows.map(n=>n.docId));
 return {schema_version:'1.0.0',is_demo:true,exported_at:new Date().toISOString(),scope:{topic,included_kinds:kinds},documents:docs.filter(d=>ids.has(d.id)).map(d=>({id:d.id,title:d.title,authors:[d.author],publication:d.publication,format:d.type,source_url:d.url||null,source_verification:'unverified',is_demo:!d.userAdded||d.simulatedBody===true})),annotations:rows.map(n=>({id:n.id,document_id:n.docId,kind:n.kind,text:n.text,topic:n.topic,locator:n.paragraph?{type:'demo_text_paragraph',paragraph:n.paragraph,original_file_page:null}:null,created_at:n.createdAt})),warnings:['内置资料为虚构示例，不能作为真实引文。','段落位置对应本地预览正文，来源未经核验。']};
}
export function makeChunks(docs,notes,{topic='全部主题',includeThoughts=false}={}){
 const selected=docs.filter(d=>topic==='全部主题'||d.topic===topic);const chunks=[];
 for(const d of selected){const base={docId:d.id,title:d.title,author:d.author,publication:d.publication,topic:d.topic,url:d.url||null,isDemo:!d.userAdded||!!d.simulatedBody};
  d.paras.forEach((text,i)=>chunks.push({...base,key:`${d.id}:p${i+1}`,kind:'document_text',paragraph:i+1,text:text.slice(0,1800)}));
  for(const n of notes.filter(n=>n.docId===d.id&&(n.kind==='verbatim_excerpt'||(includeThoughts&&n.kind==='personal_thought')))){
   if(n.kind==='verbatim_excerpt'&&chunks.some(c=>c.docId===d.id&&c.text===n.text))continue;
   chunks.push({...base,key:n.id,noteId:n.id,kind:n.kind,paragraph:n.paragraph,text:n.text.slice(0,1800)});
  }
 }return chunks;
}
export function tokenize(text){
 const clean=text.toLowerCase().replace(/请问|请帮我|如何|什么|哪些|这个|一个|相关|研究|资料|总结|概括|观点|文献|根据|可以|是否|以及|关于|中的|我的/g,' ');
 const words=clean.match(/[a-z0-9]{2,}|[\u4e00-\u9fff]+/g)||[];
 return [...new Set(words.flatMap(w=>/[\u4e00-\u9fff]/.test(w)?Array.from({length:Math.max(0,w.length-1)},(_,i)=>w.slice(i,i+2)):[w]))];
}
export function retrieve(question,chunks,topK=4){
 const terms=tokenize(question);if(!terms.length)return [];
 return chunks.map(c=>({...c,score:terms.reduce((sum,t)=>sum+(c.text.toLowerCase().includes(t)?3:0)+(c.title.toLowerCase().includes(t)?1:0),0)})).filter(c=>c.score>0).sort((a,b)=>b.score-a.score).slice(0,Math.max(1,Math.min(8,Number(topK)||4))).map((c,i)=>({...c,id:`S${i+1}`}));
}
export function mockAnswer(sources){if(!sources.length)return {answer:'在当前范围内没有找到足够相关的材料。请尝试明确主题、换用文献中的关键词，或先导入相关正文。',citationIds:[]};return{answer:'以下为本地关键词检索结果，不是大模型生成的论证。\n\n'+sources.map(s=>`[${s.id}] ${kindLabels[s.kind]}：${s.text}`).join('\n\n')+'\n\n请回到原文核验语境后，再用于写作。',citationIds:sources.map(s=>s.id)}};
export function validateLibrary(value){return !!value&&Array.isArray(value.docs)&&value.docs.length>0&&value.docs.every(d=>typeof d.id==='string'&&typeof d.title==='string'&&typeof d.topic==='string'&&Array.isArray(d.paras)&&d.paras.every(p=>typeof p==='string'))&&Array.isArray(value.notes)&&value.notes.every(n=>typeof n.id==='string'&&typeof n.text==='string'&&value.docs.some(d=>d.id===n.docId));}
