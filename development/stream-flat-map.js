const { PassThrough: ThroughStream } = require('stream');
// eslint-ignore-next-line node/no-extraneous-require
const duplexify = require('duplexify').obj;

module.exports = {
  streamFlatMap,
  asyncGeneratorToStream,
};

// returns an async generator that maps each chunk to a stream with the specified
// "entryToStream" mapping fn, and forwards child streams out
// useable with streams.pipeline
function streamFlatMap(entryToStream) {
  const duplex = asyncGeneratorToStream(flatMapGenerator);
  return duplex;

  async function* flatMapGenerator(source) {
    for await (const entry of source) {
      const subStream = entryToStream(entry);
      yield* subStream;
    }
  }
}

// this stupid utility turns an async iterator factory into a duplex stream
function asyncGeneratorToStream(factoryFn) {
  const writableStream = new ThroughStream({ objectMode: true });
  const readableStream = new ThroughStream({ objectMode: true });
  const duplex = duplexify(writableStream, readableStream);
  const asyncIter = factoryFn(writableStream);
  // drain iterator into readable stream
  process.nextTick(async () => {
    try {
      for await (const item of asyncIter) {
        readableStream.write(item);
      }
      readableStream.end();
    } catch (err) {
      readableStream.destroy(err);
    }
  });
  return duplex;
}
