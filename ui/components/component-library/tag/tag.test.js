/* eslint-disable jest/require-top-level-describe */
import { render } from '@testing-library/react';
import React from 'react';

import { Tag } from './tag';

describe('AvatarToken', () => {
  it('should render the label inside the tag', () => {
    const { getByText } = render(<Tag>label</Tag>);
    expect(getByText('label')).toBeDefined();
  });
});
