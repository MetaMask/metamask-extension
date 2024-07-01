import React from 'react';
import { fireEvent, renderWithProvider } from '../../../../test/jest';
import configureStore from '../../../store/store';
import { createBridgeMockStore } from '../../../../test/jest/mock-store';
import { MultiChainTokenPicker } from './multichain-token-picker';
import { CHAIN_IDS, FEATURED_RPCS } from '../../../../shared/constants/network';

describe('MultiChainTokenPicker', () => {
  it('should render the component', () => {
    const mockStore = createBridgeMockStore({
      srcNetworkAllowlist: [CHAIN_IDS.MAINNET, CHAIN_IDS.OPTIMISM],
      destNetworkAllowlist: [],
    });
    const { getByText, container } = renderWithProvider(
      <MultiChainTokenPicker
        selectedNetwork={FEATURED_RPCS[0]}
        networks={FEATURED_RPCS}
        onTokenChange={() => {}}
        onNetworkChange={() => {}}
      />,
      configureStore(mockStore),
    );

    const selectTokenButton = getByText('Select token');
    expect(selectTokenButton).toBeInTheDocument();
    expect(container).toMatchSnapshot();
    fireEvent.click(selectTokenButton);

    expect(getByText('Select Network')).toBeInTheDocument();
    FEATURED_RPCS.forEach(({ nickname }) =>
      expect(getByText(nickname)).toBeInTheDocument(),
    );

    // TODO expect tokens list
  });
});
