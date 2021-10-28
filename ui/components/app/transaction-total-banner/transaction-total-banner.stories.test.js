/* eslint-disable jest/require-top-level-describe */
import React from 'react';
import { render, screen } from '@testing-library/react';

import '@testing-library/jest-dom/extend-expect';
import { Base } from './transaction-total-banner.stories';

it('renders transaction total banner stories with Base state', () => {
  render(<Base {...Base.args} />)
  expect(screen.findByTestId('#popover-content')).toBeDefined();
});
