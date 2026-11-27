import { loadShieldConfig } from '../../../../shared/lib/shield/config';
import { getClaimsServiceInstanceOptions } from './claims-service';

jest.mock('../../../../shared/lib/shield/config');

describe('getClaimsServiceInstanceOptions', () => {
  it('returns the configured claims API base URL', () => {
    jest.mocked(loadShieldConfig).mockReturnValue({
      claimsApiUrl: 'https://claims.uat-api.cx.metamask.io',
    } as ReturnType<typeof loadShieldConfig>);

    const options = getClaimsServiceInstanceOptions();

    expect(options).toStrictEqual({
      baseUrl: 'https://claims.uat-api.cx.metamask.io',
    });
  });
});
