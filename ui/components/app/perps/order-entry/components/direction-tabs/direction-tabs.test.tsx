import React from 'react';
import { screen, fireEvent } from '@testing-library/react';
import { renderWithProvider } from '../../../../../../../test/lib/render-helpers-navigate';
import configureStore from '../../../../../../store/store';
import mockState from '../../../../../../../test/data/mock-state.json';
import { DirectionTabs } from './direction-tabs';

const mockStore = configureStore({
  metamask: {
    ...mockState.metamask,
  },
});

describe('DirectionTabs', () => {
  it('renders long and short tabs', () => {
    renderWithProvider(
      <DirectionTabs direction="long" onDirectionChange={jest.fn()} />,
      mockStore,
    );

    expect(screen.getByTestId('direction-tab-long')).toBeInTheDocument();
    expect(screen.getByTestId('direction-tab-short')).toBeInTheDocument();
  });

  it('renders the direction-tabs container', () => {
    renderWithProvider(
      <DirectionTabs direction="long" onDirectionChange={jest.fn()} />,
      mockStore,
    );

    expect(screen.getByTestId('direction-tabs')).toBeInTheDocument();
  });

  it('calls onDirectionChange when switching from long to short', () => {
    const onDirectionChange = jest.fn();
    renderWithProvider(
      <DirectionTabs direction="long" onDirectionChange={onDirectionChange} />,
      mockStore,
    );

    fireEvent.click(screen.getByTestId('direction-tab-short'));

    expect(onDirectionChange).toHaveBeenCalledWith('short');
  });

  it('calls onDirectionChange when switching from short to long', () => {
    const onDirectionChange = jest.fn();
    renderWithProvider(
      <DirectionTabs direction="short" onDirectionChange={onDirectionChange} />,
      mockStore,
    );

    fireEvent.click(screen.getByTestId('direction-tab-long'));

    expect(onDirectionChange).toHaveBeenCalledWith('long');
  });

  it('does not call onDirectionChange when clicking already active direction', () => {
    const onDirectionChange = jest.fn();
    renderWithProvider(
      <DirectionTabs direction="long" onDirectionChange={onDirectionChange} />,
      mockStore,
    );

    fireEvent.click(screen.getByTestId('direction-tab-long'));

    expect(onDirectionChange).not.toHaveBeenCalled();
  });

  it('does not call onDirectionChange when clicking already active short', () => {
    const onDirectionChange = jest.fn();
    renderWithProvider(
      <DirectionTabs direction="short" onDirectionChange={onDirectionChange} />,
      mockStore,
    );

    fireEvent.click(screen.getByTestId('direction-tab-short'));

    expect(onDirectionChange).not.toHaveBeenCalled();
  });
});
