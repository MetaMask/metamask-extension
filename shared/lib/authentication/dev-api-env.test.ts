import { devApiEnv } from './dev-api-env';

describe('devApiEnv', () => {
  const original = process.env.MM_DEV_API_ENV;

  afterEach(() => {
    if (original === undefined) {
      delete process.env.MM_DEV_API_ENV;
    } else {
      process.env.MM_DEV_API_ENV = original;
    }
  });

  it('defaults to prod', () => {
    delete process.env.MM_DEV_API_ENV;
    expect(devApiEnv()).toBe('prod');
  });

  it('returns dev only when MM_DEV_API_ENV is dev', () => {
    process.env.MM_DEV_API_ENV = 'dev';
    expect(devApiEnv()).toBe('dev');

    process.env.MM_DEV_API_ENV = 'DEV';
    expect(devApiEnv()).toBe('dev');

    process.env.MM_DEV_API_ENV = 'prod';
    expect(devApiEnv()).toBe('prod');

    process.env.MM_DEV_API_ENV = 'nonsense';
    expect(devApiEnv()).toBe('prod');
  });
});
