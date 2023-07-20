import { obj as createThroughStream } from 'through2';

export function debugStream(name) {
  return createThroughStream(function (chunk, enc, callback) {
    console.log(`${name} stream saw:`, chunk);
    this.push(chunk);
    callback();
  });
}

export function db(num) {
  return debugStream(`my-contentscript-stream-${num}`);
}
