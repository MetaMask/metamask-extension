/* eslint-disable jest/require-top-level-describe */
import { render, screen } from '@testing-library/react';
import React from 'react';

import { AvatarToken } from './avatar-token';

describe('AvatarToken', () => {
  const args = {
    tokenName: 'ast',
    tokenImageUrl: './AST.png',
    showHalo: false,
  };

  it('should render correctly', () => {
    const { getByTestId } = render(<AvatarToken data-testid="avatar-token" />);
    expect(getByTestId('avatar-token')).toBeDefined();
  });

  it('should render image Avatar', () => {
    render(<AvatarToken {...args} data-testid="avatar-token" />);
    const image = screen.getByRole('img');
    expect(image).toBeDefined();
    expect(image).toHaveAttribute('src', args.tokenImageUrl);
  });

  it('should render the first letter of the tokenName prop if no tokenImageUrl is provided', () => {
    const { getByText } = render(
      <AvatarToken {...args} data-testid="avatar-token" tokenImageUrl="" />,
    );
    expect(getByText('a')).toBeDefined();
  });

  it('should render halo effect if showHalo is true and image url is there', () => {
    render(<AvatarToken {...args} data-testid="avatar-token" showHalo />);
    const image = screen.getAllByRole('img', { hidden: true });
    expect(image[1]).toHaveClass('avatar-token__token-image--size-reduced');
  });

  it('should render the first letter of the tokenName prop when showHalo is true and no image url is provided', () => {
    const { getByText } = render(
      <AvatarToken
        {...args}
        tokenImageUrl=""
        data-testid="avatar-token"
        showHalo
      />,
    );
    expect(getByText('a')).toBeDefined();
  });
});
