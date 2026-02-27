import type { Mockttp } from 'mockttp';
import * as mockttp from 'mockttp';
import { setupMocking } from '../../../mock-e2e';
import { MetaMaskMockServerCapability } from './mock-server';

const mockServerStart = jest.fn();
const mockServerStop = jest.fn();

jest.mock('mockttp', () => {
  return {
    generateCACertificate: jest.fn(),
    generateSPKIFingerprint: jest.fn(),
    getLocal: jest.fn(),
  };
});

jest.mock('../../../mock-e2e', () => {
  return {
    setupMocking: jest.fn(),
  };
});

const mockSetupMocking = jest.mocked(setupMocking);
const mockGenerateCACertificate = jest.mocked(mockttp.generateCACertificate);
const mockGenerateSPKIFingerprint = jest.mocked(
  mockttp.generateSPKIFingerprint,
);
const mockGetLocal = jest.mocked(mockttp.getLocal);

const mockServerInstance = {
  start: mockServerStart,
  stop: mockServerStop,
} as unknown as Mockttp;

describe('MetaMaskMockServerCapability', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGenerateCACertificate.mockResolvedValue({ cert: 'mock-cert' } as never);
    mockGenerateSPKIFingerprint.mockReturnValue('mock-spki-fingerprint');
    mockGetLocal.mockReturnValue(mockServerInstance);
    mockSetupMocking.mockResolvedValue(
      {} as Awaited<ReturnType<typeof setupMocking>>,
    );
  });

  it('does not start when disabled', async () => {
    const capability = new MetaMaskMockServerCapability({ enabled: false });

    await capability.start();

    expect(mockGetLocal).not.toHaveBeenCalled();
    expect(mockSetupMocking).not.toHaveBeenCalled();
  });

  it('starts and configures the mock server when enabled', async () => {
    const testSpecificMock = jest.fn<Promise<void>, [Mockttp]>();
    const fetchWithTimeout = jest
      .fn<Promise<Response>, [string, RequestInit, number | undefined]>()
      .mockResolvedValue({ ok: true } as Response);

    const capability = new MetaMaskMockServerCapability({
      enabled: true,
      fetchWithTimeout,
      testSpecificMock,
    });

    await capability.start();

    expect(mockGenerateCACertificate).toHaveBeenCalled();
    expect(mockGenerateSPKIFingerprint).toHaveBeenCalledWith('mock-cert');
    expect(mockGetLocal).toHaveBeenCalledWith({
      https: expect.anything(),
      cors: true,
    });
    expect(mockServerStart).toHaveBeenCalledWith(8000);
    expect(mockSetupMocking).toHaveBeenCalledWith(
      mockServerInstance,
      expect.any(Function),
      {
        chainId: '1337',
        ethConversionInUsd: '1700',
      },
    );

    const testSpecificMockAdapter = mockSetupMocking.mock.calls[0][1] as (
      mockServer: Mockttp,
    ) => Promise<unknown[]>;

    await testSpecificMockAdapter(mockServerInstance);

    expect(testSpecificMock).toHaveBeenCalledWith(mockServerInstance);
    expect(capability.getCertificateSpkiFingerprint()).toBe(
      'mock-spki-fingerprint',
    );
    const proxyPacScript = capability.getProxyPacScript('127.0.0.1:8000');
    expect(proxyPacScript).toContain('PROXY 127.0.0.1:8000');
    expect(proxyPacScript).not.toContain('PROXY 127.0.0.1:8000; DIRECT');
    expect(proxyPacScript).toContain(
      'host === "api.cx.metamask.io" || dnsDomainIs(host, ".api.cx.metamask.io")',
    );
    expect(proxyPacScript).toContain('if (normalizedHost === "localhost"');
  });

  it('passes custom chain id to shared setupMocking', async () => {
    const fetchWithTimeout = jest
      .fn<Promise<Response>, [string, RequestInit, number | undefined]>()
      .mockResolvedValue({ ok: true } as Response);

    const capability = new MetaMaskMockServerCapability({
      enabled: true,
      chainId: 1,
      fetchWithTimeout,
    });

    await capability.start();

    expect(mockSetupMocking).toHaveBeenCalledWith(
      mockServerInstance,
      expect.any(Function),
      {
        chainId: '1',
        ethConversionInUsd: '1700',
      },
    );
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

    expect(mockServerStop).toHaveBeenCalled();
    expect(capability.getCertificateSpkiFingerprint()).toBeUndefined();
  });
});
