import {
  MOCK_ANY_NAMESPACE,
  Messenger,
  MockAnyNamespace,
} from '@metamask/messenger';
import {
  PhishingDataService,
  PhishingDataServiceMessenger,
} from '@metamask/phishing-controller';
import { MessengerClientInitRequest } from './types';
import { getPhishingDataServiceMessenger } from './messengers/phishing-data-service-messenger';
import { PhishingDataServiceInit } from './phishing-data-service-init';
import { buildControllerInitRequestMock } from './test/utils';

jest.mock('@metamask/phishing-controller');

function buildInitRequestMock() {
  const baseControllerMessenger = new Messenger<MockAnyNamespace, never, never>(
    { namespace: MOCK_ANY_NAMESPACE },
  );

  return {
    ...buildControllerInitRequestMock(),
    controllerMessenger: getPhishingDataServiceMessenger(
      baseControllerMessenger,
    ),
    initMessenger: undefined,
  } as unknown as jest.Mocked<
    MessengerClientInitRequest<PhishingDataServiceMessenger>
  >;
}

describe('PhishingDataServiceInit', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('should return service instance', () => {
    const requestMock = buildInitRequestMock();
    expect(
      PhishingDataServiceInit(requestMock).messengerClient,
    ).toBeInstanceOf(PhishingDataService);
  });

  it('should initialize the service with correct parameters', () => {
    const requestMock = buildInitRequestMock();
    PhishingDataServiceInit(requestMock);

    const serviceMock = jest.mocked(PhishingDataService);
    expect(serviceMock).toHaveBeenCalledWith({
      messenger: requestMock.controllerMessenger,
    });
  });

  it('should rehydrate the persisted query cache', () => {
    const requestMock = buildInitRequestMock();
    const { messengerClient } = PhishingDataServiceInit(requestMock);

    expect(jest.mocked(messengerClient).init).toHaveBeenCalledTimes(1);
  });
});
