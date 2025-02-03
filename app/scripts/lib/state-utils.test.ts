import { sanitizeUIState } from './state-utils';

describe('State Utils', () => {
  describe('sanitizeUIState', () => {
    it('removes unsafe properties', () => {
      const state = {
        test1: 'value1',
        snapStates: true,
        unencryptedSnapStates: true,
        vault: true,
        test2: false,
      };

      const sanitizedState = sanitizeUIState(state);

      expect(sanitizedState).toStrictEqual({
        test1: 'value1',
        test2: false,
      });
    });

    it('strips large properties from snaps state', () => {
      const state = {
        test1: 'value1',
        test2: true,
        snaps: {
          snap1: {
            id: 'snap1',
            test3: 123,
            sourceCode: 'sourceCode1',
            auxiliaryFiles: 'auxiliaryFiles1',
          },
          snap2: {
            id: 'snap2',
            test4: 456,
            sourceCode: 'sourceCode2',
            auxiliaryFiles: 'auxiliaryFiles2',
          },
        },
      };

      const sanitizedState = sanitizeUIState(state);

      expect(sanitizedState).toStrictEqual({
        test1: 'value1',
        test2: true,
        snaps: {
          snap1: {
            id: 'snap1',
            test3: 123,
          },
          snap2: {
            id: 'snap2',
            test4: 456,
          },
        },
      });
    });
  });
});
