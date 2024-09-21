import React from 'react';
import LoadingScreen from './loading-screen.component';

export default {
  title: 'Components/UI/LoadingScreen',
  component: LoadingScreen,
};

const Template = (args) => <LoadingScreen {...args} />;

export const Default = Template.bind({});
Default.args = {
  loadingMessage: 'Loading...',
  showLoadingSpinner: true,
};
