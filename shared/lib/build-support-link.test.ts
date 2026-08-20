import { buildSupportLinkWithUserData } from './build-support-link';
import { SUPPORT_LINK } from './ui-utils';

describe('buildSupportLinkWithUserData', () => {
  const baseSupportLink = SUPPORT_LINK as string;
  const version = 'MOCK_VERSION';

  it('appends support metadata query parameters when provided', () => {
    const result = buildSupportLinkWithUserData(baseSupportLink, {
      version,
      customerServiceToken: 'customer-service-token',
      shieldCustomerId: 'shield-id',
    });

    const url = new URL(result);
    expect(url.searchParams.get('metamask_version')).toBe(version);
    expect(url.searchParams.get('customer_service_token')).toBe(
      'customer-service-token',
    );
    expect(url.searchParams.get('shield_id')).toBe('shield-id');
  });

  it('omits optional query parameters when values are undefined', () => {
    const result = buildSupportLinkWithUserData(baseSupportLink, {
      version,
    });

    const url = new URL(result);
    expect(url.searchParams.get('metamask_version')).toBe(version);
    expect(url.searchParams.has('customer_service_token')).toBe(false);
    expect(url.searchParams.has('shield_id')).toBe(false);
  });
});
