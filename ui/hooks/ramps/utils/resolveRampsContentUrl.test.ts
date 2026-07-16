/**
 * @jest-environment jsdom
 */
import {
  getRampsContentBaseUrl,
  resolveRampsContentUrl,
} from './resolveRampsContentUrl';

describe('resolveRampsContentUrl', () => {
  const originalEnv = process.env.METAMASK_ENVIRONMENT;

  afterEach(() => {
    process.env.METAMASK_ENVIRONMENT = originalEnv;
  });

  it('returns null for empty values', () => {
    expect(resolveRampsContentUrl(null)).toBeNull();
    expect(resolveRampsContentUrl(undefined)).toBeNull();
    expect(resolveRampsContentUrl('')).toBeNull();
  });

  it('passes through absolute URLs', () => {
    const url =
      'https://on-ramp-content.api.cx.metamask.io/assets/providers/transak_light.png';
    expect(resolveRampsContentUrl(url)).toBe(url);
  });

  it('prefixes relative paths with the staging content host by default', () => {
    delete process.env.METAMASK_ENVIRONMENT;
    expect(resolveRampsContentUrl('/assets/providers/transak_light.png')).toBe(
      'https://on-ramp-content.uat-api.cx.metamask.io/assets/providers/transak_light.png',
    );
  });

  it('prefixes relative paths with the production content host', () => {
    process.env.METAMASK_ENVIRONMENT = 'production';
    expect(resolveRampsContentUrl('assets/providers/transak_light.png')).toBe(
      'https://on-ramp-content.api.cx.metamask.io/assets/providers/transak_light.png',
    );
  });

  it('exposes the matching content base URL', () => {
    process.env.METAMASK_ENVIRONMENT = 'production';
    expect(getRampsContentBaseUrl()).toBe(
      'https://on-ramp-content.api.cx.metamask.io',
    );
  });
});
