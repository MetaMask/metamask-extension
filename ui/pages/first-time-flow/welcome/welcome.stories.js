import React from 'react';
import Welcome from './welcome.component';

export default {
  title: 'Pages/FirstTimeFlow/Welcome',
  id: __filename,
};

export const DefaultStory = () => {
  return <Welcome />;
};

DefaultStory.storyName = 'Default';
