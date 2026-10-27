import React from 'react';
import configureStore from 'redux-mock-store';
import { fireEvent, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { renderWithProvider } from '../../../../../test/lib/render-helpers-navigate';
import mockState from '../../../../../test/data/mock-state.json';
import { NetworkSelectorCustomImport } from '.';

describe('NetworkSelectorCustomImport', () => {
  const store = configureStore()(mockState);

  it('renders the network name as a button', () => {
    const props = {
      title: 'Test Title',
      ariaLabel: 'Network: Test Title',
      buttonDataTestId: 'network-selector-button',
      chainId: '1',
      onSelectNetwork: jest.fn(),
    };

    renderWithProvider(<NetworkSelectorCustomImport {...props} />, store);

    expect(
      screen.getByRole('button', { name: 'Network: Test Title' }),
    ).toHaveTextContent('Test Title');
  });

  it('should call onSelectNetwork when container is clicked', () => {
    const onSelectNetwork = jest.fn();

    const props = {
      title: 'Clickable Network',
      ariaLabel: 'Network: Clickable Network',
      buttonDataTestId: 'network-selector-click',
      chainId: '1',
      onSelectNetwork,
    };

    const { getByTestId } = renderWithProvider(
      <NetworkSelectorCustomImport {...props} />,
      store,
    );

    const button = getByTestId('network-selector-click');

    // Simulate click on the outer Box container
    fireEvent.click(button);
    expect(onSelectNetwork).toHaveBeenCalledTimes(1);
  });
});
