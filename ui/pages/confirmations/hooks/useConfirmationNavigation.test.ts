import { useNavigate, useLocation } from 'react-router-dom-v5-compat';
import { ApprovalType } from '@metamask/controller-utils';
import { Json } from '@metamask/utils';
import { ApprovalFlowState } from '@metamask/approval-controller';

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

jest.mock('react-router-dom-v5-compat', () => ({
  ...jest.requireActual('react-router-dom-v5-compat'),
  useNavigate: jest.fn(),
  useLocation: jest.fn(),
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
  const useNavigateMock = jest.mocked(useNavigate);
  const navigate = jest.fn();
  const useLocationMock = jest.mocked(useLocation);

  beforeEach(() => {
    jest.resetAllMocks();
    useNavigateMock.mockReturnValue(navigate);
    useLocationMock.mockReturnValue({
      search: '',
    } as unknown as ReturnType<typeof useLocationMock>);
  });

  describe('navigateToId', () => {
    it('navigates to transaction route', () => {
      const result = renderHook(ApprovalType.Transaction);

      result.navigateToId(APPROVAL_ID_MOCK);

      expect(navigate).toHaveBeenCalledTimes(1);
      expect(navigate).toHaveBeenCalledWith(
        `${CONFIRM_TRANSACTION_ROUTE}/${APPROVAL_ID_MOCK}`,
        { replace: true }
        { replace: true }
      );
    });

    it('navigates to template route', () => {
      const result = renderHook(ApprovalType.AddEthereumChain);

      result.navigateToId(APPROVAL_ID_MOCK);

      expect(navigate).toHaveBeenCalledTimes(1);
      expect(navigate).toHaveBeenCalledWith(
        `${CONFIRMATION_V_NEXT_ROUTE}/${APPROVAL_ID_MOCK}`,
        { replace: true }
      );
    });

    it('navigates to template route if approval flow', () => {
      const result = renderHook(undefined as never, undefined, [{} as never]);

      result.navigateToId(undefined);

      expect(navigate).toHaveBeenCalledTimes(1);
      expect(navigate).toHaveBeenCalledWith(
        `${CONFIRMATION_V_NEXT_ROUTE}`,
        { replace: true }
      );
    });

    it('does not navigate to template route if approval flow and pending approval', () => {
      const result = renderHook(ApprovalType.Transaction, undefined, [
        {} as never,
      ]);

      result.navigateToId(APPROVAL_ID_MOCK);

      expect(navigate).toHaveBeenCalledTimes(1);
      expect(navigate).toHaveBeenCalledWith(
        `${CONFIRM_TRANSACTION_ROUTE}/${APPROVAL_ID_MOCK}`,
        { replace: true }
      );
    });

    it('navigates to connect route', () => {
      const result = renderHook(ApprovalType.WalletRequestPermissions);

      result.navigateToId(APPROVAL_ID_MOCK);

      expect(navigate).toHaveBeenCalledTimes(1);
      expect(navigate).toHaveBeenCalledWith(
        `${CONNECT_ROUTE}/${APPROVAL_ID_MOCK}`,
        { replace: true }
      );
    });

    it('navigates to add token route if no token ID', () => {
      const result = renderHook(ApprovalType.WatchAsset);

      result.navigateToId(APPROVAL_ID_MOCK);

      expect(navigate).toHaveBeenCalledTimes(1);
      expect(navigate).toHaveBeenCalledWith(
        `${CONFIRM_ADD_SUGGESTED_TOKEN_ROUTE}`,
        { replace: true }
      );
    });

    it('navigates to add NFT route if token ID', () => {
      const result = renderHook(ApprovalType.WatchAsset, {
        asset: { tokenId: '123' },
      });

      result.navigateToId(APPROVAL_ID_MOCK);

      expect(navigate).toHaveBeenCalledTimes(1);
      expect(navigate).toHaveBeenCalledWith(
        `${CONFIRM_ADD_SUGGESTED_NFT_ROUTE}`,
        { replace: true }
      );
    });

    it('navigates to encrypt route', () => {
      const result = renderHook(ApprovalType.EthGetEncryptionPublicKey);

      result.navigateToId(APPROVAL_ID_MOCK);

      expect(navigate).toHaveBeenCalledTimes(1);
      expect(navigate).toHaveBeenCalledWith(
        `${CONFIRM_TRANSACTION_ROUTE}/${APPROVAL_ID_MOCK}${ENCRYPTION_PUBLIC_KEY_REQUEST_PATH}`,
        { replace: true }
      );
    });

    it('navigates to decrypt route', () => {
      const result = renderHook(ApprovalType.EthDecrypt);

      result.navigateToId(APPROVAL_ID_MOCK);

      expect(navigate).toHaveBeenCalledTimes(1);
      expect(navigate).toHaveBeenCalledWith(
        `${CONFIRM_TRANSACTION_ROUTE}/${APPROVAL_ID_MOCK}${DECRYPT_MESSAGE_REQUEST_PATH}`,
        { replace: true }
      );
    });

    it('does not navigate if no matching confirmation found', () => {
      const result = renderHook(ApprovalType.AddEthereumChain);

      result.navigateToId('invalidId');

      expect(navigate).toHaveBeenCalledTimes(0);
    });

    it('does not navigate if no confirmation ID provided', () => {
      const result = renderHook(ApprovalType.AddEthereumChain);

      result.navigateToId();

      expect(navigate).toHaveBeenCalledTimes(0);
    });
  });

  describe('navigateToIndex', () => {
    it('navigates to the confirmation at the given index', () => {
      const result = renderHook(ApprovalType.Transaction);

      result.navigateToIndex(1);

      expect(navigate).toHaveBeenCalledTimes(1);
      expect(navigate).toHaveBeenCalledWith(
        `${CONFIRM_TRANSACTION_ROUTE}/${APPROVAL_ID_2_MOCK}`,
        { replace: true }
      );
    });
  });

  describe('queryParams', () => {
    it('retain any queryParams present', () => {
      useLocationMock.mockReturnValue({
        search: '?test=dummy',
      } as unknown as ReturnType<typeof useLocationMock>);
      const result = renderHook(ApprovalType.Transaction);

      result.navigateToIndex(1);

      expect(navigate).toHaveBeenCalledTimes(1);
      expect(navigate).toHaveBeenCalledWith(
        `${CONFIRM_TRANSACTION_ROUTE}/${APPROVAL_ID_2_MOCK}?test=dummy`,
        { replace: true }
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
