import React from 'react';
import { screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { useDispatch } from 'react-redux';
import configureMockStore from 'redux-mock-store';
import mockState from '../../../../../test/data/mock-state.json';
import { renderWithProvider } from '../../../../../test/lib/render-helpers';
import AutoDetectNftModal from './auto-detect-nft-modal';

// Mock store setup
const mockStore = configureMockStore([])(mockState);

jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useDispatch: jest.fn(),
}));

describe('AutoDetectNftModal', () => {
  const useDispatchMock = jest.mocked(useDispatch);

  beforeEach(() => {
    jest.resetAllMocks();
    useDispatchMock.mockReturnValue(jest.fn());
  });

  it('renders the modal when isOpen is true', () => {
    renderWithProvider(
      <AutoDetectNftModal isOpen={true} onClose={() => ({})} />,
      mockStore,
    );

    expect(screen.getByText('Enable NFT autodetection')).toBeInTheDocument();
    expect(screen.getByText('Allow')).toBeInTheDocument();
    expect(screen.getByText('Not right now')).toBeInTheDocument();
  });

  it('calls onClose with true when Allow button is clicked', () => {
    useDispatchMock.mockReturnValue(jest.fn().mockResolvedValue({}));
    const handleClose = jest.fn();
    renderWithProvider(
      <AutoDetectNftModal isOpen={true} onClose={handleClose} />,
      mockStore,
    );

    fireEvent.click(screen.getByText('Allow'));
    expect(handleClose).toHaveBeenCalledWith(true);
  });

  it('calls onClose with false when Not right now button is clicked', () => {
    useDispatchMock.mockReturnValue(jest.fn().mockResolvedValue({}));
    const handleClose = jest.fn();
    renderWithProvider(
      <AutoDetectNftModal isOpen={true} onClose={handleClose} />,
      mockStore,
    );

    fireEvent.click(screen.getByText('Not right now'));
    expect(handleClose).toHaveBeenCalledWith(false);
  });
});
