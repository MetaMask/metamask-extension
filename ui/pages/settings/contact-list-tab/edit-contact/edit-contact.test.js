import React from 'react';
import { fireEvent } from '@testing-library/react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { renderWithProvider } from '../../../../../test/lib/render-helpers-navigate';
import '@testing-library/jest-dom';
import { MOCK_ADDRESS_BOOK } from '../../../../../test/data/mock-data';
import { createMockInternalAccount } from '../../../../../test/jest/mocks';
import EditContact from './edit-contact.component';

describe('AddContact component', () => {
  const middleware = [thunk];
  const state = {
    metamask: {},
  };

  const mockAccount1 = createMockInternalAccount();
  const mockAccount2 = createMockInternalAccount({ name: 'Test Contact' });

  const props = {
    addressBook: MOCK_ADDRESS_BOOK,
    internalAccounts: [mockAccount1, mockAccount2],
    addToAddressBook: jest.fn(),
    removeFromAddressBook: jest.fn(),
    navigate: jest.fn(),
    name: mockAccount1.metadata.name,
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

    const addressInput = document.getElementById('address');
    fireEvent.change(addressInput, { target: { value: 'invalid address' } });

    const submitButton = getByText('Save');

    fireEvent.click(submitButton);

    expect(getByText('Invalid address')).toBeInTheDocument();
  });

  it('should get disabled submit button when username field is empty', () => {
    const store = configureMockStore(middleware)(state);
    const { getByText } = renderWithProvider(<EditContact {...props} />, store);

    const input = document.getElementById('nickname');
    fireEvent.change(input, { target: { value: '' } });

    const saveButton = getByText('Save');
    expect(saveButton).toBeDisabled();
  });

  it('should display error when entering a name that is in use by an existing contact', () => {
    const store = configureMockStore(middleware)(state);
    const { getByText } = renderWithProvider(<EditContact {...props} />, store);

    const input = document.getElementById('nickname');
    fireEvent.change(input, { target: { value: MOCK_ADDRESS_BOOK[0].name } });

    const saveButton = getByText('Save');

    expect(saveButton).toBeDisabled();
    expect(getByText('Name is already in use')).toBeDefined();
  });

  it('should display error when entering a name that is in use by an existing account', () => {
    const store = configureMockStore(middleware)(state);
    const { getByText } = renderWithProvider(<EditContact {...props} />, store);

    const input = document.getElementById('nickname');
    fireEvent.change(input, { target: { value: mockAccount2.metadata.name } });

    const saveButton = getByText('Save');

    expect(saveButton).toBeDisabled();
    expect(getByText('Name is already in use')).toBeDefined();
  });

  it('should not display error when entering the current contact name', () => {
    const store = configureMockStore(middleware)(state);
    const { getByText, queryByText } = renderWithProvider(
      <EditContact {...props} />,
      store,
    );

    const input = document.getElementById('nickname');
    fireEvent.change(input, { target: { value: mockAccount1.metadata.name } });

    const saveButton = getByText('Save');

    expect(saveButton).toBeDisabled();
    expect(queryByText('Name is already in use')).toBeNull();
  });
});
