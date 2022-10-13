/* eslint-disable jest/require-top-level-describe */
import { render, screen } from '@testing-library/react';
import React from 'react';

import { TagUrl } from './tag-url';

describe('Tag', () => {
  it('should render the label inside the tag', () => {
    const { getByTestId } = render(
      <TagUrl data-testid="tag-url" label="https://app.uniswap.org" />,
    );
    expect(getByTestId('tag-url')).toBeDefined();
  });
  it('should render the button Link if there is a cta object inside the tag', () => {
    render(
      <TagUrl
        data-testid="tag-url"
        label="https://app.uniswap.org"
        cta={{ label: 'Action' }}
      />,
    );
    expect(screen.getByText('Action').closest('a')).toHaveAttribute(
      'href',
      '#',
    );
  });
});
