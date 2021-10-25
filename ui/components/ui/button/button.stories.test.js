/* eslint-disable jest/require-top-level-describe */
import React from 'react';

import { render, screen } from '@testing-library/react';

import '@testing-library/jest-dom/extend-expect';
import {
  PrimaryType,
  SecondaryType,
  WarningType,
  DefaultType,
  DangerPrimaryType,
  DangerType,
} from './button.stories';

it('renders the button in the primary state', () => {
  render(<PrimaryType {...PrimaryType.args} />);
  expect(screen.getByRole('button')).toHaveTextContent('Click me');
});

it('renders the button in the secondary state', () => {
  render(<SecondaryType {...PrimaryType.args} />);
  expect(screen.getByRole('button')).toHaveTextContent('Click me');
});

it('renders the button in the warning state', () => {
  render(<WarningType {...PrimaryType.args} />);
  expect(screen.getByRole('button')).toHaveTextContent('Click me');
});

it('renders the button in the default state', () => {
  render(<DefaultType {...PrimaryType.args} />);
  expect(screen.getByRole('button')).toHaveTextContent('Click me');
});

it('renders the button in the danger primary state', () => {
  render(<DangerPrimaryType {...PrimaryType.args} />);
  expect(screen.getByRole('button')).toHaveTextContent('Click me');
});

it('renders the button in the danger state', () => {
  render(<DangerType {...PrimaryType.args} />);
  expect(screen.getByRole('button')).toHaveTextContent('Click me');
});
