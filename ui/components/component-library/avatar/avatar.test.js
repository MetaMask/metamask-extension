/* eslint-disable jest/require-top-level-describe */
import { render } from '@testing-library/react';
import React from 'react';

import { Avatar, AVATAR_TYPES } from '.';

describe('Avatar', () => {
  it('should render correctly', () => {
    const { getByTestId } = render(
      <Avatar type={AVATAR_TYPES.FAVICON} data-testid="avatar" />,
    );
    expect(getByTestId('avatar')).toBeDefined();
  });
});
