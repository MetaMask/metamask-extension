import { Env, parseSignatureRequestMethod } from '@metamask/shield-controller';
import { SignTypedDataVersion } from '@metamask/keyring-controller';
import type { SignatureRequest } from '@metamask/signature-controller';
import { loadShieldConfig } from '../../../../shared/lib/shield';
import { captureException } from '../../../../shared/lib/sentry';
import { normalizeSignatureRequest as normalizePpomSignatureRequest } from '../../lib/ppom/ppom-util';
import {
  getShieldApiServiceInstanceOptions,
  getShieldControllerInstanceOptions,
} from './shield-controller';

jest.mock('../../../../shared/lib/shield');
jest.mock('../../lib/ppom/ppom-util');
jest.mock('@metamask/shield-controller', () => ({
  ...jest.requireActual('@metamask/shield-controller'),
  parseSignatureRequestMethod: jest.fn(),
}));

function buildSignatureRequest(
  overrides: Partial<SignatureRequest> = {},
): SignatureRequest {
  return {
    id: 'signature-request-id',
    version: SignTypedDataVersion.V4,
    messageParams: {
      from: '0xFromAddress',
      data: 'original-data',
    },
    ...overrides,
  } as SignatureRequest;
}

describe('getShieldControllerInstanceOptions', () => {
  const parseSignatureRequestMethodMock = jest.mocked(
    parseSignatureRequestMethod,
  );
  const normalizePpomSignatureRequestMock = jest.mocked(
    normalizePpomSignatureRequest,
  );

  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('returns the signature request normalizer', () => {
    expect(getShieldControllerInstanceOptions()).toStrictEqual({
      normalizeSignatureRequest: expect.any(Function),
    });
  });

  describe('normalizeSignatureRequest', () => {
    it('updates typed data message params when PPOM normalizes V4 requests', () => {
      const request = buildSignatureRequest();
      parseSignatureRequestMethodMock.mockReturnValue('eth_signTypedData_v4');
      normalizePpomSignatureRequestMock.mockReturnValue({
        id: request.id,
        jsonrpc: '2.0',
        method: 'eth_signTypedData_v4',
        params: ['0xFromAddress', 'normalized-data'],
      });

      const { normalizeSignatureRequest } =
        getShieldControllerInstanceOptions();
      if (!normalizeSignatureRequest) {
        throw new Error('normalizeSignatureRequest is not defined');
      }
      const result = normalizeSignatureRequest(request);

      expect(parseSignatureRequestMethodMock).toHaveBeenCalledWith(request);
      expect(normalizePpomSignatureRequestMock).toHaveBeenCalledWith({
        id: request.id,
        jsonrpc: '2.0',
        method: 'eth_signTypedData_v4',
        params: ['0xFromAddress', 'original-data'],
      });
      expect(result.messageParams.data).toBe('normalized-data');
      expect(result).toBe(request);
    });

    it('updates typed data message params when PPOM normalizes V3 requests', () => {
      const request = buildSignatureRequest({
        version: SignTypedDataVersion.V3,
      });
      parseSignatureRequestMethodMock.mockReturnValue('eth_signTypedData_v3');
      normalizePpomSignatureRequestMock.mockReturnValue({
        id: request.id,
        jsonrpc: '2.0',
        method: 'eth_signTypedData_v3',
        params: ['0xFromAddress', 'normalized-v3-data'],
      });

      const { normalizeSignatureRequest } =
        getShieldControllerInstanceOptions();
      if (!normalizeSignatureRequest) {
        throw new Error('normalizeSignatureRequest is not defined');
      }
      normalizeSignatureRequest(request);

      expect(normalizePpomSignatureRequestMock).toHaveBeenCalledWith({
        id: request.id,
        jsonrpc: '2.0',
        method: 'eth_signTypedData_v3',
        params: ['0xFromAddress', 'original-data'],
      });
      expect(request.messageParams.data).toBe('normalized-v3-data');
    });

    it('uses data-first param order for non typed-data requests', () => {
      const request = buildSignatureRequest({
        version: SignTypedDataVersion.V1,
      });
      parseSignatureRequestMethodMock.mockReturnValue('personal_sign');
      normalizePpomSignatureRequestMock.mockReturnValue({
        id: request.id,
        jsonrpc: '2.0',
        method: 'personal_sign',
        params: ['original-data', '0xFromAddress'],
      });

      const { normalizeSignatureRequest } =
        getShieldControllerInstanceOptions();
      if (!normalizeSignatureRequest) {
        throw new Error('normalizeSignatureRequest is not defined');
      }
      normalizeSignatureRequest(request);

      expect(normalizePpomSignatureRequestMock).toHaveBeenCalledWith({
        id: request.id,
        jsonrpc: '2.0',
        method: 'personal_sign',
        params: ['original-data', '0xFromAddress'],
      });
      expect(request.messageParams.data).toBe('original-data');
    });
  });
});

describe('getShieldApiServiceInstanceOptions', () => {
  const loadShieldConfigMock = jest.mocked(loadShieldConfig);

  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('returns the configured environment and service dependencies', () => {
    loadShieldConfigMock.mockReturnValue({
      shieldEnv: Env.UAT,
    } as ReturnType<typeof loadShieldConfig>);

    expect(getShieldApiServiceInstanceOptions()).toStrictEqual({
      env: Env.UAT,
      captureException: expect.any(Function),
    });
  });

  it('reads the shield environment from loadShieldConfig', () => {
    loadShieldConfigMock.mockReturnValue({
      shieldEnv: Env.PRD,
    } as ReturnType<typeof loadShieldConfig>);

    expect(getShieldApiServiceInstanceOptions().env).toBe(Env.PRD);
    expect(loadShieldConfigMock).toHaveBeenCalledTimes(1);
  });

  it('uses the shared sentry captureException helper', () => {
    loadShieldConfigMock.mockReturnValue({
      shieldEnv: Env.UAT,
    } as ReturnType<typeof loadShieldConfig>);

    expect(getShieldApiServiceInstanceOptions().captureException).toBe(
      captureException,
    );
  });
});
