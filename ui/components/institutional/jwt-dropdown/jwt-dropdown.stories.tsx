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

type JwtDropdownArgs = {
  jwtList: string[];
  currentJwt: string;
  onChange: (value: string) => void;
};

export const DefaultStory = (args: JwtDropdownArgs) => (
  <JwtDropdown {...args} />
);

DefaultStory.storyName = 'JwtDropdown';
