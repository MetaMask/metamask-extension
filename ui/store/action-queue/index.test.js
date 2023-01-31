import sinon from 'sinon';

import {
  dropQueue,
  callBackgroundMethod,
  submitRequestToBackground,
  _setBackgroundConnection,
} from '.';

// This file tests only MV3 queue scenario
// MV2 tests are already covered by '../actions.test.js'

jest.mock('../../../shared/modules/mv3.utils', () => {
  return {
    isManifestV3: () => true,
  };
});

describe('ActionQueue', () => {
  afterEach(() => {
    sinon.restore();
    dropQueue(true);
  });

  describe('dropQueue', () => {
    it('rejects all pending actions by default', async () => {
      const background = {
        connectionStream: {
          readable: false,
        },
        backgroundFunction: sinon.stub().yields(),
      };

      _setBackgroundConnection(background);
      const result = submitRequestToBackground('backgroundFunction');
      dropQueue();

      await expect(result).rejects.toThrow(
        'Background operation cancelled while waiting for connection.',
      );
      expect(background.backgroundFunction.called).toStrictEqual(false);
    });
  });
  describe('submitRequestToBackground', () => {
    it('calls promisified background method if the stream is connected', async () => {
      const background = {
        connectionStream: {
          readable: true,
        },
        backgroundFunction1: sinon.stub().yields(),
      };

      _setBackgroundConnection(background);
      submitRequestToBackground('backgroundFunction1');
      expect(background.backgroundFunction1.called).toStrictEqual(true);
    });

    it('does not calls promisified background method if the stream is not connected', async () => {
      const background = {
        connectionStream: {
          readable: false,
        },
        backgroundFunction2: sinon.stub().yields(),
      };

      _setBackgroundConnection(background);
      submitRequestToBackground('backgroundFunction2');
      expect(background.backgroundFunction2.called).toStrictEqual(false);
    });

    it('calls promisified background method on stream reconnection', async () => {
      const background = {
        connectionStream: {
          readable: false,
        },
        backgroundFunction3: sinon.stub().yields(),
      };
      _setBackgroundConnection(background);
      const requestPromise = submitRequestToBackground('backgroundFunction3');

      background.connectionStream = {
        readable: true,
      };
      _setBackgroundConnection(background);
      await requestPromise;
      expect(background.backgroundFunction3.calledOnce).toStrictEqual(true);
    });

    it('resolves if backgroundFunction resolves', async () => {
      const background = {
        connectionStream: {
          readable: true,
        },
        backgroundFunction4: (cb) => {
          return cb(null, 'test');
        },
      };
      _setBackgroundConnection(background);
      await expect(
        submitRequestToBackground('backgroundFunction4'),
      ).resolves.toStrictEqual('test');
    });

    it('rejects if backgroundFunction throws exception', async () => {
      expect.assertions(1);
      const background = {
        connectionStream: {
          readable: true,
        },
        backgroundFunction: () => {
          throw Error('test');
        },
      };
      _setBackgroundConnection(background);
      await expect(
        submitRequestToBackground('backgroundFunction'),
      ).rejects.toThrow('test');
    });

    it('calls methods in parallel when connection available', async () => {
      const trace = {};
      const background = {
        connectionStream: {
          readable: true,
        },
        first: (cb) => {
          setTimeout(() => {
            trace.firstDone = Date.now();
            cb(null, 'first');
          }, 5);
        },
        second: (cb) => {
          trace.secondStarted = Date.now();
          setTimeout(() => cb(null, 'second'), 10);
        },
      };
      _setBackgroundConnection(background);
      const scheduled = Promise.all([
        submitRequestToBackground('first'),
        submitRequestToBackground('second'),
      ]);
      await scheduled;
      expect(trace.firstDone).toBeGreaterThan(trace.secondStarted);
    });

    it('processes the queue sequentially when connection is restored', async () => {
      const trace = {};
      const background = {
        connectionStream: {
          readable: false,
        },
        first: (cb) => {
          setTimeout(() => {
            trace.firstDone = Date.now();
            cb(null, 'first');
          }, 5);
        },
        second: (cb) => {
          trace.secondStarted = Date.now();
          setTimeout(() => cb(null, 'second'), 10);
        },
      };
      _setBackgroundConnection(background);
      const scheduled = Promise.all([
        submitRequestToBackground('first'),
        submitRequestToBackground('second'),
      ]);
      background.connectionStream.readable = true;
      _setBackgroundConnection(background);
      await scheduled;
      expect(trace.firstDone).toBeLessThanOrEqual(trace.secondStarted);
    });

    it('ensures actions in queue will not repeat once finished', async () => {
      const trace = { calls: 0 };
      const background = {
        connectionStream: {
          readable: false,
        },
        first: (cb) => {
          trace.calls += 1;
          setTimeout(() => {
            trace.firstDone = Date.now();
            cb(null, 'first');
          }, 5);
        },
        second: (cb) => {
          trace.calls += 1;
          trace.secondStarted = Date.now();
          setTimeout(() => cb(null, 'second'), 10);
        },
      };
      _setBackgroundConnection(background);
      const scheduled = Promise.all([
        submitRequestToBackground('first'),
        submitRequestToBackground('second'),
      ]);
      background.connectionStream.readable = true;
      _setBackgroundConnection(background);
      await scheduled;
      _setBackgroundConnection(background); // once all actions finished, this triggers draining the queue again
      expect(trace.firstDone).toBeLessThanOrEqual(trace.secondStarted);
      expect(trace.calls).toStrictEqual(2);
    });

    it('stops processng the queue if connection is lost', async () => {
      const trace = {};
      const background = {
        connectionStream: {
          readable: false,
        },
        first: (cb) => {
          setTimeout(() => {
            trace.firstDone = true;
            background.connectionStream.readable = false;
            cb(Error('lost connection'));
          }, 5);
        },
        second: sinon.stub().yields(),
      };
      _setBackgroundConnection(background);
      const scheduled = Promise.race([
        submitRequestToBackground('first').catch(() => ({})),
        submitRequestToBackground('second'),
      ]);
      background.connectionStream.readable = true;
      _setBackgroundConnection(background);
      await scheduled;
      await Promise.resolve('one more tick'); // One asynchronous tick to avoid depending on implementation details
      expect(trace.firstDone).toStrictEqual(true);
      expect(background.second.called).toStrictEqual(false);
    });

    // Failing test for a race condition related to how items are removed from queue
    it('avoids race conditions', async () => {
      const trace = { first: 0, second: 0 };
      const flowControl = {};
      const background = {
        connectionStream: {
          readable: false,
        },
        first: (cb) => {
          trace.first += 1;
          setTimeout(() => {
            flowControl.triggerRaceCondition();
            cb(null, 'first');
          }, 5);
        },
        second: (cb) => {
          trace.second += 1;
          setTimeout(() => cb(null, 'second'), 10);
        },
        third: sinon.stub().yields(),
      };
      flowControl.triggerRaceCondition = () => {
        flowControl.waitFor = submitRequestToBackground('third');
      };
      _setBackgroundConnection(background);
      const scheduled = Promise.all([
        submitRequestToBackground('first'),
        submitRequestToBackground('second'),
      ]);
      background.connectionStream.readable = true;
      _setBackgroundConnection(background);
      await scheduled;
      await flowControl.waitFor;
      expect(trace.first).toStrictEqual(1);
      expect(trace.second).toStrictEqual(1);
      expect(background.third.calledOnce).toStrictEqual(true);
    });
  });

  describe('callBackgroundMethod', () => {
    afterEach(() => {
      sinon.restore();
    });

    it('calls background method if the stream is connected', async () => {
      const background = {
        connectionStream: {
          readable: true,
        },
        backgroundFunction: sinon.stub().yields(),
      };

      _setBackgroundConnection(background);
      callBackgroundMethod('backgroundFunction', [], () => ({}));
      expect(background.backgroundFunction.called).toStrictEqual(true);
    });

    it('does not call background method if the stream is not connected', async () => {
      const background = {
        connectionStream: {
          readable: false,
        },
        backgroundFunction: sinon.stub(),
      };

      _setBackgroundConnection(background);
      callBackgroundMethod('backgroundFunction', [], () => ({}));
      expect(background.backgroundFunction.called).toStrictEqual(false);
    });

    it('calls background method on stream reconnection', async () => {
      const background = {
        connectionStream: {
          readable: false,
        },
        backgroundFunction: sinon.stub().yields(),
      };
      _setBackgroundConnection(background);
      callBackgroundMethod('backgroundFunction', [], () => ({}));
      expect(background.backgroundFunction.called).toStrictEqual(false);

      background.connectionStream = {
        readable: true,
      };
      _setBackgroundConnection(background);
      expect(background.backgroundFunction.calledOnce).toStrictEqual(true);
    });

    it('resolves if backgroundFunction called resolves', async () => {
      const background = {
        connectionStream: {
          readable: true,
        },
        backgroundFunction: (cb) => {
          return cb(null, 'successViaCallback');
        },
      };
      _setBackgroundConnection(background);
      const value = await new Promise((resolve) => {
        callBackgroundMethod('backgroundFunction', [], (_err, result) => {
          resolve(result);
        });
      });
      expect(value).toStrictEqual('successViaCallback');
    });
    it('rejects if backgroundFunction called rejects', async () => {
      const errorViaCallback = Error('errorViaCallback');
      const background = {
        connectionStream: {
          readable: true,
        },
        backgroundFunction: (cb) => {
          return cb(errorViaCallback);
        },
      };
      _setBackgroundConnection(background);
      const value = await new Promise((resolve) => {
        callBackgroundMethod('backgroundFunction', [], (err) => {
          resolve(err);
        });
      });
      expect(value).toStrictEqual(errorViaCallback);
    });
  });
});
