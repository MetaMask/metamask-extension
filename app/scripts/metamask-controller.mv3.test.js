import { cloneDeep, noop } from 'lodash';
import browser from 'webextension-polyfill';
import { FIRST_TIME_CONTROLLER_STATE } from '../../test/helpers/metamask-controller';

const Ganache = require('../../test/e2e/ganache');

const INFURA_PROJECT_ID = 'foo';

const ganacheServer = new Ganache();

const browserPolyfillMock = {
  runtime: {
    id: 'fake-extension-id',
    onInstalled: {
      addListener: () => undefined,
    },
    onMessageExternal: {
      addListener: () => undefined,
    },
    getPlatformInfo: async () => 'mac',
  },
  storage: {
    session: {
      set: noop,
      get: noop,
    },
  },
};

let loggerMiddlewareMock;

const createLoggerMiddlewareMock = () => (req, res, next) => {
  if (loggerMiddlewareMock) {
    loggerMiddlewareMock.requests.push(req);
    next((cb) => {
      loggerMiddlewareMock.responses.push(res);
      cb();
    });
    return;
  }
  next();
};

const MOCK_TOKEN_BALANCE = '888';

function MockEthContract() {
  return () => {
    return {
      at: () => {
        return {
          balanceOf: () => MOCK_TOKEN_BALANCE,
        };
      },
    };
  };
}
const MockMv3Utils = () => ({
  isManifestV3: () => true,
});

function metamaskControllerArgumentConstructor({
  isFirstMetaMaskControllerSetup = false,
} = {}) {
  return {
    showUserConfirmation: noop,
    encryptor: {
      encrypt(_, object) {
        this.object = object;
        return Promise.resolve('mock-encrypted');
      },
      decrypt() {
        return Promise.resolve(this.object);
      },
    },
    initState: cloneDeep(FIRST_TIME_CONTROLLER_STATE),
    initLangCode: 'en_US',
    platform: {
      showTransactionNotification: () => undefined,
      getVersion: () => 'foo',
    },
    browser: browserPolyfillMock,
    infuraProjectId: INFURA_PROJECT_ID,
    isFirstMetaMaskControllerSetup,
  };
}

jest.mock('./lib/createLoggerMiddleware', () => createLoggerMiddlewareMock);
jest.mock('ethjs-contract', () => MockEthContract);
jest.mock('../../shared/modules/mv3.utils', () => MockMv3Utils);

const MetaMaskControllerMV3 = require('./metamask-controller').default;

describe('MetaMaskController', function () {
  const sessionSetSpy = jest
    .spyOn(browserPolyfillMock.storage.session, 'set')
    .mockImplementation();

  beforeAll(async function () {
    globalThis.isFirstTimeProfileLoaded = true;
    await ganacheServer.start();
  });

  beforeEach(function () {
    jest.resetModules();

    browser.runtime = {
      ...browser.runtime,
      sendMessage: jest.fn().mockRejectedValue(),
    };

    jest.spyOn(MetaMaskControllerMV3.prototype, 'resetStates').mockClear();
  });

  afterEach(function () {
    // jest.mockRestore();
    jest.clearAllMocks();
  });

  afterAll(async function () {
    await ganacheServer.quit();
  });

  describe('should reset states on first time profile load', function () {
    it('in mv3, it should reset state', function () {
      jest.spyOn(MetaMaskControllerMV3.prototype, 'resetStates').mockClear();

      const metamaskControllerMV3 = new MetaMaskControllerMV3(
        metamaskControllerArgumentConstructor({
          isFirstMetaMaskControllerSetup: true,
        }),
      );

      expect(metamaskControllerMV3.resetStates).toHaveBeenCalledTimes(1);
      expect(sessionSetSpy).toHaveBeenNthCalledWith(1, {
        isFirstMetaMaskControllerSetup: false,
      });
    });

    it('in mv3, it should not reset states if isFirstMetaMaskControllerSetup is false', function () {
      sessionSetSpy.mockReset();
      const metamaskControllerMV3 = new MetaMaskControllerMV3(
        metamaskControllerArgumentConstructor(),
      );
      expect(metamaskControllerMV3.resetStates).not.toHaveBeenCalled();
      expect(sessionSetSpy).not.toHaveBeenCalled();
    });
  });
});
