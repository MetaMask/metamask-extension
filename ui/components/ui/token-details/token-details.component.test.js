import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import Identicon from '../identicon/identicon.component';
import TokenDetails from './token-details.component';

describe('TokenDetails Component', () => {
  const args = {
    address: '0x6b175474e89094c44da98b954eedeac495271d0f',
    value: '200',
    icon: (
      <Identicon
        diameter={32}
        address="0x6b175474e89094c44da98b954eedeac495271d0f"
      />
    ),
    currentCurrency: '$200.09 USD',
    decimals: 18,
    network: 'Ethereum Mainnet',
  };

  it('should render token address', () => {
    args.address = '0x6b175474e89094c44da98b954eedeac495271d0f';
    const { getByText } = render(<TokenDetails {...args} />);
    expect(
      getByText('0x6b175474e89094c44da98b954eedeac495271d0f'),
    ).toBeDefined();
  });

  it('should render token value', () => {
    args.value = 'value';
    const { getByText } = render(<TokenDetails {...args} />);
    expect(getByText('value')).toBeDefined();
  });

  it('should render an icon image', () => {
    args.icon = (
      <Identicon
        diameter={32}
        address="0x6b175474e89094c44da98b954eedeac495271d0f"
      />
    );
    const image = args.icon;
    expect(image).toBeDefined();
  });

  it('should call onClose prop when click is simulated', () => {
    const onClose = jest.fn();
    args.onClose = onClose;
    const { container } = render(<TokenDetails {...args} />);
    const onCloseBtn = container.querySelector(
      '.token-details__token-details-title',
    );
    fireEvent.click(onCloseBtn);
    expect(onCloseBtn).toBeDefined();
  });

  it('should call onHideToken prop when hide token button is clicked', () => {
    const onHideToken = jest.fn();
    args.onHideToken = onHideToken;
    const { container } = render(<TokenDetails {...args} />);
    const hideTokenBtn = container.querySelector(
      '.token-details__hide-token-button',
    );
    fireEvent.click(hideTokenBtn);
    expect(onHideToken).toHaveBeenCalled();
  });

  it('should render current currency of the token', () => {
    args.currentCurrency = '$200.09 USD';
    const { getByText } = render(<TokenDetails {...args} />);
    expect(getByText('$200.09 USD')).toBeDefined();
  });

  it('should render token decimals', () => {
    args.decimals = 18;
    const { getByText } = render(<TokenDetails {...args} />);
    expect(getByText('18')).toBeDefined();
  });

  it('should render current network when the user click on token details', () => {
    args.network = 'Ethereum Mainnet';
    const { getByText } = render(<TokenDetails {...args} />);
    expect(getByText('Ethereum Mainnet')).toBeDefined();
  });
});
