import React from 'react';
import { fireEvent } from '@testing-library/react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { renderWithProvider } from '../../../../../test/lib/render-helpers';
import '@testing-library/jest-dom/extend-expect';
import { mockNetworkState } from '../../../../../test/stub/networks';
import { CHAIN_IDS } from '../../../../../shared/constants/network';
import AddContact from './add-contact.component';

describe('AddContact component', () => {
  const middleware = [thunk];
  const state = {
    metamask: {
      ...mockNetworkState({ chainId: CHAIN_IDS.SEPOLIA }),
    },
  };
  const props = {
    history: { push: jest.fn() },
    addToAddressBook: jest.fn(),
    scanQrCode: jest.fn(),
    qrCodeData: { type: 'address', values: { address: '0x123456789abcdef' } },
    qrCodeDetected: jest.fn(),
    domainResolution: '',
    domainError: '',
    resetDomainResolution: jest.fn(),
  };

  it('should render the component with correct properties', () => {
    const store = configureMockStore(middleware)(state);

    const { getByText } = renderWithProvider(<AddContact {...props} />, store);

    expect(getByText('Username')).toBeInTheDocument();
    expect(getByText('Ethereum public address')).toBeInTheDocument();
  });

  it('should validate the address correctly', () => {
    const store = configureMockStore(middleware)(state);
    const { getByText, getByTestId } = renderWithProvider(
      <AddContact {...props} />,
      store,
    );

    const input = getByTestId('ens-input');
    fireEvent.change(input, { target: { value: 'invalid address' } });
    setTimeout(() => {
      expect(getByText('Recipient address is invalid')).toBeInTheDocument();
    }, 600);
  });

  it('should get disabled submit button when username field is empty', () => {
    const store = configureMockStore(middleware)(state);
    const { getByText } = renderWithProvider(<AddContact {...props} />, store);

    const input = document.getElementById('nickname');
    fireEvent.change(input, { target: { value: '' } });

    const saveButton = getByText('Save');
    expect(saveButton).toBeDisabled();
  });

  it('should enable submit button when input is valid', () => {
    const store = configureMockStore(middleware)(state);
    const { getByText, getByTestId } = renderWithProvider(
      <AddContact {...props} />,
      store,
    );

    const nameInput = document.getElementById('nickname');
    fireEvent.change(nameInput, { target: { value: 'friend' } });

    const addressInput = getByTestId('ens-input');
    fireEvent.change(addressInput, {
      target: { value: '0x1234Bf0BBa69C63E2657cF94693cC4A907085678' },
    });

    const saveButton = getByText('Save');
    expect(saveButton).not.toBeDisabled();
  });

  it('should disable submit button when input is not a valid address', () => {
    const store = configureMockStore(middleware)(state);
    const { getByText, getByTestId } = renderWithProvider(
      <AddContact {...props} />,
      store,
    );

    const nameInput = document.getElementById('nickname');
    fireEvent.change(nameInput, { target: { value: 'friend' } });

    const addressInput = getByTestId('ens-input');
    fireEvent.change(addressInput, {
      // invalid length
      target: { value: '0x1234' },
    });
    expect(getByText('Save')).toBeDisabled();

    fireEvent.change(addressInput, {
      // wrong checksum
      target: { value: '0x1234bf0bba69C63E2657cF94693cC4A907085678' },
    });
    expect(getByText('Save')).toBeDisabled();
  });
});
