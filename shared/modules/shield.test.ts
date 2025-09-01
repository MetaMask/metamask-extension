import { getShieldGatewayConfig } from './shield';

const setup = ({
  isShieldEnabled = true,
  gatewayUrl = 'https://shield.example.com',
}: {
  isShieldEnabled?: boolean;
  gatewayUrl?: string | null;
} = {}) => {
  process.env.METAMASK_SHIELD_ENABLED = isShieldEnabled ? 'true' : 'false';
  if (gatewayUrl === null) {
    delete process.env.SHIELD_GATEWAY_URL;
  } else {
    process.env.SHIELD_GATEWAY_URL = gatewayUrl;
  }

  return {
    gatewayUrl,
    mockGetToken: jest.fn().mockResolvedValue('token'),
    targetUrl: 'https://example.com',
  };
};

describe('getShieldGatewayConfig', () => {
  it('returns the correct config when the feature is enabled', async () => {
    const { gatewayUrl, targetUrl, mockGetToken } = setup();

    const config = await getShieldGatewayConfig(mockGetToken, targetUrl);
    expect(config).toStrictEqual({
      newUrl: `${gatewayUrl}/proxy?url=${encodeURIComponent(targetUrl)}`,
      authorization: 'token',
    });
  });

  it('returns the correct config when the feature is disabled', async () => {
    const { targetUrl, mockGetToken } = setup({ isShieldEnabled: false });

    const config = await getShieldGatewayConfig(mockGetToken, targetUrl);
    expect(config).toStrictEqual({
      newUrl: targetUrl,
      authorization: undefined,
    });
  });

  it('returns the correct config when the token cannot be retrieved', async () => {
    const { targetUrl, mockGetToken } = setup();
    mockGetToken.mockRejectedValue(new Error('Failed to get token'));

    const config = await getShieldGatewayConfig(mockGetToken, targetUrl);
    expect(config).toStrictEqual({
      newUrl: targetUrl,
      authorization: undefined,
    });
  });

  it('throws an error if the feature is enabled but the gateway URL is not set', async () => {
    const { targetUrl, mockGetToken } = setup({ gatewayUrl: null });
    await expect(
      getShieldGatewayConfig(mockGetToken, targetUrl),
    ).rejects.toThrow('Shield gateway URL is not set');
  });
});
