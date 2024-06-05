import React from 'react';
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
};

export const DefaultStory = (args) => <JwtUrlForm {...args} />;

DefaultStory.storyName = 'JwtUrlForm';
