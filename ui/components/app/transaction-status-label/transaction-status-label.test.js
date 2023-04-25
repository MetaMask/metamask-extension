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

  const store = createMockStore(mockState);
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

  it('should render statusText properly when is MMI', () => {
    const props = {
      custodyStatusDisplayText: 'test',
    };

    const { getByText } = renderWithProvider(
      <TransactionStatusLabel {...props} />,
      store,
    );

    expect(getByText(props.custodyStatusDisplayText)).toBeVisible();
  });
});
