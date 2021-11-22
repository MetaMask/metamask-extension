import React from 'react';
import { text } from '@storybook/addon-knobs';
import ErrorMessage from '.';

export default {
  title: 'Components/UI/ErrorMessage',
  id: __filename,
};

export const Base = () => (
  <ErrorMessage errorMessage={text('Error Message:', 'There was an error!')} />
);
