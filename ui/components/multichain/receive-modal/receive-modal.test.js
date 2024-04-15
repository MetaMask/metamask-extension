import React from 'react';
import { screen } from '@testing-library/react';
import mockState from '../../../../test/data/mock-state.json';
import { renderWithProvider } from '../../../../test/jest';
import configureStore from '../../../store/store';
import { toChecksumHexAddress } from '../../../../shared/modules/hexstring-utils';
import { ReceiveModal } from '.';

describe('ReceiveModal', () => {
  const render = (address) =>
    renderWithProvider(
      <ReceiveModal address={address} onClose={jest.fn()} />,
      configureStore(mockState),
    );

  it('should show the correct account address and name', () => {
    const address = '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc';
    render(address);
    // Check for the copy button
    expect(
      screen.queryByText(toChecksumHexAddress(address)),
    ).toBeInTheDocument();
    // Check for the title
    expect(screen.queryByText('Test Account')).toBeInTheDocument();
  });

  it('should show the correct snap account name', () => {
    render('0xb552685e3d2790efd64a175b00d51f02cdafee5d');
    expect(screen.queryByText('Snap Account 1')).toBeInTheDocument();
  });
});
