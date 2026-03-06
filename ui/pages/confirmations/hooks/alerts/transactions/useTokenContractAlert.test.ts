import { ApprovalType } from '@metamask/controller-utils';
import {
  TransactionMeta,
  TransactionType,
} from '@metamask/transaction-controller';
import { Hex } from '@metamask/utils';
import { genUnapprovedContractInteractionConfirmation } from '../../../../../../test/data/confirmations/contract-interaction';
import { getMockConfirmState } from '../../../../../../test/data/confirmations/helper';
import { renderHookWithConfirmContextProvider } from '../../../../../../test/lib/confirmations/render-helpers';
import { RowAlertKey } from '../../../../../components/app/confirm/info/row/constants';
import { Severity } from '../../../../../helpers/constants/design-system';
import {
  getTokenStandardAndDetailsByChain,
  TokenStandAndDetails,
} from '../../../../../store/actions';
import { useTokenContractAlert } from './useTokenContractAlert';

jest.mock('../../../../../hooks/useI18nContext', () => ({
  useI18nContext: jest.fn(),
}));

jest.mock('../../../../../store/actions', () => ({
  ...jest.requireActual('../../../../../store/actions'),
  getTokenStandardAndDetailsByChain: jest.fn(),
}));

const { useI18nContext } = jest.requireMock(
  '../../../../../hooks/useI18nContext',
);

const mockGetTokenStandardAndDetailsByChain = jest.mocked(
  getTokenStandardAndDetailsByChain,
);

const ACCOUNT_ADDRESS = '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc' as Hex;
const TOKEN_CONTRACT_ADDRESS =
  '0x1234567890123456789012345678901234567890' as Hex;

const mockT = (key: string) => key;

function runHook({
  currentConfirmation,
}: {
  currentConfirmation?: Partial<TransactionMeta>;
} = {}) {
  const confirmation = currentConfirmation
    ? {
        ...genUnapprovedContractInteractionConfirmation({ chainId: '0x5' }),
        ...currentConfirmation,
      }
    : undefined;

  let pendingApprovals = {};
  if (confirmation) {
    pendingApprovals = {
      [confirmation.id as string]: {
        id: confirmation.id,
        type: ApprovalType.Transaction,
      },
    };
  }

  const state = getMockConfirmState({
    metamask: {
      pendingApprovals,
      transactions: confirmation ? [confirmation] : [],
    },
  });

  useI18nContext.mockReturnValue(mockT);

  return renderHookWithConfirmContextProvider(useTokenContractAlert, state);
}

describe('useTokenContractAlert', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    mockGetTokenStandardAndDetailsByChain.mockResolvedValue(
      {} as TokenStandAndDetails,
    );
  });

  describe('when no confirmation exists', () => {
    it('returns no alerts', () => {
      const { result } = runHook();
      expect(result.current).toEqual([]);
    });
  });

  describe('when recipient is not a token contract', () => {
    it('returns no alerts', async () => {
      mockGetTokenStandardAndDetailsByChain.mockResolvedValue(
        {} as TokenStandAndDetails,
      );

      const { result } = runHook({
        currentConfirmation: {
          txParams: {
            from: ACCOUNT_ADDRESS,
            to: TOKEN_CONTRACT_ADDRESS,
          },
          type: TransactionType.simpleSend,
        },
      });

      // Wait for async resolution
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(result.current).toEqual([]);
    });
  });

  describe('when recipient is a token contract', () => {
    it('returns a danger alert for ERC20 token', async () => {
      mockGetTokenStandardAndDetailsByChain.mockResolvedValue({
        standard: 'ERC20',
      } as TokenStandAndDetails);

      const { result } = runHook({
        currentConfirmation: {
          txParams: {
            from: ACCOUNT_ADDRESS,
            to: TOKEN_CONTRACT_ADDRESS,
          },
          type: TransactionType.simpleSend,
        },
      });

      // Wait for async resolution
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(result.current).toHaveLength(1);
      expect(result.current[0]).toEqual(
        expect.objectContaining({
          key: 'tokenContractAddress',
          field: RowAlertKey.InteractingWith,
          reason: 'tokenContractError',
          severity: Severity.Danger,
        }),
      );
    });

    it('returns a danger alert for ERC721 token', async () => {
      mockGetTokenStandardAndDetailsByChain.mockResolvedValue({
        standard: 'ERC721',
      } as TokenStandAndDetails);

      const { result } = runHook({
        currentConfirmation: {
          txParams: {
            from: ACCOUNT_ADDRESS,
            to: TOKEN_CONTRACT_ADDRESS,
          },
          type: TransactionType.simpleSend,
        },
      });

      // Wait for async resolution
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(result.current).toHaveLength(1);
      expect(result.current[0]).toEqual(
        expect.objectContaining({
          key: 'tokenContractAddress',
          severity: Severity.Danger,
        }),
      );
    });

    it('includes content in the alert', async () => {
      mockGetTokenStandardAndDetailsByChain.mockResolvedValue({
        standard: 'ERC20',
      } as TokenStandAndDetails);

      const { result } = runHook({
        currentConfirmation: {
          txParams: {
            from: ACCOUNT_ADDRESS,
            to: TOKEN_CONTRACT_ADDRESS,
          },
          type: TransactionType.simpleSend,
        },
      });

      // Wait for async resolution
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(result.current[0].content).toBeDefined();
    });

    it('calls getTokenStandardAndDetailsByChain with correct params', async () => {
      mockGetTokenStandardAndDetailsByChain.mockResolvedValue({
        standard: 'ERC20',
      } as TokenStandAndDetails);

      runHook({
        currentConfirmation: {
          txParams: {
            from: ACCOUNT_ADDRESS,
            to: TOKEN_CONTRACT_ADDRESS,
          },
          type: TransactionType.simpleSend,
          chainId: '0x5',
        },
      });

      // Wait for async resolution
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(mockGetTokenStandardAndDetailsByChain).toHaveBeenCalledWith(
        TOKEN_CONTRACT_ADDRESS,
        undefined,
        undefined,
        '0x5',
      );
    });
  });
});
