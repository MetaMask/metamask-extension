import { getPortfolioUrl } from './portfolio';

describe('getPortfolioUrl', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv, PORTFOLIO_URL: 'https://portfolio.metamask.io' };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('should return base URL with default parameters', () => {
    const url = getPortfolioUrl();

    expect(url).toContain('https://portfolio.metamask.io');
    expect(url).toContain('metamaskEntry=');
    expect(url).toContain('metametricsId=');
    expect(url).toContain('metricsEnabled=false');
    expect(url).toContain('marketingEnabled=false');
  });

  it('should append the endpoint to the base URL', () => {
    const url = getPortfolioUrl('/swap');

    expect(url).toContain('https://portfolio.metamask.io/swap');
  });

  it('should include metamaskEntry parameter', () => {
    const url = getPortfolioUrl('', 'ext_portfolio_button');

    expect(url).toContain('metamaskEntry=ext_portfolio_button');
  });

  it('should include metametricsId parameter', () => {
    const url = getPortfolioUrl('', '', 'abc-123');

    expect(url).toContain('metametricsId=abc-123');
  });

  it('should set metricsEnabled to true when provided', () => {
    const url = getPortfolioUrl('', '', '', true);

    expect(url).toContain('metricsEnabled=true');
  });

  it('should set marketingEnabled to true when provided', () => {
    const url = getPortfolioUrl('', '', '', false, true);

    expect(url).toContain('marketingEnabled=true');
  });

  it('should include accountAddress when provided', () => {
    const address = '0x1234567890abcdef1234567890abcdef12345678';
    const url = getPortfolioUrl('', '', '', false, false, address);

    expect(url).toContain(`accountAddress=${address}`);
  });

  it('should not include accountAddress when not provided', () => {
    const url = getPortfolioUrl('', '', '', false, false);

    expect(url).not.toContain('accountAddress');
  });

  it('should include tab parameter when provided', () => {
    const url = getPortfolioUrl('', '', '', false, false, undefined, 'activity');

    expect(url).toContain('tab=activity');
  });

  it('should not include tab parameter when not provided', () => {
    const url = getPortfolioUrl('', '', '', false, false, '0xabc');

    expect(url).not.toContain('tab=');
  });

  it('should include all parameters together', () => {
    const url = getPortfolioUrl(
      '/bridge',
      'ext_bridge',
      'metrics-id-456',
      true,
      true,
      '0xdeadbeef',
      'tokens',
    );

    expect(url).toContain('/bridge');
    expect(url).toContain('metamaskEntry=ext_bridge');
    expect(url).toContain('metametricsId=metrics-id-456');
    expect(url).toContain('metricsEnabled=true');
    expect(url).toContain('marketingEnabled=true');
    expect(url).toContain('accountAddress=0xdeadbeef');
    expect(url).toContain('tab=tokens');
  });
});
