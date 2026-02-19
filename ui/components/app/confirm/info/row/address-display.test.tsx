import React from 'react';
import mockState from '../../../../../../test/data/mock-state.json';
import { renderWithProvider } from '../../../../../../test/lib/render-helpers-navigate';
import configureStore from '../../../../../store/store';
import { ConfirmInfoRowAddressDisplay } from './address-display';
import { TEST_ADDRESS } from './constants';

const render = (address: string = TEST_ADDRESS) => {
  const store = configureStore({
    metamask: { ...mockState.metamask },
  });

  return renderWithProvider(
    <ConfirmInfoRowAddressDisplay address={address} />,
    store,
  );
};

describe('ConfirmInfoRowAddressDisplay', () => {
  it('renders correctly', () => {
    const { container } = render();
    expect(container).toMatchSnapshot();
  });

  it('renders display name element', () => {
    const { getByTestId } = render();
    expect(getByTestId('confirm-info-row-display-name')).toBeInTheDocument();
  });
});
