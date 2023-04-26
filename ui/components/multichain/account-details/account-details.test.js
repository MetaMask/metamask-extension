import React from 'react';
import { screen, fireEvent } from '@testing-library/react';
import { renderWithProvider } from '../../../../test/jest';
import configureStore from '../../../store/store';
import mockState from '../../../../test/data/mock-state.json';
import { showPrivateKey } from '../../../../app/_locales/en/messages.json';
import { showModal, setAccountDetailsAddress } from '../../../store/actions';
import { AccountDetails } from '.';

jest.mock('../../../store/actions.ts');

describe('AccountDetails', () => {
  const address = '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc';
  const mockShowModal = jest.fn();
  const mockSetAccountDetailsAddress = jest.fn();

  beforeEach(() => {
    showModal.mockReturnValue(mockShowModal);
    setAccountDetailsAddress.mockReturnValue(mockSetAccountDetailsAddress);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  function render(props = {}) {
    const store = configureStore({
      metamask: {
        ...mockState.metamask,
      },
    });
    const allProps = { address, ...props };
    return renderWithProvider(<AccountDetails {...allProps} />, store);
  }

  it('should set account label when changing default account label', () => {
    render();

    const editButton = screen.getByTestId('editable-label-button');
    fireEvent.click(editButton);

    const editableInput = screen.getByTestId('editable-input');
    const newAccountLabel = 'New Label';

    fireEvent.change(editableInput, { target: { value: newAccountLabel } });

    expect(editableInput).toHaveAttribute('value', newAccountLabel);
  });

  it('shows export private key modal when clicked', () => {
    const { queryByText } = render();
    const exportPrivateKeyButton = queryByText(showPrivateKey.message);
    fireEvent.click(exportPrivateKeyButton);
    expect(mockShowModal).toHaveBeenCalled();
  });
});
