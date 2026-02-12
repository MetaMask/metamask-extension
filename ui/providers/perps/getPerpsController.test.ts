import { getFallbackBlockedRegions } from './getPerpsController';

describe('getFallbackBlockedRegions', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('returns empty array when MM_PERPS_BLOCKED_REGIONS is not set', () => {
    delete process.env.MM_PERPS_BLOCKED_REGIONS;
    expect(getFallbackBlockedRegions()).toEqual([]);
  });

  it('returns empty array when MM_PERPS_BLOCKED_REGIONS is empty string', () => {
    process.env.MM_PERPS_BLOCKED_REGIONS = '';
    expect(getFallbackBlockedRegions()).toEqual([]);
  });

  it('parses comma-separated region codes', () => {
    process.env.MM_PERPS_BLOCKED_REGIONS = 'US,CA-ON,GB,BE';
    expect(getFallbackBlockedRegions()).toEqual(['US', 'CA-ON', 'GB', 'BE']);
  });

  it('trims whitespace around region codes', () => {
    process.env.MM_PERPS_BLOCKED_REGIONS = ' US , CA-ON , GB ';
    expect(getFallbackBlockedRegions()).toEqual(['US', 'CA-ON', 'GB']);
  });

  it('filters out empty segments', () => {
    process.env.MM_PERPS_BLOCKED_REGIONS = 'US,,CA-ON,,';
    expect(getFallbackBlockedRegions()).toEqual(['US', 'CA-ON']);
  });
});
