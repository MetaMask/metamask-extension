/* eslint-disable jest/require-top-level-describe */
import { render } from '@testing-library/react';
import React from 'react';
import { AvatarBadge } from './avatar-badge';

describe('AvatarBadge', () => {
  it('should render correctly', () => {
    const { getByTestId } = render(<AvatarBadge data-testid="avatar-badges" />);
    expect(getByTestId('avatar-badge')).toBeDefined();
  });
});
