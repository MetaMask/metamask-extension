import React from 'react';
import mockState from '../../../../../../test/data/mock-state.json';
import { renderWithProvider } from '../../../../../../test/lib/render-helpers-navigate';
import configureStore from '../../../../../store/store';
import { ConfirmInfoRowAddressDisplay } from './address-display';
import { TEST_ADDRESS } from './constants';

const KNOWN_ADDRESS = '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc';

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
  it('renders display name element for unknown address', () => {
    const { getByTestId } = render();
    expect(getByTestId('confirm-info-row-display-name')).toBeInTheDocument();
  });

  it('renders account name for known address', () => {
    const { getByTestId } = render(KNOWN_ADDRESS);
    expect(getByTestId('confirm-info-row-display-name')).toHaveTextContent(
      'Account 1',
    );
  });

  it('renders full address when container has sufficient width', () => {
    jest
      .spyOn(HTMLElement.prototype, 'clientWidth', 'get')
      .mockReturnValue(500);

    const { getByTestId } = render();
    expect(getByTestId('confirm-info-row-display-name').textContent).toContain(
      '0x5CfE73b6',
    );

    jest.restoreAllMocks();
  });
});
