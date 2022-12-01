/* eslint-disable jest/require-top-level-describe */
import { render } from '@testing-library/react';
import React from 'react';

import { AvatarIcon } from './avatar-icon';

describe('AvatarIcon', () => {
  it('should render correctly', () => {
    const { getByTestId } = render(<AvatarIcon data-testid="avatar-icon" />);
    expect(getByTestId('avatar-icon')).toBeDefined();
  });

  it('should render fallback image if no ImageSource is provided', () => {
    const { container } = render(<AvatarIcon data-testid="avatar-icon" />);
    expect(container.getElementsByClassName('mm-icon')).toHaveLength(1);
  });

  it('should render fallback image with custom fallbackIconProps if no ImageSource is provided', () => {
    const container = (
      <AvatarIcon
        data-testid="avatar-icon"
        fallbackIconProps={{
          'data-testid': 'fallback-icon',
        }}
      />
    );
    expect(container.props.fallbackIconProps['data-testid']).toStrictEqual(
      'fallback-icon',
    );
  });
});
