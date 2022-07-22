/* eslint-disable jest/require-top-level-describe */
import React from 'react';
import { renderWithProvider } from '../../../../test/jest';

import BaseAvatar from './base-avatar';

describe('BaseAvatar', () => {
  it('should render correctly', () => {
    const { container } = renderWithProvider(<BaseAvatar />);
    expect(container).toMatchSnapshot();
  });
});
