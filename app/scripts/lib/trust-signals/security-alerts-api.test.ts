import {
  AddressScanResultType,
  PhishingController,
} from '@metamask/phishing-controller';
import { ResultType } from '../../../../shared/lib/trust-signals';
import {
  mapAddressScanResult,
  scanAddressAndAddToCache,
} from './security-alerts-api';

const CHAIN_ID_MOCK = '0x1';
const ADDRESS_MOCK = '0xABCDEF0000000000000000000000000000000001';
const CACHE_KEY_MOCK = `${CHAIN_ID_MOCK}:${ADDRESS_MOCK.toLowerCase()}`;

describe('mapAddressScanResult', () => {
  it('maps the controller ErrorResult value to the extension Error value', () => {
    expect(
      mapAddressScanResult({
        // eslint-disable-next-line @typescript-eslint/naming-convention
        result_type: AddressScanResultType.ErrorResult, // 'ErrorResult'
        label: '',
      }).result_type,
    ).toBe(ResultType.ErrorResult); // 'Error'
  });

  it('maps Malicious/Warning/Benign to the matching extension ResultType', () => {
    const cases: [AddressScanResultType, ResultType][] = [
      [AddressScanResultType.Malicious, ResultType.Malicious],
      [AddressScanResultType.Warning, ResultType.Warning],
      [AddressScanResultType.Benign, ResultType.Benign],
    ];
    for (const [controllerValue, extensionValue] of cases) {
      expect(
        mapAddressScanResult({
          // eslint-disable-next-line @typescript-eslint/naming-convention
          result_type: controllerValue,
          label: 'x',
        }).result_type,
      ).toBe(extensionValue);
    }
  });

  // `scanAddress` forwards the API response without validating `result_type`,
  // and the API can return `Trusted` even though the controller enum omits it.
  // TODO: Remove the assertion after https://consensyssoftware.atlassian.net/browse/PSAFE-584
  it('passes a Trusted verdict through even though the controller type omits it', () => {
    expect(
      mapAddressScanResult({
        // eslint-disable-next-line @typescript-eslint/naming-convention
        result_type: 'Trusted' as AddressScanResultType,
        label: 'Uniswap',
      }),
    ).toEqual({
      // eslint-disable-next-line @typescript-eslint/naming-convention
      result_type: ResultType.Trusted,
      label: 'Uniswap',
    });
  });
});

describe('scanAddressAndAddToCache', () => {
  const scanAddressMock = jest.fn();
  const phishingControllerMock = {
    scanAddress: scanAddressMock,
  } as unknown as Pick<PhishingController, 'scanAddress'>;

  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('returns the cached response without calling the controller', async () => {
    const cached = {
      // eslint-disable-next-line @typescript-eslint/naming-convention
      result_type: ResultType.Benign,
      label: '',
    };
    const result = await scanAddressAndAddToCache(
      ADDRESS_MOCK,
      jest.fn().mockReturnValue(cached),
      jest.fn(),
      CHAIN_ID_MOCK,
      phishingControllerMock,
    );
    expect(result).toBe(cached);
    expect(scanAddressMock).not.toHaveBeenCalled();
  });

  it('returns a cached Loading entry without scanning again, deduplicating concurrent scans', async () => {
    const cachedLoading = {
      // eslint-disable-next-line @typescript-eslint/naming-convention
      result_type: ResultType.Loading,
      label: '',
    };
    const addMock = jest.fn();
    const result = await scanAddressAndAddToCache(
      ADDRESS_MOCK,
      jest.fn().mockReturnValue(cachedLoading),
      addMock,
      CHAIN_ID_MOCK,
      phishingControllerMock,
    );
    expect(result).toBe(cachedLoading);
    expect(scanAddressMock).not.toHaveBeenCalled();
    expect(addMock).not.toHaveBeenCalled();
  });

  it('writes a Loading entry keyed by chain ID while the controller scan is pending', async () => {
    const addMock = jest.fn();
    let resolveScan!: (result: {
      // eslint-disable-next-line @typescript-eslint/naming-convention
      result_type: AddressScanResultType;
      label: string;
    }) => void;
    scanAddressMock.mockReturnValue(
      new Promise((resolve) => {
        resolveScan = resolve;
      }),
    );

    const scanPromise = scanAddressAndAddToCache(
      ADDRESS_MOCK,
      jest.fn().mockReturnValue(undefined),
      addMock,
      CHAIN_ID_MOCK,
      phishingControllerMock,
    );

    expect(addMock).toHaveBeenCalledTimes(1);
    expect(addMock).toHaveBeenCalledWith(CACHE_KEY_MOCK, {
      // eslint-disable-next-line @typescript-eslint/naming-convention
      result_type: ResultType.Loading,
      label: '',
    });

    resolveScan({
      // eslint-disable-next-line @typescript-eslint/naming-convention
      result_type: AddressScanResultType.Benign,
      label: '',
    });
    await scanPromise;
  });

  it('caches and returns a successful controller result', async () => {
    const addMock = jest.fn();
    scanAddressMock.mockResolvedValue({
      // eslint-disable-next-line @typescript-eslint/naming-convention
      result_type: AddressScanResultType.Malicious,
      label: 'scam',
    });
    const result = await scanAddressAndAddToCache(
      ADDRESS_MOCK,
      jest.fn().mockReturnValue(undefined),
      addMock,
      CHAIN_ID_MOCK,
      phishingControllerMock,
    );
    expect(scanAddressMock).toHaveBeenCalledWith(CHAIN_ID_MOCK, ADDRESS_MOCK);
    expect(result).toEqual({
      // eslint-disable-next-line @typescript-eslint/naming-convention
      result_type: ResultType.Malicious,
      label: 'scam',
    });
    expect(addMock).toHaveBeenNthCalledWith(2, CACHE_KEY_MOCK, {
      // eslint-disable-next-line @typescript-eslint/naming-convention
      result_type: ResultType.Malicious,
      label: 'scam',
    });
  });

  it('caches ErrorResult and rethrows when the controller call rejects', async () => {
    const addMock = jest.fn();
    scanAddressMock.mockRejectedValue(new Error('network'));
    await expect(
      scanAddressAndAddToCache(
        ADDRESS_MOCK,
        jest.fn().mockReturnValue(undefined),
        addMock,
        CHAIN_ID_MOCK,
        phishingControllerMock,
      ),
    ).rejects.toThrow('network');
    expect(addMock).toHaveBeenNthCalledWith(2, CACHE_KEY_MOCK, {
      // eslint-disable-next-line @typescript-eslint/naming-convention
      result_type: ResultType.ErrorResult,
      label: '',
    });
  });
});
