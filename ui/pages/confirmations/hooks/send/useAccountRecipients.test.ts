import { renderHookWithProvider } from '../../../../../test/lib/render-helpers';
import mockState from '../../../../../test/data/mock-state.json';
import { ConsolidatedWallets } from '../../../../selectors/multichain-accounts/account-tree.types';
import * as accountTreeSelectors from '../../../../selectors/multichain-accounts/account-tree';
import * as useSendContextModule from '../../context/send';
import * as accountUtils from '../../utils/account';
import { useSendContext } from '../../context/send';
import * as useSendTypeModule from './useSendType';
import { useSendType } from './useSendType';
import { useAccountRecipients } from './useAccountRecipients';

jest.mock('./useSendType');
jest.mock('../../../../selectors/multichain-accounts/account-tree');
jest.mock('../../context/send');
jest.mock('../../utils/account');

const mockUseSendType = jest.spyOn(useSendTypeModule, 'useSendType');
const mockGetWalletsWithAccounts = jest.spyOn(
  accountTreeSelectors,
  'getWalletsWithAccounts',
);
const mockUseSendContext = jest.spyOn(useSendContextModule, 'useSendContext');
const mockIsEVMAccountForSend = jest.mocked(accountUtils.isEVMAccountForSend);
const mockIsSolanaAccountForSend = jest.mocked(
  accountUtils.isSolanaAccountForSend,
);

describe('useAccountRecipients', () => {
  const mockWalletsWithAccounts = {
    wallet1: {
      metadata: {
        name: 'MetaMask Wallet',
      },
      groups: {
        group1: {
          metadata: {
            name: 'Account Group 1',
          },
          accounts: [
            { address: '0x1234567890abcdef1234567890abcdef12345678' },
            { address: '0xabcdef1234567890abcdef1234567890abcdef12' },
          ],
        },
      },
    },
    wallet2: {
      metadata: {
        name: 'Hardware Wallet',
      },
      groups: {
        group2: {
          metadata: {
            name: 'Account Group 2',
          },
          accounts: [
            { address: '5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty' },
          ],
        },
      },
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetWalletsWithAccounts.mockReturnValue(mockWalletsWithAccounts);
    mockUseSendContext.mockReturnValue({
      from: '0xfrom1234567890abcdef1234567890abcdef123456',
    } as unknown as ReturnType<typeof useSendContext>);
  });

  it('returns EVM account recipients when isEvmSendType is true', () => {
    mockUseSendType.mockReturnValue({
      isEvmSendType: true,
      isSolanaSendType: false,
    } as unknown as ReturnType<typeof useSendType>);
    mockIsEVMAccountForSend.mockReturnValue(true);
    mockIsSolanaAccountForSend.mockReturnValue(false);

    const { result } = renderHookWithProvider(
      () => useAccountRecipients(),
      mockState,
    );

    expect(result.current).toEqual([
      {
        accountGroupName: 'Account Group 1',
        address: '0x1234567890abcdef1234567890abcdef12345678',
        walletName: 'MetaMask Wallet',
      },
      {
        accountGroupName: 'Account Group 1',
        address: '0xabcdef1234567890abcdef1234567890abcdef12',
        walletName: 'MetaMask Wallet',
      },
      {
        accountGroupName: 'Account Group 2',
        address: '5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty',
        walletName: 'Hardware Wallet',
      },
    ]);
  });

  it('returns Solana account recipients when isSolanaSendType is true', () => {
    mockUseSendType.mockReturnValue({
      isEvmSendType: false,
      isSolanaSendType: true,
    } as unknown as ReturnType<typeof useSendType>);
    mockIsEVMAccountForSend.mockReturnValue(false);
    mockIsSolanaAccountForSend.mockReturnValue(true);

    const { result } = renderHookWithProvider(
      () => useAccountRecipients(),
      mockState,
    );

    expect(result.current).toEqual([
      {
        accountGroupName: 'Account Group 1',
        address: '0x1234567890abcdef1234567890abcdef12345678',
        walletName: 'MetaMask Wallet',
      },
      {
        accountGroupName: 'Account Group 1',
        address: '0xabcdef1234567890abcdef1234567890abcdef12',
        walletName: 'MetaMask Wallet',
      },
      {
        accountGroupName: 'Account Group 2',
        address: '5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty',
        walletName: 'Hardware Wallet',
      },
    ]);
  });

  it('excludes sender account from recipients', () => {
    mockUseSendContext.mockReturnValue({
      from: '0x1234567890abcdef1234567890abcdef12345678',
    } as unknown as ReturnType<typeof useSendContext>);
    mockUseSendType.mockReturnValue({
      isEvmSendType: true,
      isSolanaSendType: false,
    } as unknown as ReturnType<typeof useSendType>);
    mockIsEVMAccountForSend.mockReturnValue(true);

    const { result } = renderHookWithProvider(
      () => useAccountRecipients(),
      mockState,
    );

    expect(result.current).toEqual([
      {
        accountGroupName: 'Account Group 1',
        address: '0xabcdef1234567890abcdef1234567890abcdef12',
        walletName: 'MetaMask Wallet',
      },
      {
        accountGroupName: 'Account Group 2',
        address: '5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty',
        walletName: 'Hardware Wallet',
      },
    ]);
  });

  it('returns empty array when neither EVM nor Solana send type', () => {
    mockUseSendType.mockReturnValue({
      isEvmSendType: false,
      isSolanaSendType: false,
    } as unknown as ReturnType<typeof useSendType>);

    const { result } = renderHookWithProvider(
      () => useAccountRecipients(),
      mockState,
    );

    expect(result.current).toEqual([]);
  });

  it('filters accounts based on account type compatibility', () => {
    mockUseSendType.mockReturnValue({
      isEvmSendType: true,
      isSolanaSendType: false,
    } as unknown as ReturnType<typeof useSendType>);
    mockIsEVMAccountForSend.mockImplementation(
      (account) =>
        account.address === '0x1234567890abcdef1234567890abcdef12345678',
    );

    const { result } = renderHookWithProvider(
      () => useAccountRecipients(),
      mockState,
    );

    expect(result.current).toEqual([
      {
        accountGroupName: 'Account Group 1',
        address: '0x1234567890abcdef1234567890abcdef12345678',
        walletName: 'MetaMask Wallet',
      },
    ]);
  });

  it('returns empty array when no wallets available', () => {
    mockGetWalletsWithAccounts.mockReturnValue({});
    mockUseSendType.mockReturnValue({
      isEvmSendType: true,
      isSolanaSendType: false,
    } as unknown as ReturnType<typeof useSendType>);

    const { result } = renderHookWithProvider(
      () => useAccountRecipients(),
      mockState,
    );

    expect(result.current).toEqual([]);
  });

  it('handles wallets without metadata names', () => {
    mockGetWalletsWithAccounts.mockReturnValue({
      wallet1: {
        metadata: {},
        groups: {
          group1: {
            metadata: {},
            accounts: [
              { address: '0x1234567890abcdef1234567890abcdef12345678' },
            ],
          },
        },
      },
    } as unknown as ConsolidatedWallets);
    mockUseSendType.mockReturnValue({
      isEvmSendType: true,
      isSolanaSendType: false,
    } as unknown as ReturnType<typeof useSendType> & {
      isEvmNativeSendType: boolean;
      isNonEvmSendType: boolean;
      isNonEvmNativeSendType: boolean;
    });
    mockIsEVMAccountForSend.mockReturnValue(true);

    const { result } = renderHookWithProvider(
      () => useAccountRecipients(),
      mockState,
    );

    expect(result.current).toEqual([
      {
        accountGroupName: undefined,
        address: '0x1234567890abcdef1234567890abcdef12345678',
        walletName: undefined,
      },
    ]);
  });

  it('calls required hooks and selectors', () => {
    mockUseSendType.mockReturnValue({
      isEvmSendType: true,
      isSolanaSendType: false,
    } as unknown as ReturnType<typeof useSendType> & {
      isEvmNativeSendType: boolean;
      isNonEvmSendType: boolean;
      isNonEvmNativeSendType: boolean;
    });

    renderHookWithProvider(() => useAccountRecipients(), mockState);

    expect(mockUseSendType).toHaveBeenCalledTimes(1);
    expect(mockUseSendContext).toHaveBeenCalledTimes(1);
    expect(mockGetWalletsWithAccounts).toHaveBeenCalledTimes(1);
  });
});
