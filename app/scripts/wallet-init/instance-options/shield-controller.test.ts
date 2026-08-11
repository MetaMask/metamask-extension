import { Env } from '@metamask/shield-controller';
import { loadShieldConfig } from '../../../../shared/lib/shield';
import {
  getShieldApiServiceInstanceOptions,
  getShieldControllerInstanceOptions,
} from './shield-controller';

jest.mock('../../../../shared/lib/shield');

describe('getShieldControllerInstanceOptions', () => {
  it('returns the signature request normalizer', () => {
    expect(getShieldControllerInstanceOptions()).toStrictEqual({
      normalizeSignatureRequest: expect.any(Function),
    });
  });
});

describe('getShieldApiServiceInstanceOptions', () => {
  it('returns the configured environment and service dependencies', () => {
    jest.mocked(loadShieldConfig).mockReturnValue({
      shieldEnv: Env.UAT,
    } as ReturnType<typeof loadShieldConfig>);

    expect(getShieldApiServiceInstanceOptions()).toStrictEqual({
      env: Env.UAT,
      fetchFunction: expect.any(Function),
      captureException: expect.any(Function),
    });
  });
});
