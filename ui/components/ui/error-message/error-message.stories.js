import React from 'react';
import { text } from '@storybook/addon-knobs';
import ErrorMessage from '.';

export default {
  title: 'UI/Toast/Error Message',
  id: __filename,
};

export const Base = () => (
  <ErrorMessage errorMessage={text('Error Message:', 'There was an error!')} />
);
