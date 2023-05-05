/* eslint-disable jest/require-top-level-describe */
import { render } from '@testing-library/react';
import React from 'react';

import { IconName } from '..';
import {
  BackgroundColor,
  IconColor,
} from '../../../helpers/constants/design-system';
import { AvatarBaseSize } from '../avatar-base/avatar-base.types';
import { AvatarIcon } from '.';

describe('AvatarIcon', () => {
  it('should render correctly', () => {
    const { getByTestId, container } = render(
      <AvatarIcon
        iconName={IconName.SwapHorizontal}
        data-testid="avatar-icon"
      />,
    );
    expect(getByTestId('avatar-icon')).toBeDefined();
    expect(container).toMatchSnapshot();
  });

  it('should render with different size classes', () => {
    const { getByTestId } = render(
      <>
        <AvatarIcon
          iconName={IconName.SwapHorizontal}
          size={AvatarBaseSize.Xs}
          data-testid={AvatarBaseSize.Xs}
        />
        <AvatarIcon
          iconName={IconName.SwapHorizontal}
          size={AvatarBaseSize.Sm}
          data-testid={AvatarBaseSize.Sm}
        />
        <AvatarIcon
          iconName={IconName.SwapHorizontal}
          size={AvatarBaseSize.Md}
          data-testid={AvatarBaseSize.Md}
        />
        <AvatarIcon
          iconName={IconName.SwapHorizontal}
          size={AvatarBaseSize.Lg}
          data-testid={AvatarBaseSize.Lg}
        />
        <AvatarIcon
          iconName={IconName.SwapHorizontal}
          size={AvatarBaseSize.Xl}
          data-testid={AvatarBaseSize.Xl}
        />
      </>,
    );
    expect(getByTestId(AvatarBaseSize.Xs)).toHaveClass(
      `mm-avatar-base--size-${AvatarBaseSize.Xs}`,
    );
    expect(getByTestId(AvatarBaseSize.Sm)).toHaveClass(
      `mm-avatar-base--size-${AvatarBaseSize.Sm}`,
    );
    expect(getByTestId(AvatarBaseSize.Md)).toHaveClass(
      `mm-avatar-base--size-${AvatarBaseSize.Md}`,
    );
    expect(getByTestId(AvatarBaseSize.Lg)).toHaveClass(
      `mm-avatar-base--size-${AvatarBaseSize.Lg}`,
    );
    expect(getByTestId(AvatarBaseSize.Xl)).toHaveClass(
      `mm-avatar-base--size-${AvatarBaseSize.Xl}`,
    );
  });

  it('should render with added classname', () => {
    const { getByTestId } = render(
      <AvatarIcon
        iconName={IconName.SwapHorizontal}
        className="mm-avatar-icon--test"
        data-testid="classname"
      />,
    );
    expect(getByTestId('classname')).toHaveClass('mm-avatar-icon--test');
  });

  it('should render with icon', () => {
    const { getByTestId } = render(
      <AvatarIcon
        iconName={IconName.SwapHorizontal}
        iconProps={{ 'data-testid': 'avatar-icon' }}
      />,
    );

    expect(getByTestId('avatar-icon')).toBeDefined();
  });

  it('should render with success color icon and background color', () => {
    const { getByTestId } = render(
      <AvatarIcon
        iconName={IconName.SwapHorizontal}
        color={IconColor.successDefault}
        backgroundColor={BackgroundColor.successMuted}
        data-testid="success"
      />,
    );

    expect(getByTestId('success')).toHaveClass('box--color-success-default');
    expect(getByTestId('success')).toHaveClass(
      'box--background-color-success-muted',
    );
  });
  it('should forward a ref to the root html element', () => {
    const ref = React.createRef<HTMLDivElement>();
    render(<AvatarIcon iconName={IconName.SwapHorizontal} ref={ref} />);
    expect(ref.current).not.toBeNull();
    if (ref.current) {
      expect(ref.current.nodeName).toBe('DIV');
    }
  });
});
