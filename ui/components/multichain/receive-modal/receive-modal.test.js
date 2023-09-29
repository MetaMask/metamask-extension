import React from 'react';
import { screen } from '@testing-library/react';
import { toChecksumHexAddress } from '@metamask/controller-utils';
import mockState from '../../../../test/data/mock-state.json';
import { renderWithProvider } from '../../../../test/jest';
import configureStore from '../../../store/store';
import { ReceiveModal } from '.';

describe('ReceiveModal', () => {
  const address = '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc';

  const render = () =>
    renderWithProvider(
      <ReceiveModal address={address} onClose={jest.fn()} />,
      configureStore(mockState),
    );

  it('should show the correct account address and name', () => {
    render();
    // Check for the copy button
    expect(
      screen.queryByText(toChecksumHexAddress(address)),
    ).toBeInTheDocument();
    // Check for the title
    expect(screen.queryByText('Test Account')).toBeInTheDocument();
  });
});
