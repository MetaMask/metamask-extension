import React from 'react';
import { action } from '@storybook/addon-actions';
import JwtDropdown from '.';

export default {
  title: 'Components/Institutional/JwtDropdown',
  component: JwtDropdown,
  args: {
    jwtList: ['jwt1', 'jwt2'],
    currentJwt: 'jwt1',
    onChange: () => {
      action('onChange');
    },
  },
};

export const DefaultStory = (args) => <JwtDropdown {...args} />;

DefaultStory.storyName = 'JwtDropdown';
