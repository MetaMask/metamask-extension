/* eslint-disable jest/require-top-level-describe */
import { render, screen } from '@testing-library/react';
import React from 'react';

import { AvatarNetwork } from './avatar-network';

describe('AvatarNetwork', () => {
  const args = {
    networkName: 'ethereum',
    networkImageUrl: './images/eth_logo.svg',
    showHalo: false,
  };

  it('should render correctly', () => {
    const { getByTestId } = render(
      <AvatarNetwork data-testid="avatar-network" />,
    );
    expect(getByTestId('avatar-network')).toBeDefined();
  });

  it('should render image of Avatar Network', () => {
    render(<AvatarNetwork data-testid="avatar-network" {...args} />);
    const image = screen.getByRole('img');
    expect(image).toBeDefined();
    expect(image).toHaveAttribute('src', args.networkImageUrl);
  });

  it('should render the first letter of the tokenName prop if no tokenImageUrl is provided', () => {
    const { getByText } = render(
      <AvatarNetwork
        data-testid="avatar-network"
        {...args}
        networkImageUrl=""
      />,
    );
    expect(getByText('E')).toBeDefined();
  });

  it('should render halo effect if showHalo is true and image url is there', () => {
    render(<AvatarNetwork data-testid="avatar-network" {...args} showHalo />);
    const image = screen.getAllByRole('img', { hidden: true });
    expect(image[1]).toHaveClass('avatar-network __token-image--halo');
  });
  it('should render text showHalo is true and no image url is provided', () => {
    const { getByText } = render(
      <AvatarNetwork
        {...args}
        tokenImageUrl=""
        data-testid="avatar-network"
        showHalo
      />,
    );
    expect(getByText('E')).toBeDefined();
  });
});
