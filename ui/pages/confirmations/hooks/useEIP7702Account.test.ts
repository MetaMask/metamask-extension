import { act } from '@testing-library/react';
import {
  TransactionEnvelopeType,
  TransactionType,
} from '@metamask/transaction-controller';
import { useDispatch } from 'react-redux';
import {
  addTransactionAndRouteToConfirmationPage,
  getCode,
} from '../../../store/actions';
import { renderHookWithProvider } from '../../../../test/lib/render-helpers';
import { useConfirmationNavigation } from './useConfirmationNavigation';
import {
  EIP_7702_REVOKE_ADDRESS,
  useEIP7702Account,
} from './useEIP7702Account';

jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useDispatch: jest.fn(),
}));

jest.mock('../../../store/actions', () => ({
  ...jest.requireActual('../../../store/actions'),
  addTransactionAndRouteToConfirmationPage: jest.fn(),
  getCode: jest.fn(),
}));

jest.mock('./useConfirmationNavigation', () => ({
  useConfirmationNavigation: jest.fn(),
}));

const ADDRESS_MOCK = '0x1234';
const UPGRADE_CONTRACT_ADDRESS_MOCK = '0x5678';
const CODE_MOCK = '0xabcd';
const TRANSACTION_ID_MOCK = '1234-5678';
const SEPOLIA_CHAINID = '0xaa36a7';

function runHook({ onRedirect }: { onRedirect?: () => void } = {}) {
  const { result } = renderHookWithProvider(
    () => useEIP7702Account({ onRedirect, chainId: SEPOLIA_CHAINID }),
    {
      metamask: {
        networkConfigurationsByChainId: {
          [SEPOLIA_CHAINID]: {
            defaultRpcEndpointIndex: 0,
            rpcEndpoints: [
              {
                networkClientId: 'sepolia',
              },
            ],
          },
        },
      },
    },
  );
  return result.current;
}

describe('useEIP7702Account', () => {
  const addTransactionAndRouteToConfirmationPageMock = jest.mocked(
    addTransactionAndRouteToConfirmationPage,
  );

  const useDispatchMock = jest.mocked(useDispatch);
  const getCodeMock = jest.mocked(getCode);
  const useConfirmationNavigationMock = jest.mocked(useConfirmationNavigation);

  beforeEach(() => {
    jest.resetAllMocks();

    addTransactionAndRouteToConfirmationPageMock.mockReturnValue({
      type: 'MockAction',
    } as unknown as ReturnType<
      typeof addTransactionAndRouteToConfirmationPageMock
    >);

    useConfirmationNavigationMock.mockReturnValue({
      confirmations: [],
      navigateToId: jest.fn(),
    } as unknown as ReturnType<typeof useConfirmationNavigationMock>);

    useDispatchMock.mockReturnValue(jest.fn());
  });

  describe('isUpgraded', () => {
    it('returns true if account has code', async () => {
      getCodeMock.mockResolvedValue(CODE_MOCK);
      const result = await runHook().isUpgraded(ADDRESS_MOCK);
      expect(result).toBe(true);
    });

    // @ts-expect-error This function is missing from the Mocha type definitions
    it.each([undefined, '', '0x'])(
      'returns false if code is %s',
      async (code: string) => {
        getCodeMock.mockResolvedValue(code);
        const result = await runHook().isUpgraded(ADDRESS_MOCK);
        expect(result).toBe(false);
      },
    );
  });

  describe('downgradeAccount', () => {
    it('adds transaction', async () => {
      const { downgradeAccount } = runHook();

      await downgradeAccount(ADDRESS_MOCK);

      expect(addTransactionAndRouteToConfirmationPageMock).toHaveBeenCalledWith(
        {
          authorizationList: [
            {
              address: EIP_7702_REVOKE_ADDRESS,
            },
          ],
          from: ADDRESS_MOCK,
          to: ADDRESS_MOCK,
          type: TransactionEnvelopeType.setCode,
        },
        {
          networkClientId: 'sepolia',
          type: TransactionType.revokeDelegation,
        },
      );
    });

    it('navigates to confirmation', async () => {
      const navigateToIdMock = jest.fn();

      useConfirmationNavigationMock.mockReturnValue({
        confirmations: [{ id: TRANSACTION_ID_MOCK }],
        navigateToId: navigateToIdMock,
      } as unknown as ReturnType<typeof useConfirmationNavigationMock>);

      useDispatchMock.mockReturnValue(
        jest.fn().mockResolvedValue({
          id: TRANSACTION_ID_MOCK,
        }),
      );

      const { downgradeAccount } = runHook();

      await act(async () => {
        await downgradeAccount(ADDRESS_MOCK);
      });

      expect(navigateToIdMock).toHaveBeenCalledTimes(1);
      expect(navigateToIdMock).toHaveBeenCalledWith(TRANSACTION_ID_MOCK);
    });

    it('calls onRedirect', async () => {
      const onRedirect = jest.fn();

      useConfirmationNavigationMock.mockReturnValue({
        confirmations: [{ id: TRANSACTION_ID_MOCK }],
        navigateToId: jest.fn(),
      } as unknown as ReturnType<typeof useConfirmationNavigationMock>);

      useDispatchMock.mockReturnValue(
        jest.fn().mockResolvedValue({
          id: TRANSACTION_ID_MOCK,
        }),
      );

      const { downgradeAccount } = runHook({ onRedirect });

      await act(async () => {
        await downgradeAccount(ADDRESS_MOCK);
      });

      expect(onRedirect).toHaveBeenCalledTimes(1);
    });
  });

  describe('upgradeAccount', () => {
    it('adds transaction', async () => {
      const { upgradeAccount } = runHook();

      await upgradeAccount(ADDRESS_MOCK, UPGRADE_CONTRACT_ADDRESS_MOCK);

      expect(addTransactionAndRouteToConfirmationPageMock).toHaveBeenCalledWith(
        {
          authorizationList: [
            {
              address: UPGRADE_CONTRACT_ADDRESS_MOCK,
            },
          ],
          from: ADDRESS_MOCK,
          to: ADDRESS_MOCK,
          type: TransactionEnvelopeType.setCode,
        },
        {
          networkClientId: 'sepolia',
          type: TransactionType.batch,
        },
      );
    });

    it('navigates to confirmation', async () => {
      const navigateToIdMock = jest.fn();

      useConfirmationNavigationMock.mockReturnValue({
        confirmations: [{ id: TRANSACTION_ID_MOCK }],
        navigateToId: navigateToIdMock,
      } as unknown as ReturnType<typeof useConfirmationNavigationMock>);

      useDispatchMock.mockReturnValue(
        jest.fn().mockResolvedValue({
          id: TRANSACTION_ID_MOCK,
        }),
      );

      const { upgradeAccount } = runHook();

      await act(async () => {
        await upgradeAccount(ADDRESS_MOCK, UPGRADE_CONTRACT_ADDRESS_MOCK);
      });

      expect(navigateToIdMock).toHaveBeenCalledTimes(1);
      expect(navigateToIdMock).toHaveBeenCalledWith(TRANSACTION_ID_MOCK);
    });

    it('calls onRedirect', async () => {
      const onRedirect = jest.fn();

      useConfirmationNavigationMock.mockReturnValue({
        confirmations: [{ id: TRANSACTION_ID_MOCK }],
        navigateToId: jest.fn(),
      } as unknown as ReturnType<typeof useConfirmationNavigationMock>);

      useDispatchMock.mockReturnValue(
        jest.fn().mockResolvedValue({
          id: TRANSACTION_ID_MOCK,
        }),
      );

      const { upgradeAccount } = runHook({ onRedirect });

      await act(async () => {
        await upgradeAccount(ADDRESS_MOCK, UPGRADE_CONTRACT_ADDRESS_MOCK);
      });

      expect(onRedirect).toHaveBeenCalledTimes(1);
    });
  });
});
