import { buildSupportLinkWithUserData } from './build-support-link';
import { SUPPORT_LINK } from './ui-utils';

describe('buildSupportLinkWithUserData', () => {
  const baseSupportLink = SUPPORT_LINK as string;
  const version = 'MOCK_VERSION';

  it('appends all user-identifying query parameters when provided', () => {
    const result = buildSupportLinkWithUserData(baseSupportLink, {
      version,
      profileId: 'profile-id',
      canonicalProfileId: 'canonical-profile-id',
      analyticsId: 'analytics-id',
      shieldCustomerId: 'shield-id',
    });

    const url = new URL(result);
    expect(url.searchParams.get('metamask_version')).toBe(version);
    expect(url.searchParams.get('metamask_profile_id')).toBe('profile-id');
    expect(url.searchParams.get('metamask_canonical_profile_id')).toBe(
      'canonical-profile-id',
    );
    expect(url.searchParams.get('metamask_metametrics_id')).toBe(
      'analytics-id',
    );
    expect(url.searchParams.get('shield_id')).toBe('shield-id');
  });

  it('omits optional query parameters when values are undefined', () => {
    const result = buildSupportLinkWithUserData(baseSupportLink, {
      version,
    });

    const url = new URL(result);
    expect(url.searchParams.get('metamask_version')).toBe(version);
    expect(url.searchParams.has('metamask_profile_id')).toBe(false);
    expect(url.searchParams.has('metamask_canonical_profile_id')).toBe(false);
    expect(url.searchParams.has('metamask_metametrics_id')).toBe(false);
    expect(url.searchParams.has('shield_id')).toBe(false);
  });

  it('includes canonical profile id independently of profile id', () => {
    const result = buildSupportLinkWithUserData(baseSupportLink, {
      version,
      canonicalProfileId: 'canonical-profile-id',
    });

    const url = new URL(result);
    expect(url.searchParams.get('metamask_canonical_profile_id')).toBe(
      'canonical-profile-id',
    );
    expect(url.searchParams.has('metamask_profile_id')).toBe(false);
  });
});
