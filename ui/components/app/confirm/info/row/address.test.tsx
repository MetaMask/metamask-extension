import React from 'react';
import { CHAIN_IDS } from '../../../../../../shared/constants/network';
import mockState from '../../../../../../test/data/mock-state.json';
import { renderWithProvider } from '../../../../../../test/lib/render-helpers';
import configureStore from '../../../../../store/store';
import { ConfirmInfoRowAddress } from './address';
import { TEST_ADDRESS } from './constants';

const CHAIN_ID_MOCK = CHAIN_IDS.MAINNET;

const render = (
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31973
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  storeOverrides: Record<string, any> = {},
  address: string = TEST_ADDRESS,
) => {
  const store = configureStore({
    metamask: { ...mockState.metamask },
    ...storeOverrides,
  });

  return renderWithProvider(
    <ConfirmInfoRowAddress address={address} chainId={CHAIN_ID_MOCK} />,
    store,
  );
};

describe('ConfirmInfoRowAddress', () => {
  it('renders appropriately with PetNames enabled', () => {
    const { container } = render({
      metamask: {
        ...mockState.metamask,
        preferences: {
          ...mockState.metamask.preferences,
          petnamesEnabled: true,
        },
      },
    });

    expect(container).toMatchSnapshot();
  });
});
