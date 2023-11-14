import React from 'react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { renderWithProvider } from '../../../../test/lib/render-helpers';
import TransactionStatusLabel from '.';

describe('TransactionStatusLabel Component', () => {
  const createMockStore = configureMockStore([thunk]);
  const mockState = {
    metamask: {
      custodyStatusMaps: {},
      identities: {},
      selectedAddress: 'fakeAddress',
    },
  };

  let store = createMockStore(mockState);
  it('should render CONFIRMED properly', () => {
    const confirmedProps = {
      status: 'confirmed',
      date: 'June 1',
    };

    const { container } = renderWithProvider(
      <TransactionStatusLabel {...confirmedProps} />,
      store,
    );

    expect(container).toMatchSnapshot();
  });

  it('should render PENDING properly when status is APPROVED', () => {
    const props = {
      status: 'approved',
      isEarliestNonce: true,
      error: { message: 'test-title' },
    };

    const { container } = renderWithProvider(
      <TransactionStatusLabel {...props} />,
      store,
    );

    expect(container).toMatchSnapshot();
  });

  it('should render PENDING properly', () => {
    const props = {
      date: 'June 1',
      status: 'submitted',
      isEarliestNonce: true,
    };

    const { container } = renderWithProvider(
      <TransactionStatusLabel {...props} />,
      store,
    );

    expect(container).toMatchSnapshot();
  });

  it('should render QUEUED properly', () => {
    const props = {
      status: 'queued',
    };

    const { container } = renderWithProvider(
      <TransactionStatusLabel {...props} />,
      store,
    );

    expect(container).toMatchSnapshot();
  });

  it('should render UNAPPROVED properly', () => {
    const props = {
      status: 'unapproved',
    };

    const { container } = renderWithProvider(
      <TransactionStatusLabel {...props} />,
      store,
    );

    expect(container).toMatchSnapshot();
  });

  it('should render statusText properly when is custodyStatusDisplayText is defined', () => {
    const props = {
      custodyStatusDisplayText: 'test',
    };

    const { getByText } = renderWithProvider(
      <TransactionStatusLabel {...props} />,
      store,
    );

    expect(getByText(props.custodyStatusDisplayText)).toBeVisible();
  });

  it('should display the correct status text and tooltip', () => {
    const mockShortText = 'Short Text Test';
    const mockLongText = 'Long Text Test';
    const props = {
      status: 'approved',
      custodyStatus: 'approved',
      custodyStatusDisplayText: 'Test',
    };
    const customMockStore = {
      metamask: {
        custodyStatusMaps: {
          jupiter: {
            approved: {
              shortText: mockShortText,
              longText: mockLongText,
            },
          },
        },
        selectedAddress: '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc',
        identities: {
          '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc': {
            address: '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc',
            name: 'Account 1',
          },
        },
        keyrings: [
          {
            type: 'Custody - Jupiter',
            accounts: ['0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc'],
          },
        ],
      },
    };

    store = createMockStore(customMockStore);

    const { getByText } = renderWithProvider(
      <TransactionStatusLabel {...props} />,
      store,
    );

    expect(getByText(props.custodyStatusDisplayText)).toBeVisible();
  });
  it('should display the error message when there is an error', () => {
    const mockShortText = 'Short Text Test';
    const mockLongText = 'Long Text Test';
    const props = {
      status: 'approved',
      custodyStatus: 'approved',
      error: { message: 'An error occurred' },
    };
    const customMockStore = {
      metamask: {
        custodyStatusMaps: {
          jupiter: {
            approved: {
              shortText: mockShortText,
              longText: mockLongText,
            },
          },
        },
        selectedAddress: '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc',
        identities: {
          '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc': {
            address: '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc',
            name: 'Account 1',
          },
        },
        keyrings: [
          {
            type: 'Custody - Jupiter',
            accounts: ['0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc'],
          },
        ],
      },
    };

    store = createMockStore(customMockStore);

    const { getByText } = renderWithProvider(
      <TransactionStatusLabel {...props} />,
      store,
    );

    expect(getByText('Error')).toBeVisible();
  });

  it('should display correctly the error message when there is an error and custodyStatus is aborted', () => {
    const mockShortText = 'Short Text Test';
    const mockLongText = 'Long Text Test';
    const props = {
      status: 'approved',
      custodyStatus: 'aborted',
      error: { message: 'An error occurred' },
      custodyStatusDisplayText: 'Test',
    };
    const customMockStore = {
      metamask: {
        custodyStatusMaps: {
          jupiter: {
            approved: {
              shortText: mockShortText,
              longText: mockLongText,
            },
          },
        },
        selectedAddress: '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc',
        identities: {
          '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc': {
            address: '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc',
            name: 'Account 1',
          },
        },
        keyrings: [
          {
            type: 'Custody - Jupiter',
            accounts: ['0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc'],
          },
        ],
      },
    };

    store = createMockStore(customMockStore);

    const { getByText } = renderWithProvider(
      <TransactionStatusLabel {...props} />,
      store,
    );

    expect(getByText(props.custodyStatusDisplayText)).toBeVisible();
  });
});
