import {
  TransactionStatus,
  TransactionType,
} from '@metamask/transaction-controller';

// Mocha type definitions are conflicting with Jest
import { it as jestIt } from '@jest/globals';
import {
  getMockConfirmStateForTransaction,
  getMockPersonalSignConfirmStateForRequest,
} from '../../../../../test/data/confirmations/helper';
import {
  BlockaidResultType,
  SecurityProvider,
} from '../../../../../shared/constants/security-provider';
import { renderHookWithConfirmContextProvider } from '../../../../../test/lib/confirmations/render-helpers';
import { Severity } from '../../../../helpers/constants/design-system';
import mockState from '../../../../../test/data/mock-state.json';
import { SecurityAlertResponse } from '../../types/confirm';
import useBlockaidAlert, {
  MAX_REPORT_URL_LENGTH,
  REPORT_FIELD_TRUNCATION_MARKER,
} from './useBlockaidAlerts';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const zlib = require('zlib');

const mockSecurityAlertResponse: SecurityAlertResponse = {
  securityAlertId: 'test-id-mock',
  reason: 'test-reason',
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  result_type: BlockaidResultType.Malicious,
  features: ['Feature 1', 'Feature 2'],
};

const currentConfirmationMock = {
  id: '1',
  status: 'unapproved',
  time: new Date().getTime(),
  type: TransactionType.personalSign,
  securityAlertResponse: mockSecurityAlertResponse,
};

const EXPECTED_ALERT = {
  key: mockSecurityAlertResponse.securityAlertId,
  severity: Severity.Danger,
  message: 'If you approve this request, you might lose your assets.',
  alertDetails: mockSecurityAlertResponse.features,
  provider: SecurityProvider.Blockaid,
  reason: 'This is a deceptive request',
};

const IGNORED_TYPES = [
  BlockaidResultType.Benign,
  BlockaidResultType.Loading,
  BlockaidResultType.NotApplicable,
  'NewUnexpectedTypeFromAPI',
];

/**
 * Generates a deterministic, poorly-compressible hex string so that gzip
 * cannot shrink the payload below the URL length limit.
 *
 * @param length - The length of the generated string.
 * @returns A pseudo-random hex string of the given length.
 */
function generateIncompressibleHexData(length: number): string {
  let seed = 42;
  let result = '';
  while (result.length < length) {
    // Linear congruential generator for deterministic pseudo-random output.
    seed = (seed * 1103515245 + 12345) % 2147483648;
    result += seed.toString(16);
  }
  return `0x${result.slice(0, length)}`;
}

function decodeReportUrlData(reportUrl: string): Record<string, string> {
  const encodedData = new URL(reportUrl).searchParams.get('data') as string;
  return JSON.parse(
    zlib.gunzipSync(Buffer.from(encodedData, 'base64')).toString(),
  );
}

describe('useBlockaidAlerts', () => {
  it('returns an empty array when there is no confirmation', () => {
    const { result } = renderHookWithConfirmContextProvider(
      () => useBlockaidAlert(),
      mockState,
    );
    expect(result.current).toEqual([]);
  });

  it('returns alerts when there is a valid PersonalSign confirmation with a security alert response', () => {
    const mockCurrentState = getMockPersonalSignConfirmStateForRequest(
      currentConfirmationMock,
      {
        metamask: {
          signatureSecurityAlertResponses: {
            'test-id-mock': mockSecurityAlertResponse,
          },
        },
      },
    );
    const { result } = renderHookWithConfirmContextProvider(
      () => useBlockaidAlert(),
      mockCurrentState,
    );

    expect(result.current).toHaveLength(1);
    expect(result.current[0].reportUrl).toBeDefined();
    delete result.current[0].reportUrl;
    expect(result.current[0]).toStrictEqual(EXPECTED_ALERT);
  });

  it('returns alerts if confirmation is contract interaction with security alert response', () => {
    const mockCurrentState = getMockConfirmStateForTransaction({
      id: '1',
      type: TransactionType.contractInteraction,
      chainId: '0x5',
      securityAlertResponse: mockSecurityAlertResponse,
      status: TransactionStatus.unapproved,
    });

    const { result } = renderHookWithConfirmContextProvider(
      () => useBlockaidAlert(),
      mockCurrentState,
    );

    expect(result.current).toHaveLength(1);
    expect(result.current[0].reportUrl).toBeDefined();
    delete result.current[0].reportUrl;
    expect(result.current[0]).toStrictEqual(EXPECTED_ALERT);
  });

  it('includes the full request params in the report URL for normal payloads', () => {
    const msgParams = {
      from: '0x8eeee1781fd885ff5ddef7789486676961873d12',
      data: '0x48656c6c6f',
      origin: 'https://metamask.github.io',
    };
    const mockCurrentState = getMockPersonalSignConfirmStateForRequest(
      { ...currentConfirmationMock, msgParams },
      {
        metamask: {
          signatureSecurityAlertResponses: {
            'test-id-mock': mockSecurityAlertResponse,
          },
        },
      },
    );

    const { result } = renderHookWithConfirmContextProvider(
      () => useBlockaidAlert(),
      mockCurrentState,
    );

    const reportUrl = result.current[0].reportUrl as string;
    expect(reportUrl.length).toBeLessThanOrEqual(MAX_REPORT_URL_LENGTH);

    const reportData = decodeReportUrlData(reportUrl);
    expect(reportData.jsonRpcParams).toStrictEqual(JSON.stringify(msgParams));
    expect(reportData.jsonRpcParams).not.toContain(
      REPORT_FIELD_TRUNCATION_MARKER,
    );
  });

  it('bounds the report URL length for oversized payloads while keeping key fields', () => {
    const msgParams = {
      from: '0x8eeee1781fd885ff5ddef7789486676961873d12',
      data: generateIncompressibleHexData(200000),
      origin: 'https://metamask.github.io',
    };
    const mockCurrentState = getMockPersonalSignConfirmStateForRequest(
      { ...currentConfirmationMock, msgParams },
      {
        metamask: {
          signatureSecurityAlertResponses: {
            'test-id-mock': mockSecurityAlertResponse,
          },
        },
      },
    );

    const { result } = renderHookWithConfirmContextProvider(
      () => useBlockaidAlert(),
      mockCurrentState,
    );

    expect(result.current).toHaveLength(1);

    const reportUrl = result.current[0].reportUrl as string;
    expect(reportUrl.length).toBeLessThanOrEqual(MAX_REPORT_URL_LENGTH);

    const reportData = decodeReportUrlData(reportUrl);
    expect(reportData.blockaidVersion).toBeDefined();
    expect(reportData.classification).toStrictEqual('test-reason');
    expect(reportData.domain).toStrictEqual('https://metamask.github.io');
    expect(reportData.jsonRpcMethod).toStrictEqual(
      TransactionType.personalSign,
    );
    expect(reportData.resultType).toStrictEqual(BlockaidResultType.Malicious);
    expect(reportData.jsonRpcParams).toContain(REPORT_FIELD_TRUNCATION_MARKER);
  });

  jestIt.each(IGNORED_TYPES)(
    'does NOT show alert for ignored result type: %s',
    (ignoredType: string) => {
      const mockCurrentState = getMockConfirmStateForTransaction({
        id: '1',
        type: TransactionType.contractInteraction,
        chainId: '0x5',
        status: TransactionStatus.unapproved,
        securityAlertResponse: {
          ...mockSecurityAlertResponse,
          // eslint-disable-next-line @typescript-eslint/naming-convention
          result_type: ignoredType,
        },
      });

      const { result } = renderHookWithConfirmContextProvider(
        () => useBlockaidAlert(),
        mockCurrentState,
      );

      expect(result.current).toHaveLength(0);
    },
  );
});
