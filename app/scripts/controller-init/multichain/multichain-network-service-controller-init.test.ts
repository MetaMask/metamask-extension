import { MultichainNetworkServiceController } from '@metamask/multichain-network-controller';
import { MultichainNetworkServiceControllerInit } from './multichain-network-service-controller-init';

jest.mock('@metamask/multichain-network-controller');

describe('MultichainNetworkServiceControllerInit', () => {
  const multichainNetworkServiceControllerClassMock = jest.mocked(
    MultichainNetworkServiceController,
  );

  beforeEach(() => {
    jest.resetAllMocks();
    window.fetch = jest.fn();
  });

  it('returns controller instance', () => {
    const controller = MultichainNetworkServiceControllerInit();
    expect(controller).toBeInstanceOf(MultichainNetworkServiceController);
  });

  it('initializes with window.fetch', () => {
    MultichainNetworkServiceControllerInit();

    expect(multichainNetworkServiceControllerClassMock).toHaveBeenCalledWith(
      expect.objectContaining({
        fetch: expect.any(Function),
      }),
    );
  });
});
