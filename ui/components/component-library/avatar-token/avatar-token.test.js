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
    render(<AvatarToken {...args} />);
    const image = screen.getByRole('img');
    expect(image).toBeDefined();
    expect(image).toHaveAttribute('src', args.tokenImageUrl);
  });

  it('should render Avatar Name Initial if no tokenImageUrl is provided', () => {
    const { getByText } = render(<AvatarToken {...args} tokenImageUrl="" />);
    expect(getByText('A')).toBeDefined();
  });

  it('should render halo effect if showHalo is true and image url is there', () => {
    render(<AvatarToken {...args} showHalo />);
    const image = screen.getAllByRole('img', { hidden: true });
    expect(image[1]).toHaveClass('blur-halo-image');
  });
});
