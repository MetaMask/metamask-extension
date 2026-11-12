import React from 'react';
import { fireEvent, screen } from '@testing-library/react';
import configureMockStore from 'redux-mock-store';
import { CHAIN_IDS } from '../../../../shared/constants/network';
import mockState from '../../../../test/data/mock-state.json';
import { renderWithProvider } from '../../../../test/lib/render-helpers-navigate';
import AssetOptions from './asset-options';

// EVM account of the selected account group in `mock-state.json`.
const SELECTED_ACCOUNT_ID = 'cf8dace4-9439-4bd4-b3a8-88c821c8fcb3';

const token = {
  address: '0x6b175474e89094c44da98b954eedeac495271d0f',
  chainId: CHAIN_IDS.MAINNET,
  symbol: 'DAI',
  decimals: 18,
};

const tokenAssetId = `eip155:1/erc20:${token.address}`;

type AssetsBalance = Record<string, Record<string, { amount: string }>>;

async function renderOpenedMenu({
  assetsBalance = {},
  isNativeAsset = false,
}: {
  assetsBalance?: AssetsBalance;
  isNativeAsset?: boolean;
} = {}) {
  const store = configureMockStore()({
    metamask: { ...mockState.metamask, assetsBalance },
  });

  renderWithProvider(
    <AssetOptions
      isNativeAsset={isNativeAsset}
      token={token}
      onRemove={jest.fn()}
      onClickBlockExplorer={jest.fn()}
    />,
    store,
  );

  fireEvent.click(screen.getByTestId('asset-options__button'));
  // The menu positions itself asynchronously; wait for it to settle.
  await screen.findByTestId('asset-options__etherscan');
}

type HideOptionCase = {
  testName: string;
  isNativeAsset: boolean;
  assetsBalance: AssetsBalance;
  expectHideButtonVisible: boolean;
};

describe('AssetOptions', () => {
  const selectedAccountTokenBalance = {
    [SELECTED_ACCOUNT_ID]: { [tokenAssetId]: { amount: '1' } },
  };

  const hideTokenButtonTestCases: HideOptionCase[] = [
    {
      testName: 'offers to hide a token the selected account group holds',
      isNativeAsset: false,
      assetsBalance: selectedAccountTokenBalance,
      expectHideButtonVisible: true,
    },
  ];

  const noHideTokenButtonTestCases: HideOptionCase[] = [
    {
      testName: 'does not offer to hide a token without a balance entry',
      isNativeAsset: false,
      assetsBalance: {},
      expectHideButtonVisible: false,
    },
    {
      testName:
        'does not offer to hide a token held by an account outside the selected group',
      isNativeAsset: false,
      assetsBalance: {
        'other-group-account-id': { [tokenAssetId]: { amount: '1' } },
      },
      expectHideButtonVisible: false,
    },
    {
      testName: 'does not offer to hide a native asset',
      isNativeAsset: true,
      assetsBalance: selectedAccountTokenBalance,
      expectHideButtonVisible: false,
    },
  ];

  const testCases: HideOptionCase[] = [
    ...hideTokenButtonTestCases,
    ...noHideTokenButtonTestCases,
  ];

  // @ts-expect-error This function is missing from the Mocha type definitions
  it.each(testCases)(
    '$testName',
    async ({
      isNativeAsset,
      assetsBalance,
      expectHideButtonVisible,
    }: HideOptionCase) => {
      await renderOpenedMenu({ isNativeAsset, assetsBalance });

      if (expectHideButtonVisible) {
        expect(screen.getByTestId('asset-options__hide')).toBeInTheDocument();
      } else {
        expect(
          screen.queryByTestId('asset-options__hide'),
        ).not.toBeInTheDocument();
      }
    },
  );
});
