/* eslint-disable jest/require-top-level-describe */
import { render, screen } from '@testing-library/react';
import React from 'react';

import BaseAvatar from './base-avatar';

describe('BaseAvatar', () => {
  it('should render correctly', () => {
    const size = 'md';
    render(<BaseAvatar size={size} />);

    const node = screen.getByTestId('base-avatar');

    expect(node).toBeInTheDocument();
    expect(node.classList.contains(`--size-${size}`)).toBe(true);
  });
});
