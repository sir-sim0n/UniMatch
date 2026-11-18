// Fictional demo attachments only. No uploads or public storage service.
export const MEDIA_LIMITS = Object.freeze({image:5*1024*1024,video:20*1024*1024});
const types = Object.freeze({'image/jpeg':'image','image/png':'image','image/gif':'image','image/webp':'image','image/avif':'image','video/mp4':'video','video/webm':'video','video/ogg':'video'});
export function validateMedia(media) {
  if (media == null) return null;
  if (!Object.hasOwn(types,media.mime) || types[media.mime] !== media.type ||
      !Number.isSafeInteger(media.size) || media.size < 1 || media.size > MEDIA_LIMITS[media.type] ||
      typeof media.name !== 'string' || media.name.length > 255 || typeof media.data !== 'string') throw Error('Choose an image up to 5 MB or a video up to 20 MB.');
  const prefix = `data:${media.mime};base64,`, encoded = media.data.slice(prefix.length);
  if (!media.data.startsWith(prefix) || encoded.length !== 4*Math.ceil(media.size/3) ||
      /[^A-Za-z0-9+/=]/.test(encoded) || encoded.slice(0,-2).includes('=') ||
      (media.size%3===1 ? !encoded.endsWith('==') : media.size%3===2 ? !encoded.endsWith('=') || encoded.endsWith('==') : encoded.includes('='))) throw Error('Invalid image or video attachment.');
  return media;
}
export function mediaNode(media) {
  validateMedia(media);
  const node = document.createElement(media.type === 'image' ? 'img' : 'video');
  node.className = 'post-media'; node.src = media.data;
  if (media.type === 'image') { node.alt = 'Image attached to this post'; node.loading = 'lazy'; }
  else { node.controls = true; node.preload = 'metadata'; node.playsInline = true; node.setAttribute('aria-label','Video attached to this post'); }
  return node;
}
export function mediaComposer(form, {body, preview, before}) {
  const field = document.createElement('div'); field.className = 'media-picker';
  const label = document.createElement('label'); label.textContent = 'Image or video (optional)';
  const input = document.createElement('input'); input.type = 'file'; input.accept = Object.keys(types).join(','); input.setAttribute('aria-label','Image or video');
  const hint = document.createElement('p'); hint.className = 'hint'; hint.textContent = 'Images up to 5 MB; videos up to 20 MB. Demo files stay in this browser. Attachments must be reselected after reloading a draft.';
  const message = document.createElement('p'); message.className = 'hint'; message.setAttribute('role','status');
  const remove = document.createElement('button'); remove.type = 'button'; remove.className = 'text-button'; remove.textContent = 'Remove attachment'; remove.hidden = true;
  const holder = document.createElement('div'); holder.className = 'media-preview';
  label.append(input); field.append(label,hint,message,remove); form.insertBefore(field,body); preview.insertBefore(holder,before);
  let media = null, pending = false, revision = 0;
  function reset() { revision++; media=null; pending=false; input.value=''; body.required=true; holder.replaceChildren(); remove.hidden=true; message.textContent=''; input.setCustomValidity(''); }
  remove.onclick = reset;
  input.onchange = () => {
    const file=input.files[0]; reset(); if(!file)return;
    const mime=file.type.toLowerCase(), type=types[mime];
    if(!type || file.size<1 || file.size>MEDIA_LIMITS[type]) { message.textContent='Choose JPG, PNG, GIF, WebP, AVIF, MP4, WebM or Ogg within the size limit.'; return; }
    const selection=revision; pending=true; message.textContent='Preparing attachment…'; remove.hidden=false;
    const reader=new FileReader();
    reader.onload=()=>{if(selection!==revision)return;try { media=validateMedia({type,mime,size:file.size,name:file.name.slice(0,255),data:reader.result}); holder.replaceChildren(mediaNode(media)); body.required=false; message.textContent='Attachment ready. It will appear below your title.'; } catch(error) { reset(); message.textContent=error.message; } finally { pending=false; }};
    reader.onerror=()=>{if(selection===revision){reset();message.textContent='Could not read this file. Please choose it again.';}};
    reader.readAsDataURL(file);
  };
  form.addEventListener('submit',event=>{if(pending){event.preventDefault();event.stopImmediatePropagation();message.textContent='Wait for the attachment to finish preparing.';}},true);
  return {read:()=>media,reset};
}
