import React from 'react';
import { action } from '@storybook/addon-actions';
import { text, boolean } from '@storybook/addon-knobs';
import Button from '.';

export default {
  title: 'UI/Button/General',
  id: __filename,
};

export const PrimaryType = () => (
  <Button
    onClick={action('clicked')}
    type="primary"
    disabled={boolean('disabled', false)}
  >
    {text('text', 'Click me')}
  </Button>
);

export const SecondaryType = () => (
  <Button
    onClick={action('clicked')}
    type="secondary"
    disabled={boolean('disabled', false)}
  >
    {text('text', 'Click me')}
  </Button>
);

export const DefaultType = () => (
  <Button
    onClick={action('clicked')}
    type="default"
    disabled={boolean('disabled', false)}
  >
    {text('text', 'Click me')}
  </Button>
);

export const WarningType = () => (
  <Button
    onClick={action('clicked')}
    type="warning"
    disabled={boolean('disabled', false)}
  >
    {text('text', 'Click me')}
  </Button>
);

export const DangerType = () => (
  <Button
    onClick={action('clicked')}
    type="danger"
    disabled={boolean('disabled', false)}
  >
    {text('text', 'Click me')}
  </Button>
);

export const DangerPrimaryType = () => (
  <Button
    onClick={action('clicked')}
    type="danger-primary"
    disabled={boolean('disabled', false)}
  >
    {text('text', 'Click me')}
  </Button>
);
