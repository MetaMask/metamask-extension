import {
  SignatureController,
  SignatureControllerMessenger,
} from '@metamask/signature-controller';
import { MessengerClientInitRequest } from '../types';
import { buildControllerInitRequestMock } from '../test/utils';
import {
  getSignatureControllerInitMessenger,
  getSignatureControllerMessenger,
  SignatureControllerInitMessenger,
} from '../messengers';
import { MetaMetricsEventCategory } from '../../../../shared/constants/metametrics';
import { getRootMessenger } from '../../lib/messenger';
import { createEventBuilder, trackEvent } from '../../controllers/analytics';
import { SignatureControllerInit } from './signature-controller-init';

jest.mock('@metamask/signature-controller', () => ({
  SignatureController: jest.fn().mockImplementation(() => ({
    hub: {
      on: jest.fn(),
    },
  })),
}));

jest.mock('../../controllers/analytics', () => ({
  createEventBuilder: jest.requireActual('../../controllers/analytics')
    .createEventBuilder,
  trackEvent: jest.fn(),
}));

function getInitRequestMock(): jest.Mocked<
  MessengerClientInitRequest<
    SignatureControllerMessenger,
    SignatureControllerInitMessenger
  >
> {
  const baseMessenger = getRootMessenger<never, never>();

  const requestMock = {
    ...buildControllerInitRequestMock(),
    controllerMessenger: getSignatureControllerMessenger(baseMessenger),
    initMessenger: getSignatureControllerInitMessenger(baseMessenger),
  };

  return requestMock;
}

describe('SignatureControllerInit', () => {
  const trackEventMock = jest.mocked(trackEvent);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('initializes the controller', () => {
    const { messengerClient } = SignatureControllerInit(getInitRequestMock());
    expect(messengerClient).toBeInstanceOf(Object);
  });

  it('passes the proper arguments to the controller', () => {
    SignatureControllerInit(getInitRequestMock());

    const controllerMock = jest.mocked(SignatureController);
    expect(controllerMock).toHaveBeenCalledWith({
      messenger: expect.any(Object),
      decodingApiUrl: process.env.DECODING_API_URL,
      isDecodeSignatureRequestEnabled: expect.any(Function),
      trace: expect.any(Function),
    });
  });

  it('tracks cancelWithReason events through AnalyticsController', () => {
    SignatureControllerInit(getInitRequestMock());

    const controllerMock = jest.mocked(SignatureController);
    const { on } = controllerMock.mock.results[0].value.hub;
    const cancelHandler = on.mock.calls.find(
      ([eventName]: [string, unknown]) => eventName === 'cancelWithReason',
    )?.[1];

    cancelHandler?.({
      metadata: { type: 'personal_sign' },
      reason: 'user_rejected',
    });

    expect(trackEventMock).toHaveBeenCalledWith(
      createEventBuilder('user_rejected')
        .addCategory(MetaMetricsEventCategory.Transactions)
        .addProperties({
          action: 'Sign Request',
          type: 'personal_sign',
        })
        .build(),
    );
  });
});
