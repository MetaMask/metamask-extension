import React from 'react';
import { Meta, StoryFn } from '@storybook/react';
import JwtUrlForm from '.';

export default {
  title: 'Components/Institutional/JwtUrlForm',
  component: JwtUrlForm,
  args: {
    jwtList: ['jwt1', 'jwt2', 'jwt3'],
    currentJwt: 'jwt1',
    jwtInputText: 'some input text',
    onJwtChange: () => {
      /**/
    },
    onUrlChange: () => {
      /**/
    },
  },
} as Meta<typeof JwtUrlForm>;

const Template: StoryFn<typeof JwtUrlForm> = (args) => <JwtUrlForm {...args} />;

export const DefaultStory = Template.bind({});
DefaultStory.storyName = 'JwtUrlForm';
