import React from 'react';
import { ComponentStory, ComponentMeta } from '@storybook/react';
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
} as ComponentMeta<typeof JwtUrlForm>;

const Template: ComponentStory<typeof JwtUrlForm> = (args) => (
  <JwtUrlForm {...args} />
);

export const DefaultStory = Template.bind({});
DefaultStory.storyName = 'JwtUrlForm';
