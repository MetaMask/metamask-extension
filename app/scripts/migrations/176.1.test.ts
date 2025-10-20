import { cloneDeep } from 'lodash';
import { migrate, version } from './176.1';

const oldVersion = 176;

describe(`migration #${version}`, () => {
  it('updates the version metadata', async () => {
    const oldStorage = {
      meta: { version: oldVersion },
      data: {},
    };

    const newStorage = await migrate(oldStorage);

    expect(newStorage.meta).toStrictEqual({ version });
  });

  it('Does nothing if AppStateController is not in state', async () => {
    const oldState = {
      SomeOtherController: {
        someProperty: 'value',
      },
    };

    const transformedState = await migrate({
      meta: { version: oldVersion },
      data: cloneDeep(oldState),
    });

    expect(transformedState.data).toStrictEqual(oldState);
  });

  it('Does nothing if addressSecurityAlertResponses is not in AppStateController', async () => {
    const oldState = {
      AppStateController: {
        someOtherProperty: 'value',
      },
    };

    const transformedState = await migrate({
      meta: { version: oldVersion },
      data: cloneDeep(oldState),
    });

    expect(transformedState.data).toStrictEqual(oldState);
  });

  it('Clears existing addressSecurityAlertResponses cache entries', async () => {
    const oldState = {
      AppStateController: {
        addressSecurityAlertResponses: {
          '0x123abc': {
            // eslint-disable-next-line @typescript-eslint/naming-convention
            result_type: 'Benign',
            label: 'Some label',
            // Note: no timestamp field (legacy format)
          },
          '0x456def': {
            // eslint-disable-next-line @typescript-eslint/naming-convention
            result_type: 'Warning',
            label: 'Another label',
            // Note: no timestamp field (legacy format)
          },
        },
        otherProperty: 'should remain unchanged',
      },
      OtherController: {
        someData: 'should remain unchanged',
      },
    };

    const expectedState = {
      AppStateController: {
        addressSecurityAlertResponses: {}, // Cleared
        otherProperty: 'should remain unchanged',
      },
      OtherController: {
        someData: 'should remain unchanged',
      },
    };

    const transformedState = await migrate({
      meta: { version: oldVersion },
      data: cloneDeep(oldState),
    });

    expect(transformedState.data).toStrictEqual(expectedState);
  });

  it('Handles non-object addressSecurityAlertResponses gracefully', async () => {
    const oldState = {
      AppStateController: {
        addressSecurityAlertResponses: null,
        otherProperty: 'value',
      },
    };

    const transformedState = await migrate({
      meta: { version: oldVersion },
      data: cloneDeep(oldState),
    });

    expect(transformedState.data).toStrictEqual(oldState);
  });

  it('Clears addressSecurityAlertResponses even if it already has entries with timestamps', async () => {
    const oldState = {
      AppStateController: {
        addressSecurityAlertResponses: {
          '0x123abc': {
            // eslint-disable-next-line @typescript-eslint/naming-convention
            result_type: 'Benign',
            label: 'Some label',
            timestamp: 1642678800000, // Already has timestamp
          },
          '0x456def': {
            // eslint-disable-next-line @typescript-eslint/naming-convention
            result_type: 'Warning',
            label: 'Another label',
            // Mixed: this one doesn't have timestamp
          },
        },
      },
    };

    const expectedState = {
      AppStateController: {
        addressSecurityAlertResponses: {}, // Still cleared for consistency
      },
    };

    const transformedState = await migrate({
      meta: { version: oldVersion },
      data: cloneDeep(oldState),
    });

    expect(transformedState.data).toStrictEqual(expectedState);
  });
});
