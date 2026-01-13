import React from 'react';
import README from './README.mdx';
import UnlockPage from './unlock-page.component';
import { FirstTimeFlowType } from '../../../shared/constants/onboarding';

export default {
  title: 'Pages/UnlockPage',

  component: UnlockPage,
  parameters: {
    docs: {
      page: README,
    },
  },
  argTypes: {
    isUnlocked: { control: 'boolean' },
    onRestore: { action: 'onRestore' },
    onSubmit: { action: 'onSubmit' },
    forceUpdateMetamaskState: { action: 'forceUpdateMetamaskState' },
    checkIsSeedlessPasswordOutdated: {
      action: 'checkIsSeedlessPasswordOutdated',
    },
    getIsSeedlessOnboardingUserAuthenticated: {
      action: 'getIsSeedlessOnboardingUserAuthenticated',
    },
    loginWithDifferentMethod: { action: 'loginWithDifferentMethod' },
    firstTimeFlowType: {
      control: 'select',
      options: [FirstTimeFlowType.socialImport, FirstTimeFlowType.socialCreate],
    },
    resetWallet: { action: 'resetWallet' },
    isSocialLoginFlow: { control: 'boolean' },
    onboardingParentContext: { control: 'object' },
    isPopup: { control: 'boolean' },
    isWalletResetInProgress: { control: 'boolean' },
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
