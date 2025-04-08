import { MultichainNetworkService } from '@metamask/multichain-network-controller';
import { MultichainNetworkServiceInit } from './multichain-network-service-init';

jest.mock('@metamask/multichain-network-controller');

describe('MultichainNetworkServiceControllerInit', () => {
  const multichainNetworkServiceControllerClassMock = jest.mocked(
    MultichainNetworkService,
  );

  beforeEach(() => {
    jest.resetAllMocks();
    window.fetch = jest.fn();
  });

  it('returns controller instance', () => {
    const controller = MultichainNetworkServiceInit();
    expect(controller).toBeInstanceOf(MultichainNetworkService);
  });

  it('initializes with window.fetch', () => {
    MultichainNetworkServiceInit();

    expect(multichainNetworkServiceControllerClassMock).toHaveBeenCalledWith(
      expect.objectContaining({
        fetch: expect.any(Function),
      }),
    );
  });
});
