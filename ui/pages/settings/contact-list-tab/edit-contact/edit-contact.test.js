import React from 'react';
import { fireEvent } from '@testing-library/react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { renderWithProvider } from '../../../../../test/lib/render-helpers';
import '@testing-library/jest-dom/extend-expect';
import EditContact from './edit-contact.component';

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
    addToAddressBook: jest.fn(),
    removeFromAddressBook: jest.fn(),
    history: { push: jest.fn() },
    name: '',
    address: '0x0000000000000000001',
    chainId: '',
    memo: '',
    viewRoute: '',
    listRoute: '',
  };

  it('should render the component with correct properties', () => {
    const store = configureMockStore(middleware)(state);

    const { getByText } = renderWithProvider(<EditContact {...props} />, store);

    expect(getByText('Username')).toBeInTheDocument();
    expect(getByText('Ethereum public address')).toBeInTheDocument();
  });

  it('should validate the address correctly', () => {
    const store = configureMockStore(middleware)(state);
    const { getByText } = renderWithProvider(<EditContact {...props} />, store);

    const input = document.getElementById('address');
    fireEvent.change(input, { target: { value: 'invalid address' } });
    setTimeout(() => {
      expect(getByText('Invalid address')).toBeInTheDocument();
    }, 100);
  });

  it('should get disabled submit button when username field is empty', () => {
    const store = configureMockStore(middleware)(state);
    const { getByText } = renderWithProvider(<EditContact {...props} />, store);

    const input = document.getElementById('nickname');
    fireEvent.change(input, { target: { value: '' } });

    const saveButton = getByText('Save');
    expect(saveButton).toBeDisabled();
  });
});
