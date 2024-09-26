import { migrate, version } from './128';

const oldVersion = 127;

describe(`migration #${version}`, () => {
  it('should update the version number', async () => {
    const oldState = {
      meta: { version: oldVersion },
      data: {},
    };
    const newState = await migrate(oldState);
    expect(newState.meta.version).toStrictEqual(version);
  });

  it('should reset AlertController to default values if it exists', async () => {
    const oldState = {
      meta: { version: oldVersion },
      data: {
        AlertController: {
          alertEnabledness: {
            unconnectedAccount: false,
            web3ShimUsage: false,
          },
          unconnectedAccountAlertShownOrigins: { 'some.origin': true },
          web3ShimUsageOrigins: { 'another.origin': true },
        },
      },
    };
    const newState = await migrate(oldState);
    expect(newState.data.AlertController).toStrictEqual({
      alertEnabledness: {
        unconnectedAccount: true,
        web3ShimUsage: true,
      },
      unconnectedAccountAlertShownOrigins: {},
      web3ShimUsageOrigins: {},
    });
  });

  it('should not modify state if AlertController does not exist', async () => {
    const oldState = {
      meta: { version: oldVersion },
      data: {
        SomeOtherController: {},
      },
    };
    const newState = await migrate(oldState);
    expect(newState.data).toStrictEqual(oldState.data);
  });

  it('should not modify other parts of the state', async () => {
    const oldState = {
      meta: { version: oldVersion },
      data: {
        AlertController: {
          alertEnabledness: {
            unconnectedAccount: false,
            web3ShimUsage: false,
          },
          unconnectedAccountAlertShownOrigins: { 'some.origin': true },
          web3ShimUsageOrigins: { 'another.origin': true },
        },
        SomeOtherController: { someData: 'should remain unchanged' },
      },
    };
    const newState = await migrate(oldState);
    expect(newState.data.SomeOtherController).toStrictEqual(
      oldState.data.SomeOtherController,
    );
  });
});
