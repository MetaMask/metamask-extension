import React from 'react';
import README from './README.mdx';
import UnlockPage from './unlock-page.component';

export default {
  title: 'Pages/UnlockPage',

  component: UnlockPage,
  parameters: {
    docs: {
      page: README,
    },
  },
  argTypes: {
    navigate: { control: 'object' },
    location: { control: 'object' },
    isUnlocked: { control: 'boolean' },
    onRestore: { action: 'onRestore' },
    onSubmit: { action: 'onSubmit' },
    forceUpdateMetamaskState: { action: 'forceUpdateMetamaskState' },
  },
};

export const DefaultStory = (args) => {
  const navigate = (path) => console.log('Navigate to:', path);
  const location = { pathname: '/unlock', search: '', state: null };
  return <UnlockPage {...args} navigate={navigate} location={location} />;
};

DefaultStory.storyName = 'Default';

DefaultStory.args = {
  forceUpdateMetamaskState: () => ({
    participateInMetaMetrics: true,
  }),
};

DefaultStory.storyName = 'Default';
