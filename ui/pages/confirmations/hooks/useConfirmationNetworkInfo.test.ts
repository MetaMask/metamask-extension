import { ApprovalType } from '@metamask/controller-utils';
import { TransactionType } from '@metamask/transaction-controller';

import { CHAIN_IDS } from '../../../../shared/constants/network';
import mockState from '../../../../test/data/mock-state.json';
import { mockNetworkState } from '../../../../test/stub/networks';
import { renderHookWithConfirmContextProvider } from '../../../../test/lib/confirmations/render-helpers';
import {
  getMockConfirmState,
  getMockTypedSignConfirmState,
} from '../../../../test/data/confirmations/helper';
import useConfirmationNetworkInfo from './useConfirmationNetworkInfo';

describe('useConfirmationNetworkInfo', () => {
  it('returns display name and image when confirmation chainId is present', () => {
    const { result } = renderHookWithConfirmContextProvider(
      () => useConfirmationNetworkInfo(),
      getMockConfirmState({
        metamask: {
          ...mockState.metamask,
          ...mockNetworkState({ chainId: CHAIN_IDS.MAINNET }),
          pendingApprovals: {
            123: {
              id: 123,
              type: ApprovalType.EthSignTypedData,
            },
          },
          unapprovedTypedMessages: {
            123: {
              id: 123,
              chainId: '0x1',
              type: TransactionType.signTypedData,
            },
          },
        },
      }),
    );

    expect(result.current.networkDisplayName).toBe('Ethereum Mainnet');
    expect(result.current.networkImageUrl).toBe('./images/eth_logo.svg');
  });

  it('returns display name and image for custom network', () => {
    const { result } = renderHookWithConfirmContextProvider(
      () => useConfirmationNetworkInfo(),
      getMockTypedSignConfirmState({
        metamask: {
          ...mockState.metamask,
          ...mockNetworkState({
            chainId: '0x7',
            rpcUrl: 'https://testrpc.com',
            nickname: 'Custom Mainnet RPC',
          }),
          pendingApprovals: {
            123: {
              id: 123,
              type: ApprovalType.EthSignTypedData,
            },
          },
          unapprovedTypedMessages: {
            123: {
              id: 123,
              chainId: '0x7',
              type: TransactionType.signTypedData,
            },
          },
        },
      }),
    );

    expect(result.current.networkDisplayName).toBe('Custom Mainnet RPC');
  });

  it('returns correct details about custom network whose chainId is same as a network pre-defined in extension', () => {
    const customNetwork = {
      chainId: '0x1' as const,
      nickname: 'Flashbots Protect',
      rpcUrl: 'https://rpc.flashbots.net',
    };
    const { result } = renderHookWithConfirmContextProvider(
      () => useConfirmationNetworkInfo(),
      getMockConfirmState({
        metamask: {
          ...mockState.metamask,
          ...mockNetworkState(customNetwork),
          pendingApprovals: {
            123: {
              id: 123,
              type: ApprovalType.EthSignTypedData,
            },
          },
          unapprovedTypedMessages: {
            123: {
              id: 123,
              chainId: '0x1',
              type: TransactionType.signTypedData,
            },
          },
        },
      }),
    );

    expect(result.current.networkDisplayName).toBe('Flashbots Protect');
    expect(result.current.networkImageUrl).toBe('./images/eth_logo.svg');
  });
});
