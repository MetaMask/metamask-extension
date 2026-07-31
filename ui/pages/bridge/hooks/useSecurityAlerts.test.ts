import { renderHook } from '@testing-library/react-hooks';
import * as reactRedux from 'react-redux';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { getTxAlerts } from '../../../ducks/bridge/selectors';
import { BridgeAssetSecurityDataType } from '../utils/tokens';
import type { BridgeToken } from '../../../ducks/bridge/types';
import type { TxAlert } from '../../../../shared/types/security-alerts-api';
import { useSecurityAlerts } from './useSecurityAlerts';

jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useSelector: jest.fn(),
}));

jest.mock('../../../hooks/useI18nContext');

jest.mock('../../../ducks/bridge/selectors', () => ({
  ...jest.requireActual('../../../ducks/bridge/selectors'),
  getTxAlerts: jest.fn(),
}));

const mockT = jest.fn((key: string, args?: string[]) =>
  args ? `${key}:${args.join(',')}` : key,
);

const makeToken = (overrides: Record<string, unknown> = {}): BridgeToken =>
  ({
    assetId: 'eip155:1/erc20:0xabc',
    symbol: 'USDC',
    name: 'USD Coin',
    decimals: 6,
    chainId: 'eip155:1',
    balance: '0',
    ...overrides,
  }) as BridgeToken;

const makeTxAlert = (overrides: Partial<TxAlert> = {}): TxAlert => ({
  titleId: 'bridgeTxAlertTitle',
  description: 'Transaction blocked.',
  descriptionId: 'bridgeTxAlertDescription',
  ...overrides,
});

describe('useSecurityAlerts', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(useI18nContext).mockReturnValue(mockT as never);
    jest.mocked(reactRedux.useSelector).mockImplementation((selector) => {
      if (selector === getTxAlerts) {
        return null;
      }
      return undefined;
    });
  });

  // ─── txAlert ──────────────────────────────────────────────────────────────

  describe('txAlert', () => {
    it('is null when there is no base tx alert', () => {
      const { result } = renderHook(() => useSecurityAlerts(makeToken()));
      expect(result.current.txAlert).toBeNull();
    });

    it('transforms the base tx alert into a MinimalBridgeAlert', () => {
      const baseTxAlert = makeTxAlert();
      jest.mocked(reactRedux.useSelector).mockImplementation((selector) => {
        if (selector === getTxAlerts) {
          return baseTxAlert;
        }
        return undefined;
      });

      const { result } = renderHook(() => useSecurityAlerts(makeToken()));

      expect(result.current.txAlert).toStrictEqual({
        ...baseTxAlert,
        id: 'tx-alert',
        title: 'bridgeTxAlertTitle',
        description: 'Transaction blocked. bridgeTxAlertDescription',
        severity: 'danger',
      });
    });

    it('sets id to "tx-alert"', () => {
      jest.mocked(reactRedux.useSelector).mockImplementation((selector) => {
        if (selector === getTxAlerts) {
          return makeTxAlert();
        }
        return undefined;
      });

      const { result } = renderHook(() => useSecurityAlerts(makeToken()));

      expect(result.current.txAlert?.id).toBe('tx-alert');
    });

    it('sets severity to "danger"', () => {
      jest.mocked(reactRedux.useSelector).mockImplementation((selector) => {
        if (selector === getTxAlerts) {
          return makeTxAlert();
        }
        return undefined;
      });

      const { result } = renderHook(() => useSecurityAlerts(makeToken()));

      expect(result.current.txAlert?.severity).toBe('danger');
    });

    it('translates titleId for the title', () => {
      jest.mocked(reactRedux.useSelector).mockImplementation((selector) => {
        if (selector === getTxAlerts) {
          return makeTxAlert({ titleId: 'someTitle' });
        }
        return undefined;
      });

      const { result } = renderHook(() => useSecurityAlerts(makeToken()));

      expect(result.current.txAlert?.title).toBe('someTitle');
    });

    it('concatenates description and translated descriptionId', () => {
      jest.mocked(reactRedux.useSelector).mockImplementation((selector) => {
        if (selector === getTxAlerts) {
          return makeTxAlert({
            description: 'Raw description.',
            descriptionId: 'learnMoreKey',
          });
        }
        return undefined;
      });

      const { result } = renderHook(() => useSecurityAlerts(makeToken()));

      expect(result.current.txAlert?.description).toBe(
        'Raw description. learnMoreKey',
      );
    });
  });

  // ─── securityWarnings ─────────────────────────────────────────────────────

  describe('securityWarnings', () => {
    it('returns an empty array when there is no security data and no tx alert', () => {
      const { result } = renderHook(() => useSecurityAlerts(makeToken()));
      expect(result.current.securityWarnings).toStrictEqual([]);
    });

    it('returns an empty array when securityData is present but has no metadata', () => {
      const { result } = renderHook(() =>
        useSecurityAlerts(
          makeToken({
            securityData: { type: BridgeAssetSecurityDataType.WARNING },
          }),
        ),
      );
      expect(result.current.securityWarnings).toStrictEqual([]);
    });

    it('returns an empty array when features list is empty', () => {
      const { result } = renderHook(() =>
        useSecurityAlerts(
          makeToken({
            securityData: {
              type: BridgeAssetSecurityDataType.WARNING,
              metadata: { features: [] },
            },
          }),
        ),
      );
      expect(result.current.securityWarnings).toStrictEqual([]);
    });

    it('includes formatted feature warnings from securityData', () => {
      const { result } = renderHook(() =>
        useSecurityAlerts(
          makeToken({
            securityData: {
              type: BridgeAssetSecurityDataType.WARNING,
              metadata: {
                features: [
                  {
                    featureId: 'HONEYPOT',
                    type: BridgeAssetSecurityDataType.WARNING,
                    description: 'This token behaves like a honeypot.',
                  },
                ],
              },
            },
          }),
        ),
      );
      expect(result.current.securityWarnings).toStrictEqual([
        '[HONEYPOT]: This token behaves like a honeypot.',
      ]);
    });

    it('includes one entry per feature', () => {
      const { result } = renderHook(() =>
        useSecurityAlerts(
          makeToken({
            securityData: {
              type: BridgeAssetSecurityDataType.MALICIOUS,
              metadata: {
                features: [
                  {
                    featureId: 'RUGPULL',
                    type: BridgeAssetSecurityDataType.MALICIOUS,
                    description: 'Rug pull detected.',
                  },
                  {
                    featureId: 'HONEYPOT',
                    type: BridgeAssetSecurityDataType.WARNING,
                    description: 'Honeypot pattern.',
                  },
                ],
              },
            },
          }),
        ),
      );
      expect(result.current.securityWarnings).toStrictEqual([
        '[RUGPULL]: Rug pull detected.',
        '[HONEYPOT]: Honeypot pattern.',
      ]);
    });

    it('includes the txAlert description when a tx alert is present', () => {
      jest.mocked(reactRedux.useSelector).mockImplementation((selector) => {
        if (selector === getTxAlerts) {
          return makeTxAlert({
            description: 'Transaction blocked.',
            descriptionId: 'bridgeTxAlertDescription',
          });
        }
        return undefined;
      });

      const { result } = renderHook(() => useSecurityAlerts(makeToken()));

      expect(result.current.securityWarnings).toStrictEqual([
        'Transaction blocked. bridgeTxAlertDescription',
      ]);
    });

    it('includes both feature warnings and the txAlert description', () => {
      jest.mocked(reactRedux.useSelector).mockImplementation((selector) => {
        if (selector === getTxAlerts) {
          return makeTxAlert({
            description: 'Tx blocked.',
            descriptionId: 'learnMore',
          });
        }
        return undefined;
      });

      const { result } = renderHook(() =>
        useSecurityAlerts(
          makeToken({
            securityData: {
              type: BridgeAssetSecurityDataType.WARNING,
              metadata: {
                features: [
                  {
                    featureId: 'HONEYPOT',
                    type: BridgeAssetSecurityDataType.WARNING,
                    description: 'Honeypot.',
                  },
                ],
              },
            },
          }),
        ),
      );

      expect(result.current.securityWarnings).toStrictEqual([
        '[HONEYPOT]: Honeypot.',
        'Tx blocked. learnMore',
      ]);
    });

    it('does not include a txAlert description entry when txAlert is null', () => {
      const { result } = renderHook(() =>
        useSecurityAlerts(
          makeToken({
            securityData: {
              type: BridgeAssetSecurityDataType.WARNING,
              metadata: {
                features: [
                  {
                    featureId: 'HONEYPOT',
                    type: BridgeAssetSecurityDataType.WARNING,
                    description: 'Honeypot.',
                  },
                ],
              },
            },
          }),
        ),
      );

      expect(result.current.securityWarnings).toStrictEqual([
        '[HONEYPOT]: Honeypot.',
      ]);
    });
  });

  // ─── memoization ──────────────────────────────────────────────────────────

  describe('memoization', () => {
    it('returns a stable txAlert reference when inputs do not change', () => {
      const baseTxAlert = makeTxAlert();
      jest.mocked(reactRedux.useSelector).mockImplementation((selector) => {
        if (selector === getTxAlerts) {
          return baseTxAlert;
        }
        return undefined;
      });

      const token = makeToken();
      const { result, rerender } = renderHook(() => useSecurityAlerts(token));

      const firstTxAlert = result.current.txAlert;
      rerender();

      expect(result.current.txAlert).toBe(firstTxAlert);
    });

    it('returns a stable securityWarnings reference when inputs do not change', () => {
      const token = makeToken({
        securityData: {
          type: BridgeAssetSecurityDataType.WARNING,
          metadata: {
            features: [
              {
                featureId: 'HONEYPOT',
                type: BridgeAssetSecurityDataType.WARNING,
                description: 'Honeypot.',
              },
            ],
          },
        },
      });

      const { result, rerender } = renderHook(() => useSecurityAlerts(token));

      const firstWarnings = result.current.securityWarnings;
      rerender();

      expect(result.current.securityWarnings).toBe(firstWarnings);
    });
  });
});
