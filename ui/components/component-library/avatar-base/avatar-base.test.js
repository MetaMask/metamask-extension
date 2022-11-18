/* eslint-disable jest/require-top-level-describe */
import { render } from '@testing-library/react';
import React from 'react';

import { AvatarBase } from './avatar-base';

describe('AvatarBase', () => {
  it('should render correctly', () => {
    const { getByTestId, container } = render(
      <AvatarBase data-testid="avatar-base" />,
    );
    expect(getByTestId('avatar-base')).toBeDefined();
    expect(container).toMatchSnapshot();
  });
  it('should render with different size classes', () => {
    const { getByTestId } = render(
      <>
        <AvatarBase size="xs" data-testid="avatar-base-xs" />
        <AvatarBase size="sm" data-testid="avatar-base-sm" />
        <AvatarBase size="md" data-testid="avatar-base-md" />
        <AvatarBase size="lg" data-testid="avatar-base-lg" />
        <AvatarBase size="xl" data-testid="avatar-base-xl" />
      </>,
    );
    expect(getByTestId('avatar-base-xs')).toHaveClass('avatar-base--size-xs');
    expect(getByTestId('avatar-base-sm')).toHaveClass('avatar-base--size-sm');
    expect(getByTestId('avatar-base-md')).toHaveClass('avatar-base--size-md');
    expect(getByTestId('avatar-base-lg')).toHaveClass('avatar-base--size-lg');
    expect(getByTestId('avatar-base-xl')).toHaveClass('avatar-base--size-xl');
  });
});
