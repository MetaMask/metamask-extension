export {};

describe('getFallbackBlockedRegions', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('returns empty array when MM_PERPS_BLOCKED_REGIONS is not set', async () => {
    delete process.env.MM_PERPS_BLOCKED_REGIONS;
    // @ts-expect-error Jest resolves .ts directly; tsc wants .js extension
    const { getFallbackBlockedRegions } = await import('./getPerpsController');
    expect(getFallbackBlockedRegions()).toEqual([]);
  });

  it('returns empty array when MM_PERPS_BLOCKED_REGIONS is empty string', async () => {
    process.env.MM_PERPS_BLOCKED_REGIONS = '';
    // @ts-expect-error Jest resolves .ts directly; tsc wants .js extension
    const { getFallbackBlockedRegions } = await import('./getPerpsController');
    expect(getFallbackBlockedRegions()).toEqual([]);
  });

  it('parses comma-separated region codes', async () => {
    process.env.MM_PERPS_BLOCKED_REGIONS = 'US,CA-ON,GB,BE';
    // @ts-expect-error Jest resolves .ts directly; tsc wants .js extension
    const { getFallbackBlockedRegions } = await import('./getPerpsController');
    expect(getFallbackBlockedRegions()).toEqual(['US', 'CA-ON', 'GB', 'BE']);
  });

  it('trims whitespace around region codes', async () => {
    process.env.MM_PERPS_BLOCKED_REGIONS = ' US , CA-ON , GB ';
    // @ts-expect-error Jest resolves .ts directly; tsc wants .js extension
    const { getFallbackBlockedRegions } = await import('./getPerpsController');
    expect(getFallbackBlockedRegions()).toEqual(['US', 'CA-ON', 'GB']);
  });

  it('filters out empty segments', async () => {
    process.env.MM_PERPS_BLOCKED_REGIONS = 'US,,CA-ON,,';
    // @ts-expect-error Jest resolves .ts directly; tsc wants .js extension
    const { getFallbackBlockedRegions } = await import('./getPerpsController');
    expect(getFallbackBlockedRegions()).toEqual(['US', 'CA-ON']);
  });
});

// Phase 2: getPerpsController no longer instantiates a UI PerpsController.
// It returns a facade that delegates all calls to the background.
describe('getPerpsStreamingController', () => {
  let getPerpsStreamingController: typeof import('./getPerpsController').getPerpsStreamingController;
  let resetPerpsController: typeof import('./getPerpsController').resetPerpsController;
  let isPerpsControllerInitialized: typeof import('./getPerpsController').isPerpsControllerInitialized;
  let markPerpsControllerInitialized: typeof import('./getPerpsController').markPerpsControllerInitialized;
  let getPerpsControllerCurrentAddress: typeof import('./getPerpsController').getPerpsControllerCurrentAddress;

  beforeEach(async () => {
    jest.resetModules();
    // @ts-expect-error Jest resolves .ts directly; tsc wants .js extension
    const module = await import('./getPerpsController');
    getPerpsStreamingController = module.getPerpsStreamingController;
    resetPerpsController = module.resetPerpsController;
    isPerpsControllerInitialized = module.isPerpsControllerInitialized;
    markPerpsControllerInitialized = module.markPerpsControllerInitialized;
    getPerpsControllerCurrentAddress = module.getPerpsControllerCurrentAddress;
    await resetPerpsController();
  });

  afterEach(async () => {
    await resetPerpsController();
  });

  it('returns a facade for any address', async () => {
    const facade = await getPerpsStreamingController('0xaaa');
    expect(facade).toBeDefined();
  });

  it('returns the same facade instance for the same address (idempotent)', async () => {
    const first = await getPerpsStreamingController('0xaaa');
    const second = await getPerpsStreamingController('0xaaa');
    expect(first).toBe(second);
  });

  it('throws when no address is provided', async () => {
    await expect(getPerpsStreamingController('')).rejects.toThrow(
      'No account selected',
    );
  });

  it('tracks the current address', async () => {
    await getPerpsStreamingController('0xaaa');
    expect(getPerpsControllerCurrentAddress()).toBe('0xaaa');
  });

  it('clears the address when a different address is provided', async () => {
    await getPerpsStreamingController('0xaaa');
    await getPerpsStreamingController('0xbbb');
    expect(getPerpsControllerCurrentAddress()).toBe('0xbbb');
  });

  it('isPerpsControllerInitialized returns false before markPerpsControllerInitialized', async () => {
    await getPerpsStreamingController('0xaaa');
    expect(isPerpsControllerInitialized('0xaaa')).toBe(false);
  });

  it('isPerpsControllerInitialized returns true after markPerpsControllerInitialized', async () => {
    await getPerpsStreamingController('0xaaa');
    markPerpsControllerInitialized('0xaaa');
    expect(isPerpsControllerInitialized('0xaaa')).toBe(true);
  });

  it('resetPerpsController clears state', async () => {
    await getPerpsStreamingController('0xaaa');
    markPerpsControllerInitialized('0xaaa');
    await resetPerpsController();
    expect(isPerpsControllerInitialized('0xaaa')).toBe(false);
    expect(getPerpsControllerCurrentAddress()).toBeNull();
  });
});
