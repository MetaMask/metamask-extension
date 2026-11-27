import React from 'react';
import { render } from '@testing-library/react';
import { AvatarTokenSize } from '@metamask/design-system-react';
import { TokenAvatar } from './token-avatar';

describe('TokenAvatar', () => {
  it('renders the token image and the network badge', () => {
    const { container } = render(
      <TokenAvatar
        name="ETH"
        src="https://example.com/eth.png"
        size={AvatarTokenSize.Xl}
        network={{ name: 'Ethereum', src: 'https://example.com/chain.png' }}
      />,
    );

    expect(container.querySelectorAll('img')).toHaveLength(2);
    expect(
      container.querySelector('img[src="https://example.com/eth.png"]'),
    ).not.toBeNull();
    expect(
      container.querySelector('img[src="https://example.com/chain.png"]'),
    ).not.toBeNull();
  });

  it('omits the network badge when no network is provided', () => {
    const { container } = render(
      <TokenAvatar name="ETH" src="https://example.com/eth.png" />,
    );

    expect(container.querySelectorAll('img')).toHaveLength(1);
  });

  it('applies the wrapper class name', () => {
    const { container } = render(
      <TokenAvatar name="ETH" className="shrink-0" />,
    );

    expect(container.querySelector('.shrink-0')).not.toBeNull();
  });
});
