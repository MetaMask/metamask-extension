/* eslint-disable jest/require-top-level-describe */
import { render } from '@testing-library/react';
import React from 'react';

import { Tag } from './tag';

describe('Tag', () => {
  it('should render the label inside the tag', () => {
    const { getByTestId } = render(<Tag data-testid="tag" label="Imported" />);
    expect(getByTestId('tag')).toBeDefined();
    expect(getByTestId('tag')).toHaveTextContent('Imported');
  });
});
