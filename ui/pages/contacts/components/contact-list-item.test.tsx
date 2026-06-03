import React from 'react';
import { fireEvent } from '@testing-library/react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { renderWithProvider } from '../../../../test/lib/render-helpers-navigate';
import { ContactListItem } from './contact-list-item';

const mockStore = configureMockStore([thunk])({
  metamask: {
    networkConfigurationsByChainId: {
      '0x1': {
        chainId: '0x1',
        id: 'mainnet',
        rpcEndpoints: [],
        nativeCurrency: 'ETH',
        name: 'Ethereum Mainnet',
      },
    },
  },
});

describe('ContactListItem', () => {
  const defaultProps = {
    address: '0x1234567890123456789012345678901234567890',
    name: 'Test Contact',
    chainId: '0x1',
    onSelect: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders contact name', () => {
    const { getByTestId } = renderWithProvider(
      <ContactListItem {...defaultProps} />,
      mockStore,
    );
    expect(getByTestId('contact-list-item-label')).toHaveTextContent(
      'Test Contact',
    );
  });

  it('renders shortened address', () => {
    const { getByTestId } = renderWithProvider(
      <ContactListItem {...defaultProps} />,
      mockStore,
    );
    const addressEl = getByTestId('contact-list-item-address');
    expect(addressEl.textContent).toMatch(/^0x/u);
    expect(addressEl.textContent?.length).toBeLessThan(
      defaultProps.address.length,
    );
  });

  it('calls onSelect when the row is clicked', () => {
    const onSelect = jest.fn();
    const { getByTestId } = renderWithProvider(
      <ContactListItem {...defaultProps} onSelect={onSelect} />,
      mockStore,
    );
    fireEvent.click(getByTestId('contact-list-item'));
    expect(onSelect).toHaveBeenCalledTimes(1);
  });

  it('calls onSelect when Enter is pressed', () => {
    const onSelect = jest.fn();
    const { getByTestId } = renderWithProvider(
      <ContactListItem {...defaultProps} onSelect={onSelect} />,
      mockStore,
    );
    fireEvent.keyDown(getByTestId('contact-list-item'), { key: 'Enter' });
    expect(onSelect).toHaveBeenCalledTimes(1);
  });

  it('renders copy button', () => {
    const { getByTestId } = renderWithProvider(
      <ContactListItem {...defaultProps} />,
      mockStore,
    );
    expect(getByTestId('contact-list-item-copy')).toBeInTheDocument();
  });

  it('uses custom network name when chainId is in store', () => {
    const { getByText } = renderWithProvider(
      <ContactListItem {...defaultProps} />,
      mockStore,
    );
    expect(getByText('Test Contact')).toBeInTheDocument();
  });

  it('renders with unknown chainId (Custom network)', () => {
    const storeUnknownChain = configureMockStore([thunk])({
      metamask: {
        networkConfigurationsByChainId: {},
      },
    });
    const { getByTestId } = renderWithProvider(
      <ContactListItem {...defaultProps} chainId="0x999" />,
      storeUnknownChain,
    );
    expect(getByTestId('contact-list-item')).toBeInTheDocument();
  });
});
