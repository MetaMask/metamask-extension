import sinon from 'sinon';

import { submitRequestToBackground, _setBackgroundConnection } from '.';

// This file tests only MV3 queue scenario
// MV2 tests are already covered by '../actions.test.js'

jest.mock('../../../shared/modules/mv3.utils', () => {
  return {
    isManifestV3: () => true,
  };
});
jest.setTimeout(30000);
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

    it('does not calls promisified background method if the stream is connected', () => {
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
    //     backgroundFunction: () => Promise.resolve('test'),
    //   };
    //   _setBackgroundConnection(background);
    //   const result = await submitRequestToBackground('backgroundFunction');
    //   expect(result).toStrictEqual('test');
    // });
  });
});
