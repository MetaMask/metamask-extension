/* eslint-disable jest/require-top-level-describe */
import { render } from '@testing-library/react';
import React from 'react';

import { IconName } from '..';
import {
  BackgroundColor,
  IconColor,
} from '../../../helpers/constants/design-system';
import { AvatarIcon, AvatarIconSize } from '.';

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
          size={AvatarIconSize.Xs}
          data-testid={AvatarIconSize.Xs}
        />
        <AvatarIcon
          iconName={IconName.SwapHorizontal}
          size={AvatarIconSize.Sm}
          data-testid={AvatarIconSize.Sm}
        />
        <AvatarIcon
          iconName={IconName.SwapHorizontal}
          size={AvatarIconSize.Md}
          data-testid={AvatarIconSize.Md}
        />
        <AvatarIcon
          iconName={IconName.SwapHorizontal}
          size={AvatarIconSize.Lg}
          data-testid={AvatarIconSize.Lg}
        />
        <AvatarIcon
          iconName={IconName.SwapHorizontal}
          size={AvatarIconSize.Xl}
          data-testid={AvatarIconSize.Xl}
        />
      </>,
    );
    expect(getByTestId(AvatarIconSize.Xs)).toHaveClass(
      `mm-avatar-base--size-${AvatarIconSize.Xs}`,
    );
    expect(getByTestId(AvatarIconSize.Sm)).toHaveClass(
      `mm-avatar-base--size-${AvatarIconSize.Sm}`,
    );
    expect(getByTestId(AvatarIconSize.Md)).toHaveClass(
      `mm-avatar-base--size-${AvatarIconSize.Md}`,
    );
    expect(getByTestId(AvatarIconSize.Lg)).toHaveClass(
      `mm-avatar-base--size-${AvatarIconSize.Lg}`,
    );
    expect(getByTestId(AvatarIconSize.Xl)).toHaveClass(
      `mm-avatar-base--size-${AvatarIconSize.Xl}`,
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

    expect(getByTestId('success')).toHaveClass('mm-box--color-success-default');
    expect(getByTestId('success')).toHaveClass(
      'mm-box--background-color-success-muted',
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
