import { Env } from '@metamask/claims-controller';
import { loadShieldConfig } from '../../../../shared/lib/shield/config';
import { getClaimsControllerInstanceOptions } from './claims-controller';

jest.mock('../../../../shared/lib/shield/config');

describe('getClaimsControllerInstanceOptions', () => {
  it('returns the configured claims environment and fetch function', () => {
    jest.mocked(loadShieldConfig).mockReturnValue({
      claimsEnv: Env.UAT,
    } as ReturnType<typeof loadShieldConfig>);

    const options = getClaimsControllerInstanceOptions();

    expect(options).toStrictEqual({
      env: Env.UAT,
      fetchFunction: expect.any(Function),
    });
  });
});
