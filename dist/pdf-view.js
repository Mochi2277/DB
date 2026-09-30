(function(){
 const pending=new Map(),docs=new Map();let lib;
 async function library(){if(!lib)lib=import('./vendor/pdf.mjs').then(pdf=>{pdf.GlobalWorkerOptions.workerSrc=new URL('./vendor/pdf.worker.mjs',document.baseURI).href;return pdf;});return lib;}
 globalThis.renderPDFImage=async function(id,url,pageNumber,crop){
  const img=document.getElementById(id),ticket=Symbol();pending.set(id,ticket);img.classList.add('pdf-loading');img.removeAttribute('src');
  let notice=document.getElementById(id+'-notice');if(!notice){notice=document.createElement('p');notice.id=id+'-notice';notice.setAttribute('role','status');img.parentElement.after(notice);}notice.textContent='公式PDFを読み込んでいます…';
  try{
   const pdfjs=await library();if(!docs.has(url)){docs.set(url,pdfjs.getDocument({url,cMapUrl:new URL('./vendor/cmaps/',document.baseURI).href,cMapPacked:true,standardFontDataUrl:new URL('./vendor/standard_fonts/',document.baseURI).href,wasmUrl:new URL('./vendor/wasm/',document.baseURI).href}).promise);}
   const pdf=await docs.get(url),page=await pdf.getPage(pageNumber);if(pending.get(id)!==ticket)return;
   const viewport=page.getViewport({scale:1.8}),canvas=document.createElement('canvas');canvas.width=Math.ceil(viewport.width);canvas.height=Math.ceil(viewport.height);
   await page.render({canvasContext:canvas.getContext('2d'),viewport}).promise;if(pending.get(id)!==ticket)return;
   let shown=canvas;if(crop){shown=document.createElement('canvas');const [x0,y0,x1,y1]=crop;shown.width=Math.ceil(canvas.width*(x1-x0));shown.height=Math.ceil(canvas.height*(y1-y0));shown.getContext('2d').drawImage(canvas,canvas.width*x0,canvas.height*y0,shown.width,shown.height,0,0,shown.width,shown.height);}
   img.src=shown.toDataURL('image/jpeg',.92);notice.textContent='';img.classList.remove('pdf-loading');page.cleanup();
   if(docs.size>3){const key=docs.keys().next().value;if(key!==url){const old=docs.get(key);docs.delete(key);old.then(d=>d.destroy()).catch(()=>{});}}
  }catch(e){if(pending.get(id)!==ticket)return;docs.delete(url);img.classList.remove('pdf-loading');notice.className='pdf-error';notice.textContent='問題を表示できませんでした。「原本PDF」から確認するか、ページを再読み込みしてください。';}
 };
})();
