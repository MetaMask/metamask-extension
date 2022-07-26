import sinon from 'sinon';

import { submitRequestToBackground, _setBackgroundConnection } from '.';

// jest.mock('webextension-polyfill', () => {
//   return {
//     runtime: {
//       getManifest: jest.fn(),
//     },
//   };
// });

describe('ActionQueue', () => {
  describe('submitRequestToBackground', () => {
    afterEach(() => {
      sinon.restore();
    });

    it('calls promisified background method if the stream is connected', async () => {
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
  });
});
