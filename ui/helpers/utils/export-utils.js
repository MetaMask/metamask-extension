import { getRandomFileName } from './util';

export function exportAsFile(filename, data, type = 'text/csv') {
  const b64 = Buffer.from(data, 'utf8').toString('base64');
  // eslint-disable-next-line no-param-reassign
  filename = filename || getRandomFileName();
  const elem = window.document.createElement('a');
  elem.href = `data:${type};Base64,${b64}`;
  elem.download = filename;
  document.body.appendChild(elem);
  elem.click();
  document.body.removeChild(elem);
}
