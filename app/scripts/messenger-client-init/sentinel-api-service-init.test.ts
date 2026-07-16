import { SentinelApiService } from '@metamask/sentinel-api-service';
import { getRootMessenger } from '../lib/messenger';
import type { TransactionControllerInitMessenger } from '../wallet-init/messengers/transaction-controller-messenger';
import { getTransactionControllerInitMessenger } from '../wallet-init/messengers/transaction-controller-messenger';
import { MessengerClientInitRequest } from './types';
import { buildControllerInitRequestMock } from './test/utils';
import { SentinelApiServiceInit } from './sentinel-api-service-init';

jest.mock('@metamask/sentinel-api-service');

function getInitRequestMock(): jest.Mocked<
  MessengerClientInitRequest<TransactionControllerInitMessenger>
> {
  const baseMessenger = getRootMessenger<never, never>();

  const requestMock = {
    ...buildControllerInitRequestMock(),
    controllerMessenger: getTransactionControllerInitMessenger(baseMessenger),
    initMessenger: undefined,
  };

  return requestMock;
}

describe('SentinelApiServiceInit', () => {
  it('initializes the service', () => {
    const { messengerClient } = SentinelApiServiceInit(getInitRequestMock());
    expect(messengerClient).toBeInstanceOf(SentinelApiService);
  });

  it('passes the proper arguments to the service', () => {
    SentinelApiServiceInit(getInitRequestMock());

    const serviceMock = jest.mocked(SentinelApiService);
    expect(serviceMock).toHaveBeenCalledWith({
      messenger: expect.any(Object),
      fetch: expect.any(Function),
      clientId: 'extension',
      clientVersion: process.env.METAMASK_VERSION,
    });
  });
});
