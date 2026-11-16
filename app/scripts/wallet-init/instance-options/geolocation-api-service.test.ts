import { Env } from '@metamask/geolocation-controller';
import { isProduction } from '../../../../shared/lib/environment';
import { trace, TraceName } from '../../../../shared/lib/trace';
import {
  readActiveSpan,
  startServiceWorkerSentry,
  stopServiceWorkerSentry,
} from '../../../../test/lib/service-worker-sentry';
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

describe('getGeolocationApiServiceInstanceOptions fetch (real SDK)', () => {
  afterEach(() => {
    stopServiceWorkerSentry();
    jest.restoreAllMocks();
  });

  it('sends a request made with no caller under its own root trace', async () => {
    const ambientTraceId = startServiceWorkerSentry();
    let seen: ReturnType<typeof readActiveSpan>;
    jest.spyOn(globalThis, 'fetch').mockImplementation(async () => {
      seen = readActiveSpan();
      return new Response('{}');
    });

    await getGeolocationApiServiceInstanceOptions().fetch?.(
      'https://on-ramp.api.cx.metamask.io/geolocation',
    );

    expect(seen).toStrictEqual({
      traceId: expect.any(String),
      rootName: TraceName.GeolocationFetch,
    });
    expect(seen?.traceId).not.toBe(ambientTraceId);
  });

  it("keeps a request made on a caller's behalf in the caller's trace", async () => {
    startServiceWorkerSentry();
    let seen: ReturnType<typeof readActiveSpan>;
    jest.spyOn(globalThis, 'fetch').mockImplementation(async () => {
      seen = readActiveSpan();
      return new Response('{}');
    });

    await trace({ name: TraceName.BackgroundPoll, root: true }, () =>
      getGeolocationApiServiceInstanceOptions().fetch?.(
        'https://on-ramp.api.cx.metamask.io/geolocation',
      ),
    );

    expect(seen?.rootName).toBe(TraceName.BackgroundPoll);
  });
});
