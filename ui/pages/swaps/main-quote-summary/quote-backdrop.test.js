import React from 'react';

import { renderWithProvider } from '../../../../test/jest';
import QuotesBackdrop from './quote-backdrop';

const createProps = (customProps = {}) => {
  return {
    withTopTab: false,
    ...customProps,
  };
};

describe('QuotesBackdrop', () => {
  it('renders the component with initial props', () => {
    const { container } = renderWithProvider(
      <QuotesBackdrop {...createProps()} />,
    );
    expect(container.firstChild.nodeName).toBe('svg');
    expect(document.querySelector('g')).toMatchSnapshot();
    expect(document.querySelector('filter')).toMatchSnapshot();
    expect(document.querySelector('linearGradient')).toMatchSnapshot();
  });
});
