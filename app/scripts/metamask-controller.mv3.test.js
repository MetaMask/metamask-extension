import { metamaskControllerArgumentConstructor } from '../../test/helpers/metamask-controller';

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

jest.mock('../../ui/store/actions', () => ({
  createNewVaultAndGetSeedPhrase: jest.fn().mockResolvedValue(null),
  unlockAndGetSeedPhrase: jest.fn().mockResolvedValue(null),
  createNewVaultAndRestore: jest.fn(),
  verifySeedPhrase: jest.fn(),
}));

jest.mock('./lib/createLoggerMiddleware', () => createLoggerMiddlewareMock);
jest.mock('../../shared/modules/mv3.utils', () => ({
  isManifestV3: true,
}));

const MetaMaskControllerMV3 = require('./metamask-controller').default;

describe('MetaMaskController', function () {
  const sessionSetSpy = jest.fn().mockImplementation(() => {
    console.log('called');
  });

  const storageMock = {
    session: {
      set: sessionSetSpy,
      get: jest.fn(),
    },
  };

  beforeAll(async function () {
    globalThis.isFirstTimeProfileLoaded = true;
  });

  beforeEach(function () {
    jest.resetModules();
    sessionSetSpy.mockClear();

    jest.spyOn(MetaMaskControllerMV3.prototype, 'resetStates').mockClear();
  });

  afterEach(function () {
    // jest.mockRestore();
    jest.clearAllMocks();
  });

  describe('should reset states on first time profile load', function () {
    it('in mv3, it should reset state', function () {
      const metamaskControllerMV3 = new MetaMaskControllerMV3(
        metamaskControllerArgumentConstructor({
          isFirstMetaMaskControllerSetup: true,
          storageMock,
        }),
      );

      expect(metamaskControllerMV3.resetStates).toHaveBeenCalledTimes(1);
      expect(sessionSetSpy).toHaveBeenNthCalledWith(1, {
        isFirstMetaMaskControllerSetup: false,
      });
    });

    it('in mv3, it should not reset states if isFirstMetaMaskControllerSetup is false', function () {
      const metamaskControllerMV3 = new MetaMaskControllerMV3(
        metamaskControllerArgumentConstructor({
          storageMock,
        }),
      );
      expect(metamaskControllerMV3.resetStates).not.toHaveBeenCalled();
      expect(sessionSetSpy).not.toHaveBeenCalled();
    });
  });
});
