/* eslint-disable jest/require-top-level-describe */
import { render } from '@testing-library/react';
import React from 'react';

import { TagUrl } from './tag-url';

describe('Tag', () => {
  it('should render the label inside the tag', () => {
    const { getByTestId } = render(
      <TagUrl data-testid="tag-url" label="https://app.uniswap.org" />,
    );
    expect(getByTestId('tag-url')).toBeDefined();
  });
});
