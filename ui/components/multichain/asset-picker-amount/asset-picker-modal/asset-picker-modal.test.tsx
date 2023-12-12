import React from 'react';
import configureStore from 'redux-mock-store';
import { Asset } from '../../../../ducks/send';
import mockState from '../../../../../test/data/mock-send-state.json';
import { renderWithProvider } from '../../../../../test/lib/render-helpers';
import { AssetPickerModal } from './asset-picker-modal';

describe('AssetPickerModal', () => {
  const store = configureStore()(mockState);

  const props = {
    isOpen: true,
    onClose: () => ({}),
    asset: {
      balance: '0x0',
      details: null,
      error: null,
      type: 'NATIVE',
    } as unknown as Asset,
  };

  it('should render the modal when isOpen is true', () => {
    const { getByText } = renderWithProvider(
      <AssetPickerModal {...props} />,
      store,
    );

    const modalContent = getByText('Select a token');
    expect(modalContent).toBeInTheDocument();
  });

  it('should not render the modal when isOpen is false', () => {
    const { queryByText } = renderWithProvider(
      <AssetPickerModal {...props} isOpen={false} />,
      store,
    );
    const modalContent = queryByText('Select a token');
    expect(modalContent).not.toBeInTheDocument();
  });

  it('should render the modal with the correct title and search placeholder', () => {
    const { getByText, getByPlaceholderText } = renderWithProvider(
      <AssetPickerModal {...props} />,
      store,
    );
    const modalTitle = getByText('Select a token');
    const searchPlaceholder = getByPlaceholderText('Search token or NFT');

    expect(modalTitle).toBeInTheDocument();
    expect(searchPlaceholder).toBeInTheDocument();
  });
});
