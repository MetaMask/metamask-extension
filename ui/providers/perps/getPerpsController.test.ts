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
    const { getFallbackBlockedRegions } = await import('./getPerpsController');
    expect(getFallbackBlockedRegions()).toEqual([]);
  });

  it('returns empty array when MM_PERPS_BLOCKED_REGIONS is empty string', async () => {
    process.env.MM_PERPS_BLOCKED_REGIONS = '';
    const { getFallbackBlockedRegions } = await import('./getPerpsController');
    expect(getFallbackBlockedRegions()).toEqual([]);
  });

  it('parses comma-separated region codes', async () => {
    process.env.MM_PERPS_BLOCKED_REGIONS = 'US,CA-ON,GB,BE';
    const { getFallbackBlockedRegions } = await import('./getPerpsController');
    expect(getFallbackBlockedRegions()).toEqual(['US', 'CA-ON', 'GB', 'BE']);
  });

  it('trims whitespace around region codes', async () => {
    process.env.MM_PERPS_BLOCKED_REGIONS = ' US , CA-ON , GB ';
    const { getFallbackBlockedRegions } = await import('./getPerpsController');
    expect(getFallbackBlockedRegions()).toEqual(['US', 'CA-ON', 'GB']);
  });

  it('filters out empty segments', async () => {
    process.env.MM_PERPS_BLOCKED_REGIONS = 'US,,CA-ON,,';
    const { getFallbackBlockedRegions } = await import('./getPerpsController');
    expect(getFallbackBlockedRegions()).toEqual(['US', 'CA-ON']);
  });
});

type Deferred = {
  promise: Promise<void>;
  resolve: () => void;
};

function createDeferred(): Deferred {
  let resolve: () => void = () => undefined;
  const promise = new Promise<void>((promiseResolve) => {
    resolve = promiseResolve;
  });

  return { promise, resolve };
}

const mockInitDeferreds = new Map<string, Deferred>();
const mockCreatedControllers: {
  address: string;
  init: jest.Mock<Promise<void>, []>;
  disconnect: jest.Mock<Promise<void>, []>;
}[] = [];

const mockCreatePerpsInfrastructure = jest.fn(
  ({
    selectedAddress,
    findNetworkClientIdForChain,
  }: {
    selectedAddress: string;
    findNetworkClientIdForChain?: (chainId: string) => string | undefined;
  }) => ({
    selectedAddress,
    findNetworkClientIdForChain,
  }),
);

const mockGetDefaultPerpsControllerState = jest.fn(() => ({}));

let getPerpsController: typeof import('./getPerpsController').getPerpsController;
let resetPerpsController: typeof import('./getPerpsController').resetPerpsController;

function createMockStore() {
  return {
    getState: () => ({
      metamask: {
        remoteFeatureFlags: {},
        networkConfigurationsByChainId: {
          '0xa4b1': {
            defaultRpcEndpointIndex: 0,
            rpcEndpoints: [{ networkClientId: 'arbitrum-mainnet' }],
          },
        },
      },
    }),
    subscribe: () => () => undefined,
  } as unknown as Parameters<typeof getPerpsController>[1];
}

describe('getPerpsController', () => {
  beforeAll(async () => {
    jest.resetModules();
    jest.doMock('../../../app/scripts/controllers/perps', () => {
      class MockPerpsController {
        public address: string;

        public init: jest.Mock<Promise<void>, []>;

        public disconnect: jest.Mock<Promise<void>, []>;

        public state = {};

        constructor({
          infrastructure,
        }: {
          infrastructure: { selectedAddress: string };
        }) {
          this.address = infrastructure.selectedAddress;
          const deferred = mockInitDeferreds.get(this.address);

          if (!deferred) {
            throw new Error(`Missing init deferred for ${this.address}`);
          }

          this.init = jest.fn(() => deferred.promise);
          this.disconnect = jest.fn(async () => undefined);

          mockCreatedControllers.push({
            address: this.address,
            init: this.init,
            disconnect: this.disconnect,
          });
        }
      }

      return {
        PerpsController: MockPerpsController,
        createPerpsInfrastructure: mockCreatePerpsInfrastructure,
        getDefaultPerpsControllerState: mockGetDefaultPerpsControllerState,
      };
    });

    const module = await import('./getPerpsController');
    getPerpsController = module.getPerpsController;
    resetPerpsController = module.resetPerpsController;
  });

  beforeEach(async () => {
    await resetPerpsController();
    jest.clearAllMocks();
    mockInitDeferreds.clear();
    mockCreatedControllers.length = 0;
  });

  afterEach(async () => {
    for (const deferred of mockInitDeferreds.values()) {
      deferred.resolve();
    }

    await resetPerpsController();
    mockInitDeferreds.clear();
    mockCreatedControllers.length = 0;
  });

  it('reuses the same in-flight initialization for concurrent same-address requests', async () => {
    const deferred = createDeferred();
    mockInitDeferreds.set('0xaaa', deferred);
    const mockStore = createMockStore();

    const firstRequest = getPerpsController('0xaaa', mockStore);
    const secondRequest = getPerpsController('0xaaa', mockStore);

    expect(mockCreatePerpsInfrastructure).toHaveBeenCalledTimes(1);

    deferred.resolve();
    const [firstController, secondController] = await Promise.all([
      firstRequest,
      secondRequest,
    ]);

    expect(firstController).toBe(secondController);
    expect(mockCreatedControllers).toHaveLength(1);
  });

  it('returns the new address controller when address changes during in-flight init', async () => {
    const deferredA = createDeferred();
    const deferredB = createDeferred();
    mockInitDeferreds.set('0xaaa', deferredA);
    mockInitDeferreds.set('0xbbb', deferredB);
    const mockStore = createMockStore();

    const requestA = getPerpsController('0xaaa', mockStore);
    const requestB = getPerpsController('0xbbb', mockStore);

    deferredB.resolve();
    const controllerB = await requestB;

    deferredA.resolve();
    const controllerA = await requestA;

    expect(controllerA).toBe(controllerB);
    expect(mockCreatePerpsInfrastructure).toHaveBeenCalledTimes(2);

    const staleController = mockCreatedControllers.find(
      (controller) => controller.address === '0xaaa',
    );
    expect(staleController?.disconnect).toHaveBeenCalledTimes(1);

    const activeController = await getPerpsController('0xbbb', mockStore);
    expect(activeController).toBe(controllerB);
  });

  it('disconnects initialized controller when switching to a different address', async () => {
    const deferredA = createDeferred();
    mockInitDeferreds.set('0xaaa', deferredA);
    const mockStore = createMockStore();

    const controllerARequest = getPerpsController('0xaaa', mockStore);
    deferredA.resolve();
    const controllerA = await controllerARequest;

    const createdA = mockCreatedControllers.find(
      (controller) => controller.address === '0xaaa',
    );
    expect(createdA).toBeDefined();

    const deferredB = createDeferred();
    mockInitDeferreds.set('0xbbb', deferredB);
    const controllerBRequest = getPerpsController('0xbbb', mockStore);

    expect(createdA?.disconnect).toHaveBeenCalledTimes(1);

    deferredB.resolve();
    const controllerB = await controllerBRequest;

    expect(controllerB).not.toBe(controllerA);
  });

  it('injects a synchronous network-client resolver from Redux state', async () => {
    const deferred = createDeferred();
    mockInitDeferreds.set('0xaaa', deferred);

    const mockStore = {
      getState: () => ({
        metamask: {
          remoteFeatureFlags: {},
          networkConfigurationsByChainId: {
            '0xa4b1': {
              defaultRpcEndpointIndex: 0,
              rpcEndpoints: [{ networkClientId: 'arbitrum-mainnet' }],
            },
          },
        },
      }),
      subscribe: () => () => undefined,
    };

    const request = getPerpsController(
      '0xaaa',
      mockStore as unknown as Parameters<typeof getPerpsController>[1],
    );

    expect(mockCreatePerpsInfrastructure).toHaveBeenCalledTimes(1);
    const [infrastructureOptions] = mockCreatePerpsInfrastructure.mock
      .calls[0] as [
      {
        findNetworkClientIdForChain: (chainId: string) => string | undefined;
      },
    ];
    const { findNetworkClientIdForChain } = infrastructureOptions;

    expect(findNetworkClientIdForChain('0xa4b1')).toBe('arbitrum-mainnet');
    expect(findNetworkClientIdForChain('0xA4B1')).toBe('arbitrum-mainnet');
    expect(findNetworkClientIdForChain('0xdead')).toBeUndefined();

    deferred.resolve();
    await request;
  });
});
