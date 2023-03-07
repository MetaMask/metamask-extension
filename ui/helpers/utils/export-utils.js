import { getRandomFileName } from './util';

function encodeB64(text) {
  return new Promise((resolve) => {
    const buf = new TextEncoder().encode(text);
    // eslint-disable-next-line no-undef
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(',')[1]);
    // eslint-disable-next-line no-undef
    reader.readAsDataURL(new Blob([buf]));
  });
}

export async function exportAsFile(filename, data, type = 'text/csv') {
  const b64 = await encodeB64(data);
  // eslint-disable-next-line no-param-reassign
  filename = filename || getRandomFileName();
  const elem = window.document.createElement('a');
  elem.href = `data:${type};Base64,${b64}`;
  elem.download = filename;
  document.body.appendChild(elem);
  elem.click();
  document.body.removeChild(elem);
}
