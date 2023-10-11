import React from 'react';
import { fireEvent, waitFor } from '@testing-library/react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { useHistory } from 'react-router-dom';
import { renderWithProvider } from '../../../../test/jest/rendering';
import mockState from '../../../../test/data/mock-state.json';
import { DEFAULT_ROUTE } from '../../../helpers/constants/routes';
import {
  addNftVerifyOwnership,
  ignoreTokens,
  setNewNftAddedMessage,
  updateNftDropDownState,
} from '../../../store/actions';
import { ImportNftsModal } from '.';

const VALID_ADDRESS = '0x312BE6a98441F9F6e3F6246B13CA19701e0AC3B9';
const INVALID_ADDRESS = 'aoinsafasdfa';
const VALID_TOKENID = '1201';
const INVALID_TOKENID = 'abcde';

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useHistory: jest.fn(
    jest.fn().mockReturnValue({
      push: jest.fn(),
    }),
  ),
}));

jest.mock('../../../store/actions.ts', () => ({
  addNftVerifyOwnership: jest
    .fn()
    .mockReturnValue(jest.fn().mockResolvedValue()),
  getTokenStandardAndDetails: jest.fn().mockResolvedValue(),
  ignoreTokens: jest.fn().mockReturnValue(jest.fn().mockResolvedValue()),
  setNewNftAddedMessage: jest
    .fn()
    .mockReturnValue(jest.fn().mockResolvedValue()),
  updateNftDropDownState: jest
    .fn()
    .mockReturnValue(jest.fn().mockResolvedValue()),
}));

describe('ImportNftsModal', () => {
  let store = configureMockStore([thunk])(mockState);

  beforeEach(() => {
    jest.restoreAllMocks();
  });

  it('should enable the "Import" button when valid entries are input into both Address and TokenId fields', () => {
    const { getByText, getByPlaceholderText } = renderWithProvider(
      <ImportNftsModal />,
      store,
    );
    expect(getByText('Import')).not.toBeEnabled();
    const addressInput = getByPlaceholderText('0x...');
    const tokenIdInput = getByPlaceholderText('Enter the token id');
    fireEvent.change(addressInput, {
      target: { value: VALID_ADDRESS },
    });
    fireEvent.change(tokenIdInput, {
      target: { value: VALID_TOKENID },
    });
    expect(getByText('Import')).toBeEnabled();
  });

  it('should not enable the "Import" button when an invalid entry is input into one or both Address and TokenId fields', () => {
    const { getByText, getByPlaceholderText } = renderWithProvider(
      <ImportNftsModal />,
      store,
    );
    expect(getByText('Import')).not.toBeEnabled();
    const addressInput = getByPlaceholderText('0x...');
    const tokenIdInput = getByPlaceholderText('Enter the token id');
    fireEvent.change(addressInput, {
      target: { value: INVALID_ADDRESS },
    });
    fireEvent.change(tokenIdInput, {
      target: { value: VALID_TOKENID },
    });
    expect(getByText('Import')).not.toBeEnabled();
    fireEvent.change(addressInput, {
      target: { value: VALID_ADDRESS },
    });
    expect(getByText('Import')).toBeEnabled();
    fireEvent.change(tokenIdInput, {
      target: { value: INVALID_TOKENID },
    });
    expect(getByText('Import')).not.toBeEnabled();
  });

  it('should call addNftVerifyOwnership, updateNftDropDownState, setNewNftAddedMessage, and ignoreTokens action with correct values (tokenId should not be in scientific notation)', async () => {
    store = configureMockStore([thunk])({
      ...mockState,
      appState: { importNftsModal: { ignoreErc20Token: true } },
    });

    const onClose = jest.fn();
    const { getByPlaceholderText, getByText } = renderWithProvider(
      <ImportNftsModal onClose={onClose} />,
      store,
    );
    const addressInput = getByPlaceholderText('0x...');
    const tokenIdInput = getByPlaceholderText('Enter the token id');
    fireEvent.change(addressInput, {
      target: { value: VALID_ADDRESS },
    });
    const LARGE_TOKEN_ID = Number.MAX_SAFE_INTEGER + 1;
    fireEvent.change(tokenIdInput, {
      target: { value: LARGE_TOKEN_ID },
    });

    fireEvent.click(getByText('Import'));

    await waitFor(() => {
      expect(addNftVerifyOwnership).toHaveBeenCalledWith(
        '0x312BE6a98441F9F6e3F6246B13CA19701e0AC3B9',
        '9007199254740992',
      );

      expect(updateNftDropDownState).toHaveBeenCalledWith({
        '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc': {
          '0x5': {
            '0x312BE6a98441F9F6e3F6246B13CA19701e0AC3B9': true,
            '0x495f947276749Ce646f68AC8c248420045cb7b5e': false,
          },
        },
      });

      expect(setNewNftAddedMessage).toHaveBeenCalledWith('success');

      expect(ignoreTokens).toHaveBeenCalledWith({
        dontShowLoadingIndicator: true,
        tokensToIgnore: VALID_ADDRESS,
      });
    });
  });

  it('should throw error message and click close on failure message', async () => {
    addNftVerifyOwnership.mockImplementation(() =>
      jest.fn().mockRejectedValue(new Error('error')),
    );

    const { getByTestId, getByText, getByPlaceholderText } = renderWithProvider(
      <ImportNftsModal />,
      store,
    );
    const addressInput = getByPlaceholderText('0x...');
    const tokenIdInput = getByPlaceholderText('Enter the token id');
    fireEvent.change(addressInput, {
      target: { value: VALID_ADDRESS },
    });
    const LARGE_TOKEN_ID = Number.MAX_SAFE_INTEGER + 1;
    fireEvent.change(tokenIdInput, {
      target: { value: LARGE_TOKEN_ID },
    });

    fireEvent.click(getByText('Import'));

    await waitFor(() => {
      expect(setNewNftAddedMessage).toHaveBeenCalledWith('error');
    });

    const addNftClose = getByTestId('add-nft-error-close');

    fireEvent.click(addNftClose);
  });

  it('should route to default route when cancel button is clicked', () => {
    const onClose = jest.fn();
    const { getByText } = renderWithProvider(
      <ImportNftsModal onClose={onClose} />,
      store,
    );

    const cancelButton = getByText('Cancel');
    fireEvent.click(cancelButton);

    expect(useHistory().push).toHaveBeenCalledWith(DEFAULT_ROUTE);
  });

  it('should route to default route when close button is clicked', () => {
    const onClose = jest.fn();
    renderWithProvider(<ImportNftsModal onClose={onClose} />, store);

    fireEvent.click(document.querySelector('button[aria-label="Close"]'));

    expect(useHistory().push).toHaveBeenCalledWith(DEFAULT_ROUTE);
  });

  it('should set error message when address invalid', () => {
    const onClose = jest.fn();
    const { getByText, getByPlaceholderText } = renderWithProvider(
      <ImportNftsModal onClose={onClose} />,
      store,
    );

    const addressInput = getByPlaceholderText('0x...');
    fireEvent.change(addressInput, {
      target: { value: INVALID_ADDRESS },
    });

    const errorMessage = getByText('Invalid address');
    expect(errorMessage).toBeInTheDocument();
  });
});
