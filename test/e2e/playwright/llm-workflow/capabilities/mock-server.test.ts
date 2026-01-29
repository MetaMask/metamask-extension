import type { Mockttp } from 'mockttp';
import { MetaMaskMockServerCapability } from './mock-server';

const mockStart = jest.fn();
const mockStop = jest.fn();
const mockSetupDefaultMocks = jest.fn();
const mockGetServer = jest.fn();
const mockGetPort = jest.fn();

jest.mock('../mock-server', () => {
  return {
    MockServer: jest.fn().mockImplementation(() => ({
      start: mockStart,
      stop: mockStop,
      setupDefaultMocks: mockSetupDefaultMocks,
      getServer: mockGetServer,
      getPort: mockGetPort,
    })),
  };
});

describe('MetaMaskMockServerCapability', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetPort.mockReturnValue(8000);
  });

  it('does not start when disabled', async () => {
    const capability = new MetaMaskMockServerCapability({ enabled: false });

    await capability.start();

    expect(mockStart).not.toHaveBeenCalled();
    expect(mockSetupDefaultMocks).not.toHaveBeenCalled();
  });

  it('starts and configures the mock server when enabled', async () => {
    const testSpecificMock = jest.fn<Promise<void>, [Mockttp]>();
    const fetchWithTimeout = jest
      .fn<Promise<Response>, [string, RequestInit, number | undefined]>()
      .mockResolvedValue({ ok: true } as Response);
    const mockServerInstance = {} as Mockttp;
    mockGetServer.mockReturnValue(mockServerInstance);

    const capability = new MetaMaskMockServerCapability({
      enabled: true,
      fetchWithTimeout,
      testSpecificMock,
    });

    await capability.start();

    expect(mockStart).toHaveBeenCalled();
    expect(mockSetupDefaultMocks).toHaveBeenCalled();
    expect(testSpecificMock).toHaveBeenCalledWith(mockServerInstance);
  });

  it('stops the mock server when running', async () => {
    const fetchWithTimeout = jest
      .fn<Promise<Response>, [string, RequestInit, number | undefined]>()
      .mockResolvedValue({ ok: true } as Response);

    const capability = new MetaMaskMockServerCapability({
      enabled: true,
      fetchWithTimeout,
    });

    await capability.start();
    await capability.stop();

    expect(mockStop).toHaveBeenCalled();
  });
});
