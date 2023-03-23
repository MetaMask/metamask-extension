/* eslint-disable jest/require-top-level-describe */
import { render, screen } from '@testing-library/react';
import React from 'react';

import {
  BackgroundColor,
  BorderColor,
  TextColor,
} from '../../../helpers/constants/design-system';

import { AvatarToken } from './avatar-token';

describe('AvatarToken', () => {
  const args = {
    name: 'ast',
    src: './AST.png',
    showHalo: false,
  };

  it('should render correctly', () => {
    const { getByTestId, container } = render(
      <AvatarToken {...args} data-testid="avatar-token" />,
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
      <AvatarToken data-testid="avatar-token" className="test-class" />,
    );
    expect(getByTestId('avatar-token')).toHaveClass('test-class');
  });
  // color
  it('should render with different colors', () => {
    const { getByTestId } = render(
      <>
        <AvatarToken
          color={TextColor.successDefault}
          data-testid={TextColor.successDefault}
        />
        <AvatarToken
          color={TextColor.errorDefault}
          data-testid={TextColor.errorDefault}
        />
      </>,
    );
    expect(getByTestId(TextColor.successDefault)).toHaveClass(
      `box--color-${TextColor.successDefault}`,
    );
    expect(getByTestId(TextColor.errorDefault)).toHaveClass(
      `box--color-${TextColor.errorDefault}`,
    );
  });
  // background color
  it('should render with different background colors', () => {
    const { getByTestId } = render(
      <>
        <AvatarToken
          backgroundColor={BackgroundColor.successDefault}
          data-testid={BackgroundColor.successDefault}
        />
        <AvatarToken
          backgroundColor={BackgroundColor.errorDefault}
          data-testid={BackgroundColor.errorDefault}
        />
      </>,
    );
    expect(getByTestId(BackgroundColor.successDefault)).toHaveClass(
      `box--background-color-${BackgroundColor.successDefault}`,
    );
    expect(getByTestId(BackgroundColor.errorDefault)).toHaveClass(
      `box--background-color-${BackgroundColor.errorDefault}`,
    );
  });
  // border color
  it('should render with different border BorderColor', () => {
    const { getByTestId } = render(
      <>
        <AvatarToken
          borderColor={BorderColor.successDefault}
          data-testid={BorderColor.successDefault}
        />
        <AvatarToken
          borderColor={BorderColor.errorDefault}
          data-testid={BorderColor.errorDefault}
        />
      </>,
    );
    expect(getByTestId(BorderColor.successDefault)).toHaveClass(
      `box--border-color-${BorderColor.successDefault}`,
    );
    expect(getByTestId(BorderColor.errorDefault)).toHaveClass(
      `box--border-color-${BorderColor.errorDefault}`,
    );
  });
});
