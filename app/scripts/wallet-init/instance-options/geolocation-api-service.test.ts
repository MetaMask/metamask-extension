import { Env } from '@metamask/geolocation-controller';
import { isProduction } from '../../../../shared/lib/environment';
import { getGeolocationApiServiceInstanceOptions } from './geolocation-api-service';

jest.mock('../../../../shared/lib/environment');

const isProductionMock = jest.mocked(isProduction);

describe('getGeolocationApiServiceInstanceOptions', () => {
  beforeEach(() => {
    isProductionMock.mockReturnValue(false);
  });

  it('uses the dev environment outside production', () => {
    const options = getGeolocationApiServiceInstanceOptions();

    expect(options.env).toBe(Env.DEV);
    expect(options.fetch).toStrictEqual(expect.any(Function));
  });

  it('uses the production environment in production', () => {
    isProductionMock.mockReturnValue(true);

    const options = getGeolocationApiServiceInstanceOptions();

    expect(options.env).toBe(Env.PRD);
  });
});
