import { sanitizeUIState } from './state-utils';

describe('State Utils', () => {
  describe('sanitizeUIState', () => {
    it('removes unsafe properties', () => {
      const state = {
        TestController: {
          test1: 'value1',
          test2: false,
        },
        SnapController: {
          snapStates: true,
          unencryptedSnapStates: true,
        },
        KeyringController: {
          vault: true,
        },
      };

      // @ts-expect-error Intentionally passing in mock object for testing
      const sanitizedState = sanitizeUIState<keyof typeof state>(state);

      expect(sanitizedState).toStrictEqual({
        TestController: {
          test1: 'value1',
          test2: false,
        },
        SnapController: {},
        KeyringController: {},
      });
    });

    it('strips large properties from snaps state', () => {
      const state = {
        TestController: {
          test1: 'value1',
          test2: true,
        },
        SnapController: {
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
        },
      };

      // @ts-expect-error Intentionally passing in mock value for testing purposes.
      const sanitizedState = sanitizeUIState<keyof typeof state>(state);

      expect(sanitizedState).toStrictEqual({
        TestController: {
          test1: 'value1',
          test2: true,
        },
        SnapController: {
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
        },
      });
    });
  });
});
