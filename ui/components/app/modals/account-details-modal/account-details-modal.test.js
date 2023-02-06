import React from 'react';
import configureMockState from 'redux-mock-store';
import { fireEvent } from '@testing-library/react';
import thunk from 'redux-thunk';
import { renderWithProvider } from '../../../../../test/lib/render-helpers';
import mockState from '../../../../../test/data/mock-state.json';
import {
  etherscanViewOn,
  exportPrivateKey,
} from '../../../../../app/_locales/en/messages.json';
import AccountDetailsModal from '.';

const mockShowModal = jest.fn();

jest.mock('../../../../store/actions.ts', () => {
  return {
    showModal: () => mockShowModal,
  };
});

describe('Account Details Modal', () => {
  const mockStore = configureMockState([thunk])(mockState);

  global.platform = { openTab: jest.fn() };

  it('should set account label when changing default account label', () => {
    const { queryByTestId } = renderWithProvider(
      <AccountDetailsModal />,
      mockStore,
    );

    const editButton = queryByTestId('editable-label-button');

    expect(queryByTestId('editable-input')).not.toBeInTheDocument();
    fireEvent.click(editButton);
    expect(queryByTestId('editable-input')).toBeInTheDocument();

    const editableInput = queryByTestId('editable-input');
    const newAccountLabel = 'New Label';

    fireEvent.change(editableInput, {
      target: { value: newAccountLabel },
    });

    expect(editableInput).toHaveAttribute('value', newAccountLabel);
  });

  it('opens new tab when view block explorer is clicked', () => {
    const { queryByText } = renderWithProvider(
      <AccountDetailsModal />,
      mockStore,
    );

    const viewOnEtherscan = queryByText(etherscanViewOn.message);

    fireEvent.click(viewOnEtherscan);

    expect(global.platform.openTab).toHaveBeenCalled();
  });

  it('shows export private key modal when clicked', () => {
    const { queryByText } = renderWithProvider(
      <AccountDetailsModal />,
      mockStore,
    );

    const exportPrivButton = queryByText(exportPrivateKey.message);

    fireEvent.click(exportPrivButton);

    expect(mockShowModal).toHaveBeenCalled();
  });

  it('sets blockexplorerview text when block explorer url in rpcPrefs exists', () => {
    const blockExplorerUrl = 'https://block.explorer';

    const customProviderMockState = {
      ...mockState,
      metamask: {
        ...mockState.metamask,
        frequentRpcListDetail: [
          {
            chainId: '0x99',
            rpcPrefs: {
              blockExplorerUrl,
            },
          },
        ],
        provider: {
          chainId: '0x99',
        },
      },
    };

    const customProviderMockStore = configureMockState([thunk])(
      customProviderMockState,
    );

    const { queryByText } = renderWithProvider(
      <AccountDetailsModal />,
      customProviderMockStore,
    );

    expect(queryByText(/block.explorer/u)).toBeInTheDocument();
  });
});
