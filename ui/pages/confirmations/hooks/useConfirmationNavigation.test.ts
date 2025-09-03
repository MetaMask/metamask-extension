import { useHistory } from 'react-router-dom';
import { ApprovalType } from '@metamask/controller-utils';
import { Json } from '@metamask/utils';
import { ApprovalFlowState } from '@metamask/approval-controller';
import { useSearchParams } from 'react-router-dom-v5-compat';

import { renderHookWithProvider } from '../../../../test/lib/render-helpers';
import mockState from '../../../../test/data/mock-state.json';
import {
  CONFIRM_ADD_SUGGESTED_NFT_ROUTE,
  CONFIRM_ADD_SUGGESTED_TOKEN_ROUTE,
  CONFIRM_TRANSACTION_ROUTE,
  CONFIRMATION_V_NEXT_ROUTE,
  CONNECT_ROUTE,
  DECRYPT_MESSAGE_REQUEST_PATH,
  ENCRYPTION_PUBLIC_KEY_REQUEST_PATH,
} from '../../../helpers/constants/routes';
import { useConfirmationNavigation } from './useConfirmationNavigation';

function mockSearchParams(obj = {}) {
  return {
    get: (key: string) => (obj as Record<string, string>)[key] ?? null,
    // eslint-disable-next-line object-shorthand
    entries: function* () {
      for (const key of Object.keys(obj)) {
        yield [key, (obj as Record<string, string>)[key]];
      }
    },
    [Symbol.iterator]() {
      return this.entries();
    },
  };
}

jest.mock('react-router-dom-v5-compat', () => ({
  ...jest.requireActual('react-router-dom-v5-compat'),
  useLocation: () => ({ pathname: '/send/asset' }),
  useSearchParams: jest.fn().mockReturnValue([{ get: () => null }]),
}));

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useHistory: jest.fn(),
}));

jest.mock('../confirmation/templates', () => ({
  TEMPLATED_CONFIRMATION_APPROVAL_TYPES: ['wallet_addEthereumChain'],
}));

const APPROVAL_ID_MOCK = '123-456';
const APPROVAL_ID_2_MOCK = '456-789';

function renderHookWithState(state: Record<string, unknown>) {
  const { result } = renderHookWithProvider(() => useConfirmationNavigation(), {
    ...mockState,
    metamask: {
      ...mockState.metamask,
      ...state,
    },
  });

  return result.current;
}

function renderHook(
  approvalType: ApprovalType,
  requestData?: Json,
  approvalFlows?: ApprovalFlowState[],
) {
  return renderHookWithState({
    pendingApprovals: {
      [APPROVAL_ID_MOCK]: {
        id: APPROVAL_ID_MOCK,
        type: approvalType,
        requestData,
      },
      [APPROVAL_ID_2_MOCK]: {
        id: APPROVAL_ID_2_MOCK,
        type: approvalType,
        requestData,
      },
    },
    approvalFlows,
  });
}

describe('useConfirmationNavigation', () => {
  const useHistoryMock = jest.mocked(useHistory);
  const history = { replace: jest.fn() };
  const mockUseSearchParams = jest.mocked(useSearchParams);

  beforeEach(() => {
    jest.resetAllMocks();
    useHistoryMock.mockReturnValue(history);
    mockUseSearchParams.mockReturnValue([
      mockSearchParams({}),
    ] as unknown as ReturnType<typeof useSearchParams>);
  });

  describe('navigateToId', () => {
    it('navigates to transaction route', () => {
      const result = renderHook(ApprovalType.Transaction);

      result.navigateToId(APPROVAL_ID_MOCK);

      expect(history.replace).toHaveBeenCalledTimes(1);
      expect(history.replace).toHaveBeenCalledWith(
        `${CONFIRM_TRANSACTION_ROUTE}/${APPROVAL_ID_MOCK}`,
      );
    });

    it('navigates to template route', () => {
      const result = renderHook(ApprovalType.AddEthereumChain);

      result.navigateToId(APPROVAL_ID_MOCK);

      expect(history.replace).toHaveBeenCalledTimes(1);
      expect(history.replace).toHaveBeenCalledWith(
        `${CONFIRMATION_V_NEXT_ROUTE}/${APPROVAL_ID_MOCK}`,
      );
    });

    it('navigates to template route if approval flow', () => {
      const result = renderHook(undefined as never, undefined, [{} as never]);

      result.navigateToId(undefined);

      expect(history.replace).toHaveBeenCalledTimes(1);
      expect(history.replace).toHaveBeenCalledWith(
        `${CONFIRMATION_V_NEXT_ROUTE}`,
      );
    });

    it('does not navigate to template route if approval flow and pending approval', () => {
      const result = renderHook(ApprovalType.Transaction, undefined, [
        {} as never,
      ]);

      result.navigateToId(APPROVAL_ID_MOCK);

      expect(history.replace).toHaveBeenCalledTimes(1);
      expect(history.replace).toHaveBeenCalledWith(
        `${CONFIRM_TRANSACTION_ROUTE}/${APPROVAL_ID_MOCK}`,
      );
    });

    it('navigates to connect route', () => {
      const result = renderHook(ApprovalType.WalletRequestPermissions);

      result.navigateToId(APPROVAL_ID_MOCK);

      expect(history.replace).toHaveBeenCalledTimes(1);
      expect(history.replace).toHaveBeenCalledWith(
        `${CONNECT_ROUTE}/${APPROVAL_ID_MOCK}`,
      );
    });

    it('navigates to add token route if no token ID', () => {
      const result = renderHook(ApprovalType.WatchAsset);

      result.navigateToId(APPROVAL_ID_MOCK);

      expect(history.replace).toHaveBeenCalledTimes(1);
      expect(history.replace).toHaveBeenCalledWith(
        `${CONFIRM_ADD_SUGGESTED_TOKEN_ROUTE}`,
      );
    });

    it('navigates to add NFT route if token ID', () => {
      const result = renderHook(ApprovalType.WatchAsset, {
        asset: { tokenId: '123' },
      });

      result.navigateToId(APPROVAL_ID_MOCK);

      expect(history.replace).toHaveBeenCalledTimes(1);
      expect(history.replace).toHaveBeenCalledWith(
        `${CONFIRM_ADD_SUGGESTED_NFT_ROUTE}`,
      );
    });

    it('navigates to encrypt route', () => {
      const result = renderHook(ApprovalType.EthGetEncryptionPublicKey);

      result.navigateToId(APPROVAL_ID_MOCK);

      expect(history.replace).toHaveBeenCalledTimes(1);
      expect(history.replace).toHaveBeenCalledWith(
        `${CONFIRM_TRANSACTION_ROUTE}/${APPROVAL_ID_MOCK}${ENCRYPTION_PUBLIC_KEY_REQUEST_PATH}`,
      );
    });

    it('navigates to decrypt route', () => {
      const result = renderHook(ApprovalType.EthDecrypt);

      result.navigateToId(APPROVAL_ID_MOCK);

      expect(history.replace).toHaveBeenCalledTimes(1);
      expect(history.replace).toHaveBeenCalledWith(
        `${CONFIRM_TRANSACTION_ROUTE}/${APPROVAL_ID_MOCK}${DECRYPT_MESSAGE_REQUEST_PATH}`,
      );
    });

    it('does not navigate if no matching confirmation found', () => {
      const result = renderHook(ApprovalType.AddEthereumChain);

      result.navigateToId('invalidId');

      expect(history.replace).toHaveBeenCalledTimes(0);
    });

    it('does not navigate if no confirmation ID provided', () => {
      const result = renderHook(ApprovalType.AddEthereumChain);

      result.navigateToId();

      expect(history.replace).toHaveBeenCalledTimes(0);
    });
  });

  describe('navigateToIndex', () => {
    it('navigates to the confirmation at the given index', () => {
      const result = renderHook(ApprovalType.Transaction);

      result.navigateToIndex(1);

      expect(history.replace).toHaveBeenCalledTimes(1);
      expect(history.replace).toHaveBeenCalledWith(
        `${CONFIRM_TRANSACTION_ROUTE}/${APPROVAL_ID_2_MOCK}`,
      );
    });
  });

  describe('queryParams', () => {
    it('retain any queryParams present', () => {
      mockUseSearchParams.mockReturnValue([
        mockSearchParams({ test: 'dummy' }),
      ] as unknown as ReturnType<typeof useSearchParams>);
      const result = renderHook(ApprovalType.Transaction);

      result.navigateToIndex(1);

      expect(history.replace).toHaveBeenCalledTimes(1);
      expect(history.replace).toHaveBeenCalledWith(
        `${CONFIRM_TRANSACTION_ROUTE}/${APPROVAL_ID_2_MOCK}?test=dummy`,
      );
    });
  });

  describe('count', () => {
    it('returns the number of confirmations', () => {
      const result = renderHook(ApprovalType.Transaction);
      expect(result.count).toBe(2);
    });

    // @ts-expect-error This function is missing from the Mocha type definitions
    it.each([
      ['token', undefined],
      ['NFT', '123'],
    ])(
      'ignores additional watch %s approvals',
      (_title: string, tokenId?: string) => {
        const result = renderHookWithState({
          pendingApprovals: {
            [APPROVAL_ID_MOCK]: {
              id: APPROVAL_ID_MOCK,
              type: ApprovalType.WatchAsset,
              requestData: { asset: { tokenId } },
            },
            [APPROVAL_ID_2_MOCK]: {
              id: APPROVAL_ID_2_MOCK,
              type: ApprovalType.Transaction,
            },
            duplicate: {
              id: 'duplicate',
              type: ApprovalType.WatchAsset,
              requestData: { asset: { tokenId } },
            },
          },
        });

        expect(result.count).toBe(2);
      },
    );
  });

  describe('getIndex', () => {
    it('returns the index of the given confirmation', () => {
      const result = renderHook(ApprovalType.Transaction);
      expect(result.getIndex(APPROVAL_ID_2_MOCK)).toBe(1);
    });

    it('returns 0 if no confirmation ID is provided', () => {
      const result = renderHook(ApprovalType.Transaction);
      expect(result.getIndex()).toBe(0);
    });
  });

  describe('confirmations', () => {
    it('returns the list of confirmations', () => {
      const result = renderHook(ApprovalType.Transaction);
      expect(result.confirmations.map(({ id }: { id: string }) => id)).toEqual([
        APPROVAL_ID_MOCK,
        APPROVAL_ID_2_MOCK,
      ]);
    });

    // @ts-expect-error This function is missing from the Mocha type definitions
    it.each([
      ['token', undefined],
      ['NFT', '123'],
    ])(
      'ignores additional watch %s approvals',
      (_title: string, tokenId?: string) => {
        const result = renderHookWithState({
          pendingApprovals: {
            [APPROVAL_ID_MOCK]: {
              id: APPROVAL_ID_MOCK,
              type: ApprovalType.WatchAsset,
              requestData: { asset: { tokenId } },
            },
            [APPROVAL_ID_2_MOCK]: {
              id: APPROVAL_ID_2_MOCK,
              type: ApprovalType.Transaction,
            },
            duplicate: {
              id: 'duplicate',
              type: ApprovalType.WatchAsset,
              requestData: { asset: { tokenId } },
            },
          },
        });

        expect(
          result.confirmations.map(({ id }: { id: string }) => id),
        ).toEqual([APPROVAL_ID_MOCK, APPROVAL_ID_2_MOCK]);
      },
    );
  });
});
