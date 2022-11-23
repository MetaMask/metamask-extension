/* eslint-disable jest/require-top-level-describe */
import { render, screen } from '@testing-library/react';
import React from 'react';

import { COLORS } from '../../../helpers/constants/design-system';

import { AvatarToken } from './avatar-token';

describe('AvatarToken', () => {
  const args = {
    name: 'ast',
    src: './AST.png',
    showHalo: false,
  };

  it('should render correctly', () => {
    const { getByTestId, container } = render(
      <AvatarToken data-testid="avatar-token" />,
    );
    expect(getByTestId('avatar-token')).toBeDefined();
    expect(container).toMatchSnapshot();
  });

  it('should render image Avatar', () => {
    render(<AvatarToken {...args} data-testid="avatar-token" />);
    const image = screen.getByRole('img');
    expect(image).toBeDefined();
    expect(image).toHaveAttribute('src', args.src);
  });

  it('should render the first letter of the name prop if no src is provided', () => {
    const { getByText } = render(
      <AvatarToken {...args} data-testid="avatar-token" src="" />,
    );
    expect(getByText('a')).toBeDefined();
  });

  it('should render halo effect if showHalo is true and image url is there', () => {
    render(<AvatarToken {...args} data-testid="avatar-token" showHalo />);
    const image = screen.getAllByRole('img', { hidden: true });
    expect(image[1]).toHaveClass('mm-avatar-token__token-image--size-reduced');
  });

  it('should render the first letter of the name prop when showHalo is true and no image url is provided', () => {
    const { getByText } = render(
      <AvatarToken {...args} src="" data-testid="avatar-token" showHalo />,
    );
    expect(getByText('a')).toBeDefined();
  });
  // className
  it('should render with custom className', () => {
    const { getByTestId } = render(
      <AvatarToken data-testid="avatar-base" className="test-class" />,
    );
    expect(getByTestId('avatar-base')).toHaveClass('test-class');
  });
  // color
  it('should render with different colors', () => {
    const { getByTestId } = render(
      <>
        <AvatarToken
          color={COLORS.SUCCESS_DEFAULT}
          data-testid={COLORS.SUCCESS_DEFAULT}
        />
        <AvatarToken
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
        <AvatarToken
          backgroundColor={COLORS.SUCCESS_DEFAULT}
          data-testid={COLORS.SUCCESS_DEFAULT}
        />
        <AvatarToken
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
        <AvatarToken
          borderColor={COLORS.SUCCESS_DEFAULT}
          data-testid={COLORS.SUCCESS_DEFAULT}
        />
        <AvatarToken
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
