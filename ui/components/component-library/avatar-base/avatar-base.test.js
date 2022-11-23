/* eslint-disable jest/require-top-level-describe */
import { render, screen } from '@testing-library/react';
import React from 'react';

import { COLORS } from '../../../helpers/constants/design-system';

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
    expect(getByTestId('avatar-base-xs')).toHaveClass(
      'mm-avatar-base--size-xs',
    );
    expect(getByTestId('avatar-base-sm')).toHaveClass(
      'mm-avatar-base--size-sm',
    );
    expect(getByTestId('avatar-base-md')).toHaveClass(
      'mm-avatar-base--size-md',
    );
    expect(getByTestId('avatar-base-lg')).toHaveClass(
      'mm-avatar-base--size-lg',
    );
    expect(getByTestId('avatar-base-xl')).toHaveClass(
      'mm-avatar-base--size-xl',
    );
  });
  // className
  it('should render with custom className', () => {
    const { getByTestId } = render(
      <AvatarBase data-testid="avatar-base" className="test-class" />,
    );
    expect(getByTestId('avatar-base')).toHaveClass('test-class');
  });
  // children
  it('should render children', () => {
    render(
      <AvatarBase data-testid="avatar-base">
        <img width="100%" src="./images/arbitrum.svg" />
      </AvatarBase>,
    );
    const image = screen.getByRole('img');
    expect(image).toBeDefined();
    expect(image).toHaveAttribute('src', './images/arbitrum.svg');
  });
  // color
  it('should render with different colors', () => {
    const { getByTestId } = render(
      <>
        <AvatarBase
          color={COLORS.SUCCESS_DEFAULT}
          data-testid={COLORS.SUCCESS_DEFAULT}
        />
        <AvatarBase
          color={COLORS.ERROR_DEFAULT}
          data-testid={COLORS.ERROR_DEFAULT}
        />
      </>,
    );
    expect(getByTestId(COLORS.SUCCESS_DEFAULT)).toHaveClass(
      `box--color-${COLORS.SUCCESS_DEFAULT}`,
    );
    expect(getByTestId(COLORS.ERROR_DEFAULT)).toHaveClass(
      `box--color-${COLORS.ERROR_DEFAULT}`,
    );
  });
  // background color
  it('should render with different background colors', () => {
    const { getByTestId } = render(
      <>
        <AvatarBase
          backgroundColor={COLORS.SUCCESS_DEFAULT}
          data-testid={COLORS.SUCCESS_DEFAULT}
        />
        <AvatarBase
          backgroundColor={COLORS.ERROR_DEFAULT}
          data-testid={COLORS.ERROR_DEFAULT}
        />
      </>,
    );
    expect(getByTestId(COLORS.SUCCESS_DEFAULT)).toHaveClass(
      `box--background-color-${COLORS.SUCCESS_DEFAULT}`,
    );
    expect(getByTestId(COLORS.ERROR_DEFAULT)).toHaveClass(
      `box--background-color-${COLORS.ERROR_DEFAULT}`,
    );
  });
  // border color
  it('should render with different border colors', () => {
    const { getByTestId } = render(
      <>
        <AvatarBase
          borderColor={COLORS.SUCCESS_DEFAULT}
          data-testid={COLORS.SUCCESS_DEFAULT}
        />
        <AvatarBase
          borderColor={COLORS.ERROR_DEFAULT}
          data-testid={COLORS.ERROR_DEFAULT}
        />
      </>,
    );
    expect(getByTestId(COLORS.SUCCESS_DEFAULT)).toHaveClass(
      `box--border-color-${COLORS.SUCCESS_DEFAULT}`,
    );
    expect(getByTestId(COLORS.ERROR_DEFAULT)).toHaveClass(
      `box--border-color-${COLORS.ERROR_DEFAULT}`,
    );
  });
});
