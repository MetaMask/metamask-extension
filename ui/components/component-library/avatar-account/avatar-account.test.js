/* eslint-disable jest/require-top-level-describe */
import { render } from '@testing-library/react';
import React from 'react';
import { AvatarAccount, AVATAR_ACCOUNT_SIZES } from '.';
import 'jest-canvas-mock';

describe('AvatarAccount', () => {
  const args = {
    address: '0x5CfE73b6021E818B776b421B1c4Db2474086a7e1',
    type: 'Jazzicon',
  };
  it('should render correctly', () => {
    const { getByTestId, container } = render(
      <AvatarAccount data-testid="avatar-account" {...args} />,
    );
    expect(getByTestId('avatar-account')).toBeDefined();
    expect(container).toMatchSnapshot();
  });

  it('should render Jazzicon correctly', () => {
    const container = (
      <AvatarAccount data-testid="avatar-account" {...args} type="Jazzicon" />
    );
    expect(container.props.type).toStrictEqual('Jazzicon');
  });

  it('should render Blockie correctly', () => {
    const container = (
      <AvatarAccount data-testid="avatar-account" {...args} type="Blockie" />
    );
    expect(container.props.type).toStrictEqual('Blockie');
  });

  it('should render with custom classname', () => {
    const { getByTestId } = render(
      <AvatarAccount
        className="mm-avatar-account--test"
        data-testid="classname"
        {...args}
      />,
    );
    expect(getByTestId('classname')).toHaveClass('mm-avatar-account--test');
  });

  it('should render with address', () => {
    const container = (
      <AvatarAccount
        className="mm-avatar-account--test"
        data-testid="classname"
        {...args}
        address="0x0"
      />
    );
    expect(container.props.address).toStrictEqual('0x0');
  });

  it('should render with different size classes', () => {
    const { getByTestId } = render(
      <>
        <AvatarAccount
          size={AVATAR_ACCOUNT_SIZES.XS}
          data-testid={AVATAR_ACCOUNT_SIZES.XS}
          {...args}
        />
        <AvatarAccount
          size={AVATAR_ACCOUNT_SIZES.SM}
          data-testid={AVATAR_ACCOUNT_SIZES.SM}
          {...args}
        />
        <AvatarAccount
          size={AVATAR_ACCOUNT_SIZES.MD}
          data-testid={AVATAR_ACCOUNT_SIZES.MD}
          {...args}
        />
        <AvatarAccount
          size={AVATAR_ACCOUNT_SIZES.LG}
          data-testid={AVATAR_ACCOUNT_SIZES.LG}
          {...args}
        />
        <AvatarAccount
          size={AVATAR_ACCOUNT_SIZES.XL}
          data-testid={AVATAR_ACCOUNT_SIZES.XL}
          {...args}
        />
      </>,
    );
    expect(getByTestId(AVATAR_ACCOUNT_SIZES.XS)).toHaveClass(
      `mm-avatar-base--size-${AVATAR_ACCOUNT_SIZES.XS}`,
    );
    expect(getByTestId(AVATAR_ACCOUNT_SIZES.SM)).toHaveClass(
      `mm-avatar-base--size-${AVATAR_ACCOUNT_SIZES.SM}`,
    );
    expect(getByTestId(AVATAR_ACCOUNT_SIZES.MD)).toHaveClass(
      `mm-avatar-base--size-${AVATAR_ACCOUNT_SIZES.MD}`,
    );
    expect(getByTestId(AVATAR_ACCOUNT_SIZES.LG)).toHaveClass(
      `mm-avatar-base--size-${AVATAR_ACCOUNT_SIZES.LG}`,
    );
    expect(getByTestId(AVATAR_ACCOUNT_SIZES.XL)).toHaveClass(
      `mm-avatar-base--size-${AVATAR_ACCOUNT_SIZES.XL}`,
    );
  });
});
