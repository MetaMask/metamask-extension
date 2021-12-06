import React from 'react';
import TextField from '.';

export default {
  title: 'Components/UI/TextField',
  id: __filename,
};

export const DefaultStory = () => <TextField label="Text" type="text" />;

DefaultStory.storyName = 'Default';

export const Password = () => <TextField label="Password" type="password" />;

export const Error = () => (
  <TextField type="text" label="Name" error="Invalid value" />
);

export const MascaraText = () => (
  <TextField label="Text" type="text" largeLabel />
);

export const MaterialText = () => (
  <TextField label="Text" type="text" theme="material" />
);

export const MaterialPassword = () => (
  <TextField label="Password" type="password" theme="material" />
);

export const MaterialError = () => (
  <TextField type="text" label="Name" error="Invalid value" theme="material" />
);
