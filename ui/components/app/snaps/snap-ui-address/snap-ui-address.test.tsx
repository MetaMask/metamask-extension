import React from 'react';
import configureMockStore from 'redux-mock-store';

import mockState from '../../../../../test/data/mock-state.json';
import { renderWithProvider } from '../../../../../test/lib/render-helpers';
import { SnapUIAddress } from './snap-ui-address';

const mockStore = configureMockStore([])(mockState);
const mockStoreWithBlockies = configureMockStore([])({
  ...mockState,
  metamask: {
    ...mockState.metamask,
    useBlockie: true,
  },
});

describe('SnapUIAddress', () => {
  it('renders legacy Ethereum address', () => {
    const { container } = renderWithProvider(
      <SnapUIAddress address="0xab16a96d359ec26a11e2c2b3d8f8b8942d5bfcdb" />,
      mockStore,
    );

    expect(container).toMatchSnapshot();
  });

  it('renders Ethereum address', () => {
    const { container } = renderWithProvider(
      <SnapUIAddress address="eip155:1:0xab16a96D359eC26a11e2C2b3d8f8B8942d5Bfcdb" />,
      mockStore,
    );

    expect(container).toMatchSnapshot();
  });

  it('renders Ethereum address with blockie', () => {
    const { container } = renderWithProvider(
      <SnapUIAddress address="eip155:1:0xab16a96D359eC26a11e2C2b3d8f8B8942d5Bfcdb" />,
      mockStoreWithBlockies,
    );

    expect(container).toMatchSnapshot();
  });

  it('renders Bitcoin address', () => {
    const { container } = renderWithProvider(
      <SnapUIAddress address="bip122:000000000019d6689c085ae165831e93:128Lkh3S7CkDTBZ8W7BbpsN3YYizJMp8p6" />,
      mockStore,
    );

    expect(container).toMatchSnapshot();
  });

  it('renders Bitcoin address with blockie', () => {
    const { container } = renderWithProvider(
      <SnapUIAddress address="bip122:000000000019d6689c085ae165831e93:128Lkh3S7CkDTBZ8W7BbpsN3YYizJMp8p6" />,
      mockStoreWithBlockies,
    );

    expect(container).toMatchSnapshot();
  });

  it('renders Cosmos address', () => {
    const { container } = renderWithProvider(
      <SnapUIAddress address="cosmos:cosmoshub-3:cosmos1t2uflqwqe0fsj0shcfkrvpukewcw40yjj6hdc0" />,
      mockStore,
    );

    expect(container).toMatchSnapshot();
  });

  it('renders Cosmos address with blockie', () => {
    const { container } = renderWithProvider(
      <SnapUIAddress address="cosmos:cosmoshub-3:cosmos1t2uflqwqe0fsj0shcfkrvpukewcw40yjj6hdc0" />,
      mockStoreWithBlockies,
    );

    expect(container).toMatchSnapshot();
  });

  it('renders Polkadot address', () => {
    const { container } = renderWithProvider(
      <SnapUIAddress address="polkadot:b0a8d493285c2df73290dfb7e61f870f:5hmuyxw9xdgbpptgypokw4thfyoe3ryenebr381z9iaegmfy" />,
      mockStore,
    );

    expect(container).toMatchSnapshot();
  });

  it('renders Polkadot address with blockie', () => {
    const { container } = renderWithProvider(
      <SnapUIAddress address="polkadot:b0a8d493285c2df73290dfb7e61f870f:5hmuyxw9xdgbpptgypokw4thfyoe3ryenebr381z9iaegmfy" />,
      mockStoreWithBlockies,
    );

    expect(container).toMatchSnapshot();
  });

  it('renders Starknet address', () => {
    const { container } = renderWithProvider(
      <SnapUIAddress address="starknet:SN_GOERLI:0x02dd1b492765c064eac4039e3841aa5f382773b598097a40073bd8b48170ab57" />,
      mockStore,
    );

    expect(container).toMatchSnapshot();
  });

  it('renders Starknet address with blockie', () => {
    const { container } = renderWithProvider(
      <SnapUIAddress address="starknet:SN_GOERLI:0x02dd1b492765c064eac4039e3841aa5f382773b598097a40073bd8b48170ab57" />,
      mockStoreWithBlockies,
    );

    expect(container).toMatchSnapshot();
  });

  it('renders Hedera address', () => {
    const { container } = renderWithProvider(
      <SnapUIAddress address="hedera:mainnet:0.0.1234567890-zbhlt" />,
      mockStore,
    );

    expect(container).toMatchSnapshot();
  });

  it('renders Hedera address with blockie', () => {
    const { container } = renderWithProvider(
      <SnapUIAddress address="hedera:mainnet:0.0.1234567890-zbhlt" />,
      mockStoreWithBlockies,
    );

    expect(container).toMatchSnapshot();
  });
});
