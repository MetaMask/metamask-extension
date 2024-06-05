import React from 'react';
import LoadingScreen from './loading-screen.component';

export default {
  title: 'Components/UI/LoadingScreen',
  component: LoadingScreen,
};

const Template = (args) => <LoadingScreen {...args} />;

export const Default = Template.bind({});
Default.args = {
  // header: <h1>Loading Screen</h1>,
  loadingMessage: 'Loading...',
  showLoadingSpinner: true,
};
