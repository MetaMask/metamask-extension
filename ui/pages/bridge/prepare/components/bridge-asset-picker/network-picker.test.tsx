import React from 'react';
import { formatChainIdToCaip } from '@metamask/bridge-controller';
import { type CaipChainId } from '@metamask/utils';
import { renderWithProvider } from '../../../../../../test/lib/render-helpers-navigate';
import { createBridgeMockStore } from '../../../../../../test/data/bridge/mock-bridge-store';
import configureStore from '../../../../../store/store';
import { CHAIN_IDS } from '../../../../../../shared/constants/network';
import { NetworkPicker } from './network-picker';

const getRenderedChainOrder = (testId: string) =>
  Array.from(
    document.querySelectorAll(`[data-testid^="${testId}-item-"]`),
  ).map((node) =>
    node.getAttribute('data-testid')?.replace(`${testId}-item-`, ''),
  );

const CAIP_MAINNET = formatChainIdToCaip(CHAIN_IDS.MAINNET);
const CAIP_OPTIMISM = formatChainIdToCaip(CHAIN_IDS.OPTIMISM);
const CAIP_POLYGON = formatChainIdToCaip(CHAIN_IDS.POLYGON);

const TEST_ID = 'bridge-network-picker-test';

const CHAINS = [
  { chainId: CAIP_MAINNET, name: 'Ethereum' },
  { chainId: CAIP_OPTIMISM, name: 'Optimism' },
  { chainId: CAIP_POLYGON, name: 'Polygon' },
];

const BALANCE_BY_CHAIN_ID: Record<CaipChainId, number> = {
  [CAIP_POLYGON]: 1000,
  [CAIP_MAINNET]: 500,
  [CAIP_OPTIMISM]: 0,
};

jest.mock('../../../../../selectors/multichain/feature-flags', () => ({
  ...jest.requireActual('../../../../../selectors/multichain/feature-flags'),
  getIsNetworkManagementEnabled: () => true,
}));

const defaultProps = {
  chains: CHAINS,
  selectedChainId: null,
  onNetworkChange: jest.fn(),
  isOpen: true,
  onClose: jest.fn(),
  testId: TEST_ID,
};

describe('NetworkPicker', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders chains in descending fiat balance order when network management is enabled', () => {
    renderWithProvider(
      <NetworkPicker {...defaultProps} balanceByChainId={BALANCE_BY_CHAIN_ID} />,
      configureStore(createBridgeMockStore({})),
    );

    expect(getRenderedChainOrder(TEST_ID)).toStrictEqual([
      CAIP_POLYGON,
      CAIP_MAINNET,
      CAIP_OPTIMISM,
    ]);
  });

  it('preserves static chain order when balance data is empty', () => {
    renderWithProvider(
      <NetworkPicker {...defaultProps} />,
      configureStore(createBridgeMockStore({})),
    );

    expect(getRenderedChainOrder(TEST_ID)).toStrictEqual([
      CAIP_MAINNET,
      CAIP_OPTIMISM,
      CAIP_POLYGON,
    ]);
  });
});
