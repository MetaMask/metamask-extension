import React from 'react';
import { fireEvent, waitFor } from '@testing-library/react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { renderWithProvider } from '../../../../../test/lib/render-helpers';
import '@testing-library/jest-dom/extend-expect';
import { mockNetworkState } from '../../../../../test/stub/networks';
import { CHAIN_IDS } from '../../../../../shared/constants/network';
import { domainInitialState } from '../../../../ducks/domains';
import { createMockInternalAccount } from '../../../../../test/jest/mocks';
import {
  MOCK_ADDRESS_BOOK,
  MOCK_DOMAIN_RESOLUTION,
} from '../../../../../test/data/mock-data';
import * as domainDucks from '../../../../ducks/domains';
import AddContact from './add-contact.component';

describe('AddContact component', () => {
  const middleware = [thunk];
  const state = {
    metamask: {
      ...mockNetworkState({ chainId: CHAIN_IDS.SEPOLIA }),
    },
  };
  const props = {
    addressBook: MOCK_ADDRESS_BOOK,
    internalAccounts: [createMockInternalAccount()],
    history: { push: jest.fn() },
    addToAddressBook: jest.fn(),
    scanQrCode: jest.fn(),
    qrCodeData: { type: 'address', values: { address: '0x123456789abcdef' } },
    qrCodeDetected: jest.fn(),
    domainResolutions: [MOCK_DOMAIN_RESOLUTION],
    domainError: '',
    resetDomainResolution: jest.fn(),
  };

  beforeEach(() => {
    jest.resetAllMocks();
    jest
      .spyOn(domainDucks, 'lookupDomainName')
      .mockImplementation(() => jest.fn());
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  it('should render the component with correct properties', () => {
    const store = configureMockStore(middleware)(state);

    const { getByText } = renderWithProvider(<AddContact {...props} />, store);

    expect(getByText('Username')).toBeInTheDocument();
    expect(getByText('Ethereum public address')).toBeInTheDocument();
  });

  it('should validate the address correctly', async () => {
    const store = configureMockStore(middleware)(state);
    const { getByText, getByTestId } = renderWithProvider(
      <AddContact {...props} />,
      store,
    );

    const input = getByTestId('ens-input');
    fireEvent.change(input, { target: { value: 'invalid address' } });

    await waitFor(() =>
      expect(getByText('Recipient address is invalid')).toBeInTheDocument(),
    );
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
    const testStore = {
      DNS: domainInitialState,
      metamask: state.metamask,
      snaps: {},
    };
    const store = configureMockStore(middleware)(testStore);
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
    const testStore = {
      DNS: domainInitialState,
      metamask: state.metamask,
      snaps: {},
    };
    const store = configureMockStore(middleware)(testStore);
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

  it('should disable the submit button when the name is an existing account name', () => {
    const duplicateName = 'Account 1';

    const store = configureMockStore(middleware)(state);
    const { getByText, getByTestId } = renderWithProvider(
      <AddContact {...props} />,
      store,
    );

    const nameInput = document.getElementById('nickname');
    fireEvent.change(nameInput, { target: { value: duplicateName } });

    const addressInput = getByTestId('ens-input');

    fireEvent.change(addressInput, {
      target: { value: '0x43c9159B6251f3E205B9113A023C8256cDD40D91' },
    });

    const saveButton = getByText('Save');
    expect(saveButton).toBeDisabled();
  });

  it('should disable the submit button when the name is an existing contact name', () => {
    const duplicateName = MOCK_ADDRESS_BOOK[0].name;

    const store = configureMockStore(middleware)(state);
    const { getByText, getByTestId } = renderWithProvider(
      <AddContact {...props} />,
      store,
    );

    const nameInput = document.getElementById('nickname');
    fireEvent.change(nameInput, { target: { value: duplicateName } });

    const addressInput = getByTestId('ens-input');

    fireEvent.change(addressInput, {
      target: { value: '0x43c9159B6251f3E205B9113A023C8256cDD40D91' },
    });

    const saveButton = getByText('Save');
    expect(saveButton).toBeDisabled();
  });

  it('should display error message when name entered is an existing account name', async () => {
    const duplicateName = 'Account 1';

    const store = configureMockStore(middleware)(state);

    const { getByText, findByText } = renderWithProvider(
      <AddContact {...props} />,
      store,
    );

    const nameInput = document.getElementById('nickname');

    fireEvent.change(nameInput, { target: { value: duplicateName } });

    const saveButton = getByText('Save');

    expect(await findByText('Name is already in use')).toBeDefined();
    expect(saveButton).toBeDisabled();
  });

  it('should display error message when name entered is an existing contact name', () => {
    const duplicateName = MOCK_ADDRESS_BOOK[0].name;

    const store = configureMockStore(middleware)(state);

    const { getByText } = renderWithProvider(<AddContact {...props} />, store);

    const nameInput = document.getElementById('nickname');

    fireEvent.change(nameInput, { target: { value: duplicateName } });

    const saveButton = getByText('Save');

    expect(getByText('Name is already in use')).toBeDefined();
    expect(saveButton).toBeDisabled();
  });

  it('should display error when ENS inserts a name that is already in use', async () => {
    const store = configureMockStore(middleware)(state);

    const { getByTestId, getByText, findByText } = renderWithProvider(
      <AddContact {...props} />,
      store,
    );

    const ensInput = getByTestId('ens-input');
    fireEvent.change(ensInput, { target: { value: 'example.eth' } });

    const domainResolutionCell = getByTestId(
      'multichain-send-page__recipient__item',
    );

    fireEvent.click(domainResolutionCell);

    const saveButton = getByText('Save');

    expect(await findByText('Name is already in use')).toBeDefined();
    expect(saveButton).toBeDisabled();
  });
});
