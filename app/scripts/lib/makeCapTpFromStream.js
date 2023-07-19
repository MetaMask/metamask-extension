import { Duplex } from 'stream';
import { makeCapTP, E } from '@endo/captp';
window.E = E;

export default function makeCapTpFromStream(streamId, bootstrap) {
  const stream = new Duplex();

  stream._read = noop;

  const send = (obj) => {
    stream.push(JSON.stringify(obj));
  };

  const capTp = makeCapTP(streamId, send, bootstrap);
  const { dispatch, getBootstrap, abort } = capTp;

  stream._write = (obj, _enc, cb) => {
    try {
      dispatch(JSON.parse(obj));
    } catch (err) {
      return cb(err);
    }
    return cb();
  };

  stream._writev = (chunks, cb) => {
    try {
      chunks.forEach((obj) => {
        dispatch(JSON.parse(obj));
      });
    } catch (err) {
      return cb(err);
    }
    return cb();
  };

  stream._final = (cb) => {
    abort();
    cb();
  };

  return { getBootstrap, abort, E, captpStream: stream };
}

function noop() {
  // noop
}
