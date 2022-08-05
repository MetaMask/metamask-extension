import sinon from 'sinon';

import {
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
  describe('submitRequestToBackground', () => {
    afterEach(() => {
      sinon.restore();
    });

    it('calls promisified background method if the stream is connected', () => {
      const background = {
        connectionStream: {
          readable: true,
        },
        backgroundFunction: sinon.stub(),
      };

      _setBackgroundConnection(background);
      submitRequestToBackground('backgroundFunction');
      expect(background.backgroundFunction.called).toStrictEqual(true);
    });

    it('does not calls promisified background method if the stream is not connected', () => {
      const background = {
        connectionStream: {
          readable: false,
        },
        backgroundFunction: sinon.stub(),
      };

      _setBackgroundConnection(background);
      submitRequestToBackground('backgroundFunction');
      expect(background.backgroundFunction.called).toStrictEqual(false);
    });

    it('calls promisified background method on stream reconnection', () => {
      const background = {
        connectionStream: {
          readable: false,
        },
        backgroundFunction: sinon.stub(),
      };
      _setBackgroundConnection(background);
      submitRequestToBackground('backgroundFunction');
      expect(background.backgroundFunction.called).toStrictEqual(false);

      background.connectionStream = {
        readable: true,
      };
      _setBackgroundConnection(background);
      submitRequestToBackground('backgroundFunction');
      expect(background.backgroundFunction.called).toStrictEqual(true);
    });

    // it('resolves if backgroundFunction called resolves', async () => {
    //   const background = {
    //     connectionStream: {
    //       readable: true,
    //     },
    //     backgroundFunction: async () => {
    //       await Promise.resolve('test');
    //     },
    //   };
    //   _setBackgroundConnection(background);
    //   const result = await submitRequestToBackground('backgroundFunction');
    //   expect(result).toStrictEqual('test');
    // });

    // it('rejects if backgroundFunction throws exception', async () => {
    //   const background = {
    //     connectionStream: {
    //       readable: true,
    //     },
    //     backgroundFunction: () => {
    //       throw Error('test');
    //     },
    //   };
    //   _setBackgroundConnection(background);
    //   expect(async () => {
    //     await submitRequestToBackground('backgroundFunction');
    //   }).toThrow('test');
    // });
  });

  describe('callBackgroundMethod', () => {
    afterEach(() => {
      sinon.restore();
    });

    it('calls background method if the stream is connected', () => {
      const background = {
        connectionStream: {
          readable: true,
        },
        backgroundFunction: sinon.stub(),
      };

      _setBackgroundConnection(background);
      callBackgroundMethod('backgroundFunction', [], () => ({}));
      expect(background.backgroundFunction.called).toStrictEqual(true);
    });

    it('does not calls background method if the stream is not onnected', () => {
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

    it('calls background method on stream reconnection', () => {
      const background = {
        connectionStream: {
          readable: false,
        },
        backgroundFunction: sinon.stub(),
      };
      _setBackgroundConnection(background);
      callBackgroundMethod('backgroundFunction', [], () => ({}));
      expect(background.backgroundFunction.called).toStrictEqual(false);

      background.connectionStream = {
        readable: true,
      };
      _setBackgroundConnection(background);
      callBackgroundMethod('backgroundFunction', [], () => ({}));
      expect(background.backgroundFunction.called).toStrictEqual(true);
    });

    // it('resolves if backgroundFunction called resolves', async () => {
    //   const background = {
    //     connectionStream: {
    //       readable: true,
    //     },
    //     backgroundFunction: async () => {
    //       await Promise.resolve('test');
    //     },
    //   };
    //   _setBackgroundConnection(background);
    //   const mockFn = sinon.stub();
    //   await new Promise((resolve) => {
    //     callBackgroundMethod('backgroundFunction', [], () => {
    //       mockFn();
    //       resolve('test');
    //     });
    //   });
    //   expect(mockFn.called).toStrictEqual(true);
    // });

    // it('rejects if backgroundFunction called throws exception', async () => {
    //   const background = {
    //     connectionStream: {
    //       readable: true,
    //     },
    //     backgroundFunction: async () => {
    //       await Promise.resolve('test');
    //     },
    //   };
    //   _setBackgroundConnection(background);
    //   const mockFn = sinon.stub();
    //   await new Promise((_, reject) => {
    //     callBackgroundMethod('backgroundFunction', [], () => {
    //       reject();
    //     });
    //   });
    //   expect(mockFn.called).toStrictEqual(true);
    // });
  });
});
