import {
  BridgeController,
  BridgeControllerMessenger,
} from '@metamask/bridge-controller';
import { BRIDGE_API_BASE_URL } from '../../../shared/constants/bridge';
import { traceBackgroundPoll } from '../../../shared/lib/trace';
import { getRootMessenger } from '../lib/messenger';
import { MessengerClientInitRequest } from './types';
import { buildControllerInitRequestMock } from './test/utils';
import {
  getBridgeControllerMessenger,
  getBridgeControllerInitMessenger,
  BridgeControllerInitMessenger,
} from './messengers';
import { BridgeControllerInit } from './bridge-controller-init';

jest.mock('@metamask/bridge-controller', () => {
  return {
    ...jest.requireActual('@metamask/bridge-controller'),
    BridgeController: jest.fn(),
  };
});

jest.mock('../../../shared/lib/trace', () => ({
  ...jest.requireActual('../../../shared/lib/trace'),
  traceBackgroundPoll: jest.fn((_controllerName: string, fn: () => unknown) =>
    fn(),
  ),
}));

function getInitRequestMock(): jest.Mocked<
  MessengerClientInitRequest<
    BridgeControllerMessenger,
    BridgeControllerInitMessenger
  >
> {
  const baseMessenger = getRootMessenger<never, never>();

  const requestMock = {
    ...buildControllerInitRequestMock(),
    controllerMessenger: getBridgeControllerMessenger(baseMessenger),
    initMessenger: getBridgeControllerInitMessenger(baseMessenger),
  };

  return requestMock;
}

describe('BridgeControllerInit', () => {
  beforeEach(() => {
    process.env.METAMASK_VERSION = 'MOCK_VERSION';
    jest.clearAllMocks();
  });

  it('initializes the controller', () => {
    const { messengerClient } = BridgeControllerInit(getInitRequestMock());
    expect(messengerClient).toBeInstanceOf(BridgeController);
  });

  it('passes the proper arguments to the controller', () => {
    BridgeControllerInit(getInitRequestMock());

    const controllerMock = jest.mocked(BridgeController);
    expect(controllerMock).toHaveBeenCalledWith({
      messenger: expect.any(Object),
      state: undefined,
      clientId: 'extension',
      clientVersion: 'MOCK_VERSION',
      config: {
        customBridgeApiBaseUrl: BRIDGE_API_BASE_URL,
      },
      fetchFn: expect.any(Function),
      getLayer1GasFee: expect.any(Function),
      trackMetaMetricsFn: expect.any(Function),
      traceFn: expect.any(Function),
      getUseAssetsControllerForRates: expect.any(Function),
    });
  });

  it('roots bridge quote polling cycles in their own traces', async () => {
    const executePoll = jest.fn().mockResolvedValue(undefined);
    jest.mocked(BridgeController).mockImplementationOnce(
      // eslint-disable-next-line @typescript-eslint/naming-convention -- _executePoll is BridgeController's private polling method
      () => ({ _executePoll: executePoll }) as unknown as BridgeController,
    );

    const { messengerClient } = BridgeControllerInit(getInitRequestMock());

    await (
      messengerClient as unknown as {
        _executePoll: (input: unknown) => Promise<void>;
      }
    )._executePoll({ quoteRequests: [] });

    expect(traceBackgroundPoll).toHaveBeenCalledWith(
      'BridgeController',
      expect.any(Function),
    );
    expect(executePoll).toHaveBeenCalledWith({ quoteRequests: [] });
  });
});
