import {
  ENVIRONMENT_TYPE_FULLSCREEN,
  ENVIRONMENT_TYPE_NOTIFICATION,
  ENVIRONMENT_TYPE_POPUP,
  ENVIRONMENT_TYPE_SIDEPANEL,
  PLATFORM_CHROME,
  PLATFORM_FIREFOX,
} from '../../../shared/constants/app';
import { parsePortInfo } from './parse-port-info';

const RUNTIME_ID = 'extension-id';

jest.mock('webextension-polyfill', () => ({
  runtime: { id: 'extension-id' },
}));

jest.mock('./util', () => ({ getPlatform: jest.fn() }));

const { getPlatform } = {
  get addHexPrefix() {
    return jest.requireMock('../../../shared/lib/add-hex-prefix').addHexPrefix;
  },
  get addUrlProtocolPrefix() {
    return jest.requireMock('../../../shared/lib/url-utils')
      .addUrlProtocolPrefix;
  },
  get checkAlarmExists() {
    return jest.requireMock('./util').checkAlarmExists;
  },
  get convertEnglishWordlistIndicesToCodepoints() {
    return jest.requireMock('./util').convertEnglishWordlistIndicesToCodepoints;
  },
  get extractRpcDomain() {
    return jest.requireMock('./util').extractRpcDomain;
  },
  get formatTxMetaForRpcResult() {
    return jest.requireMock('./util').formatTxMetaForRpcResult;
  },
  get formatValue() {
    return jest.requireMock('../../../shared/lib/format-value').formatValue;
  },
  get generateRandomId() {
    return jest.requireMock('./util').generateRandomId;
  },
  get getBooleanFlag() {
    return jest.requireMock('../../../shared/lib/environment').getBooleanFlag;
  },
  get getChainType() {
    return jest.requireMock('./util').getChainType;
  },
  get getConversionRatesForNativeAsset() {
    return jest.requireMock('../../../shared/lib/asset-conversion-rates')
      .getConversionRatesForNativeAsset;
  },
  get getDeviceType() {
    return jest.requireMock('./util').getDeviceType;
  },
  get getEnvironmentType() {
    return jest.requireMock('../../../shared/lib/environment-type')
      .getEnvironmentType;
  },
  get getInstallType() {
    return jest.requireMock('./install-type').getInstallType;
  },
  get getMethodDataName() {
    return jest.requireMock('./util').getMethodDataName;
  },
  get getOs() {
    return jest.requireMock('./util').getOs;
  },
  get getPlatform() {
    return jest.requireMock('./util').getPlatform;
  },
  get getValidUrl() {
    return jest.requireMock('../../../shared/lib/url-utils').getValidUrl;
  },
  get initInstallType() {
    return jest.requireMock('./install-type').initInstallType;
  },
  get initializeRpcProviderDomains() {
    return jest.requireMock('./util').initializeRpcProviderDomains;
  },
  get isKnownDomain() {
    return jest.requireMock('./util').isKnownDomain;
  },
  get isPublicEndpointUrl() {
    return jest.requireMock('./util').isPublicEndpointUrl;
  },
  get isSpecialUseDomain() {
    return jest.requireMock('./util').isSpecialUseDomain;
  },
  get isValidAmount() {
    return jest.requireMock('../../../shared/lib/format-value').isValidAmount;
  },
  get isValidDate() {
    return jest.requireMock('./util').isValidDate;
  },
  get isValidEmail() {
    return jest.requireMock('../../../shared/lib/url-utils').isValidEmail;
  },
  get isWebOrigin() {
    return jest.requireMock('../../../shared/lib/url-utils').isWebOrigin;
  },
  get isWebUrl() {
    return jest.requireMock('../../../shared/lib/url-utils').isWebUrl;
  },
  get previousValueComparator() {
    return jest.requireMock('./util').previousValueComparator;
  },
  get shouldEmitDappViewedEvent() {
    return jest.requireMock('./util').shouldEmitDappViewedEvent;
  },
} as {
  getPlatform: jest.Mock;
};

describe('parsePortInfo', () => {
  beforeEach(() => {
    getPlatform.mockReturnValue(PLATFORM_CHROME);
  });

  it('classifies a Chrome extension-origin port as MetaMask UI', () => {
    const OriginalURL = globalThis.URL;
    jest.spyOn(globalThis, 'URL').mockImplementation((input) => {
      const url = new OriginalURL(String(input));
      if (String(input).startsWith('chrome-extension://')) {
        Object.defineProperty(url, 'origin', {
          value: `chrome-extension://${RUNTIME_ID}`,
        });
      }
      return url;
    });

    try {
      const result = parsePortInfo({
        name: ENVIRONMENT_TYPE_POPUP,
        sender: { url: `chrome-extension://${RUNTIME_ID}/popup.html` },
      });

      expect(result.isMetaMaskUIPort).toBe(true);
      expect(result.processName).toBe(ENVIRONMENT_TYPE_POPUP);
    } finally {
      jest.restoreAllMocks();
    }
  });

  it('classifies a contentscript port as not MetaMask UI', () => {
    const result = parsePortInfo({
      name: 'contentscript',
      sender: { url: 'https://example.com/page' },
    });

    expect(result.isMetaMaskUIPort).toBe(false);
    expect(result.senderUrl).toEqual(new URL('https://example.com/page'));
  });

  it('returns a null senderUrl when the port has no sender url', () => {
    const result = parsePortInfo({ name: 'contentscript' });

    expect(result.senderUrl).toBeNull();
    expect(result.isMetaMaskUIPort).toBe(false);
  });

  it('classifies Firefox UI ports by process name', () => {
    getPlatform.mockReturnValue(PLATFORM_FIREFOX);

    for (const processName of [
      ENVIRONMENT_TYPE_POPUP,
      ENVIRONMENT_TYPE_NOTIFICATION,
      ENVIRONMENT_TYPE_FULLSCREEN,
    ]) {
      const result = parsePortInfo({
        name: processName,
        sender: { url: 'https://example.com' },
      });

      expect(result.isMetaMaskUIPort).toBe(true);
    }
  });

  it('does not treat a Firefox sidepanel process name as MetaMask UI', () => {
    getPlatform.mockReturnValue(PLATFORM_FIREFOX);

    const result = parsePortInfo({ name: ENVIRONMENT_TYPE_SIDEPANEL });

    expect(result.isMetaMaskUIPort).toBe(false);
  });
});
