/* eslint-disable jest/require-top-level-describe */
import { render } from '@testing-library/react';
import React from 'react';
// import { POPOVER_POSITIONS } from './popover.constants';
import { Popover } from './popover';

describe('Popover', () => {
  it('should render popover element correctly', () => {
    const { getByTestId, getByText, container } = render(
      <Popover data-testid="popover">Popover</Popover>,
    );
    expect(getByText('Popover')).toBeDefined();
    expect(container.querySelector('popover')).toBeDefined();
    expect(getByTestId('popover')).toHaveClass('mm-popover');
    expect(container).toMatchSnapshot();
  });
});
