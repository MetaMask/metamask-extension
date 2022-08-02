/* eslint-disable jest/require-top-level-describe */
import { render } from '@testing-library/react';
import React from 'react';

import { BaseAvatar } from './base-avatar';

describe('BaseAvatar', () => {
  it('should render correctly', () => {
    const { getByTestId } = render(<BaseAvatar data-testid="base-avatar" />);
    expect(getByTestId('base-avatar')).toBeDefined();
  });
  it('should render with different size classes', () => {
    const { getByTestId } = render(
      <>
        <BaseAvatar size="xs" data-testid="base-avatar-xs" />
        <BaseAvatar size="sm" data-testid="base-avatar-sm" />
        <BaseAvatar size="md" data-testid="base-avatar-md" />
        <BaseAvatar size="lg" data-testid="base-avatar-lg" />
        <BaseAvatar size="xl" data-testid="base-avatar-xl" />
      </>,
    );
    expect(getByTestId('base-avatar-xs')).toHaveClass('base-avatar--size-xs');
    expect(getByTestId('base-avatar-sm')).toHaveClass('base-avatar--size-sm');
    expect(getByTestId('base-avatar-md')).toHaveClass('base-avatar--size-md');
    expect(getByTestId('base-avatar-lg')).toHaveClass('base-avatar--size-lg');
    expect(getByTestId('base-avatar-xl')).toHaveClass('base-avatar--size-xl');
  });
});
