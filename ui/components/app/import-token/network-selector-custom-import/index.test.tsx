import React from 'react';
import configureStore from 'redux-mock-store';
import { fireEvent, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { renderWithProvider } from '../../../../../test/lib/render-helpers';
import mockState from '../../../../../test/data/mock-state.json';
import { NetworkSelectorCustomImport } from '.';

describe('NetworkSelectorCustomImport', () => {
  const store = configureStore()(mockState);

  it('should match snapshot', () => {
    const props = {
      title: 'Test Title',
      buttonDataTestId: 'network-selector-button',
      chainId: '1',
      onSelectNetwork: jest.fn(),
    };

    const { container } = renderWithProvider(
      <NetworkSelectorCustomImport {...props} />,
      store,
    );

    expect(screen.getByText('Test Title')).toBeInTheDocument();
    expect(container).toMatchSnapshot();
  });

  it('should call onSelectNetwork when container is clicked', () => {
    const onSelectNetwork = jest.fn();

    const props = {
      title: 'Clickable Network',
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
