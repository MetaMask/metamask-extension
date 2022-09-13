/* eslint-disable jest/require-top-level-describe */
import { render } from '@testing-library/react';
import React from 'react';
import Jazzicon from '../../ui/jazzicon/jazzicon.component';
import { AvatarAccount } from './avatar-account';

describe('AvatarAccount', () => {
  it('should render Jazzicon correctly', () => {
    const { getByTestId } = render(
      <AvatarAccount data-testid="avatar-account">
        <Jazzicon
          address="0x0000000000000000000000000000000000000000"
          diameter={32}
        />
      </AvatarAccount>,
    );
    expect(getByTestId('avatar-account')).toBeDefined();
  });
});
