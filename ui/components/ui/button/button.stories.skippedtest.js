// Importing MDX in tests is *broken* for jest versions greater than 27.
// Until https://github.com/storybookjs/storybook/issues/15916 is resolved
// we can't run this test file.
/* eslint-disable */
/* eslint-disable jest/require-top-level-describe */
import React from 'react';

import { render, screen } from '@testing-library/react';

import '@testing-library/jest-dom/extend-expect';
import { DefaultStory } from './button.stories';

it('renders the button in the primary state', () => {
  render(<DefaultStory {...DefaultStory.args} />);
  expect(screen.getByRole('button')).toHaveTextContent('Default');
});
