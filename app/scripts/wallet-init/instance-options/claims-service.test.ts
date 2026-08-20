import { Env } from '@metamask/claims-controller';
import { loadShieldConfig } from '../../../../shared/lib/shield/config';
import { getClaimsServiceInstanceOptions } from './claims-service';

jest.mock('../../../../shared/lib/shield/config');

describe('getClaimsServiceInstanceOptions', () => {
  it('returns the configured claims environment', () => {
    jest.mocked(loadShieldConfig).mockReturnValue({
      claimsEnv: Env.UAT,
    } as ReturnType<typeof loadShieldConfig>);

    const options = getClaimsServiceInstanceOptions();

    expect(options).toStrictEqual({
      env: Env.UAT,
    });
  });
});
