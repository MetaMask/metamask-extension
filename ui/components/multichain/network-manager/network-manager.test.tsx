import React from 'react';
import { screen, fireEvent } from '@testing-library/react';
import { renderWithProvider } from '../../../../test/jest';
import configureStore from '../../../store/store';
import { NetworkManager } from './network-manager';

describe('NetworkManager Component', () => {
  const renderNetworkManager = () => {
    const store = configureStore({});
    return renderWithProvider(<NetworkManager />, store);
  };

  it('renders correctly when open', () => {
    renderNetworkManager();

    // Verify the modal header is rendered
    expect(screen.getByText('Networks')).toBeInTheDocument();

    // Verify tabs are rendered
    expect(screen.getByText('Default')).toBeInTheDocument();
    expect(screen.getByText('Custom')).toBeInTheDocument();
    expect(screen.getByText('Test')).toBeInTheDocument();

    // Verify default tab content is rendered
    expect(screen.getByText('Deselect All')).toBeInTheDocument();
    expect(screen.getByText('Arbitrum One')).toBeInTheDocument();
    expect(screen.getByText('Optimism')).toBeInTheDocument();
    expect(screen.getByText('Avalanche')).toBeInTheDocument();
    expect(screen.getByText('Base')).toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', () => {
    const onClose = jest.fn();
    renderNetworkManager();

    // Find and click the close button
    const closeButton = screen.getByRole('button', { name: /close/i });
    fireEvent.click(closeButton);

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('switches tab when tab is clicked', () => {
    renderNetworkManager();

    // Verify that Default tab is active by default
    expect(screen.getByText('Deselect All')).toBeInTheDocument();

    // Click on Custom tab
    fireEvent.click(screen.getByText('Custom'));

    // Verify Custom tab content is rendered
    expect(screen.getByText('Networks 1')).toBeInTheDocument();

    // Click on Test tab
    fireEvent.click(screen.getByText('Test'));

    // Verify Test tab content is rendered
    expect(screen.getByText('Networks 2')).toBeInTheDocument();
  });

  it('is not rendered when isOpen is false', () => {
    renderNetworkManager();

    // Modal should not render when isOpen is false
    expect(screen.queryByText('Networks')).not.toBeInTheDocument();
  });
});
