import { createBrowserHistory } from 'history';
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
    history: { control: 'object' },
    isUnlocked: { control: 'boolean' },
    onRestore: { action: 'onRestore' },
    onSubmit: { action: 'onSubmit' },
    forceUpdateMetamaskState: { action: 'forceUpdateMetamaskState' },
    showOptInModal: { action: 'showOptInModal' },
  },
};

export const DefaultStory = (args) => {
  const history = createBrowserHistory();
  return <UnlockPage {...args} history={history} />;
};

DefaultStory.storyName = 'Default';

DefaultStory.args = {
  forceUpdateMetamaskState: () => ({
    participateInMetaMetrics: true,
  }),
};

DefaultStory.storyName = 'Default';
