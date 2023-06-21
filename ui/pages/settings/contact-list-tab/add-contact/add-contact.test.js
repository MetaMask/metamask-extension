import React from 'react';
import { fireEvent } from '@testing-library/react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { renderWithProvider } from '../../../../../test/lib/render-helpers';
import '@testing-library/jest-dom/extend-expect';
import AddContact from './add-contact.component';

describe('AddContact component', () => {
  const middleware = [thunk];
  const state = {
    metamask: {
      providerConfig: {
        type: 'mainnet',
        nickname: '',
      },
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
    }, 100);
  });

  it('should get disabled submit button when username field is empty', () => {
    const store = configureMockStore(middleware)(state);
    const { getByText } = renderWithProvider(<AddContact {...props} />, store);

    const input = document.getElementById('nickname');
    fireEvent.change(input, { target: { value: '' } });

    const saveButton = getByText('Save');
    expect(saveButton).toBeDisabled();
  });
});
