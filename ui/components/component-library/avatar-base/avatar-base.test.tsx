/* eslint-disable jest/require-top-level-describe */
import { render, screen } from '@testing-library/react';
import React from 'react';

import {
  BackgroundColor,
  BorderColor,
  Color,
  TextColor,
} from '../../../helpers/constants/design-system';

import { AvatarBase } from './avatar-base';
import { AvatarBaseSize } from './avatar-base.types';

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
        <AvatarBase size={AvatarBaseSize.Xs} data-testid="avatar-base-xs" />
        <AvatarBase size={AvatarBaseSize.Sm} data-testid="avatar-base-sm" />
        <AvatarBase size={AvatarBaseSize.Md} data-testid="avatar-base-md" />
        <AvatarBase size={AvatarBaseSize.Lg} data-testid="avatar-base-lg" />
        <AvatarBase size={AvatarBaseSize.Xl} data-testid="avatar-base-xl" />
      </>,
    );
    expect(getByTestId('avatar-base-xs')).toHaveClass(
      'mm-avatar-base--size-xs mm-text--body-xs',
    );
    expect(getByTestId('avatar-base-sm')).toHaveClass(
      'mm-avatar-base--size-sm  mm-text--body-sm',
    );
    expect(getByTestId('avatar-base-md')).toHaveClass(
      'mm-avatar-base--size-md  mm-text--body-sm',
    );
    expect(getByTestId('avatar-base-lg')).toHaveClass(
      'mm-avatar-base--size-lg mm-text--body-lg-medium',
    );
    expect(getByTestId('avatar-base-xl')).toHaveClass(
      'mm-avatar-base--size-xl mm-text--body-lg-medium',
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
          color={TextColor.successDefault}
          data-testid={TextColor.successDefault}
        />
        <AvatarBase
          color={TextColor.errorDefault}
          data-testid={TextColor.errorDefault}
        />
      </>,
    );
    expect(getByTestId(TextColor.successDefault)).toHaveClass(
      `mm-box--color-${TextColor.successDefault}`,
    );
    expect(getByTestId(TextColor.errorDefault)).toHaveClass(
      `mm-box--color-${TextColor.errorDefault}`,
    );
  });
  // background color
  it('should render with different background colors', () => {
    const { getByTestId } = render(
      <>
        <AvatarBase
          backgroundColor={BackgroundColor.successDefault}
          data-testid={Color.successDefault}
        />
        <AvatarBase
          backgroundColor={BackgroundColor.errorDefault}
          data-testid={Color.errorDefault}
        />
      </>,
    );
    expect(getByTestId(Color.successDefault)).toHaveClass(
      `mm-box--background-color-${Color.successDefault}`,
    );
    expect(getByTestId(Color.errorDefault)).toHaveClass(
      `mm-box--background-color-${Color.errorDefault}`,
    );
  });
  // border color
  it('should render with different border colors', () => {
    const { getByTestId } = render(
      <>
        <AvatarBase
          borderColor={BorderColor.successDefault}
          data-testid={Color.successDefault}
        />
        <AvatarBase
          borderColor={BorderColor.errorDefault}
          data-testid={Color.errorDefault}
        />
      </>,
    );
    expect(getByTestId(Color.successDefault)).toHaveClass(
      `mm-box--border-color-${Color.successDefault}`,
    );
    expect(getByTestId(Color.errorDefault)).toHaveClass(
      `mm-box--border-color-${Color.errorDefault}`,
    );
  });
  it('should forward a ref to the root html element', () => {
    const ref = React.createRef<HTMLSpanElement>();
    render(<AvatarBase ref={ref}>A</AvatarBase>);
    expect(ref.current).not.toBeNull();
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    expect(ref.current!.nodeName).toBe('DIV');
  });
});
