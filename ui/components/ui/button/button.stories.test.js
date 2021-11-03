/* eslint-disable jest/require-top-level-describe */
import React from 'react';

import { render, screen } from '@testing-library/react';

import '@testing-library/jest-dom/extend-expect';
import { DefaultStory } from './button.stories';

it('renders the button in the primary state', () => {
  render(<DefaultStory {...DefaultStory.args} />);
  expect(screen.getByRole('button')).toHaveTextContent('Default');
});
