/* eslint-disable jest/require-top-level-describe */
import { render } from '@testing-library/react';
import React from 'react';
import { AvatarAccount } from './avatar-account';
import 'jest-canvas-mock';

describe('AvatarAccount', () => {
  const args = {
    address: '0x5CfE73b6021E818B776b421B1c4Db2474086a7e1',
  };
  it('should render Jazzicon correctly', () => {
    const { getByTestId } = render(
      <AvatarAccount data-testid="avatar-account" type="Jazzicon" {...args} />,
    );
    expect(getByTestId('avatar-account')).toBeDefined();
  });
  it('should render Blockie correctly', () => {
    const { getByTestId } = render(
      <AvatarAccount data-testid="avatar-account" type="Blockie" {...args} />,
    );
    expect(getByTestId('avatar-account')).toBeDefined();
  });
});
