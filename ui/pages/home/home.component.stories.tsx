import React from 'react';
import { StoryObj, Meta } from '@storybook/react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom-v5-compat';
import Home from './home.component';
import mockState from '../../../test/data/mock-state.json';
import configureStore from '../../store/store';
import { FirstTimeFlowType } from '../../../shared/constants/onboarding';
import { AccountOverviewTabKey } from '../../../shared/constants/app-state';

// Create store with mock state
const store = configureStore({
  ...mockState,
});

interface WrapperProps {
  children: React.ReactNode;
}

// Wrapper component to provide necessary providers
const Wrapper: React.FC<WrapperProps> = ({ children }) => (
  <Provider store={store}>
    {children}
  </Provider>
);

const meta: Meta<typeof Home> = {
  title: 'Pages/Home/Home',
  component: Home,
  decorators: [
    (Story) => (
      <Wrapper>
        <div className="-m-4">
          <Story />
        </div>
      </Wrapper>
    ),
  ],
  parameters: {
    initialEntries: ['/'],
  },
  args: {
    connectedStatusPopoverHasBeenShown: true,
    showRecoveryPhraseReminder: false,
    showTermsOfUsePopup: false,
    firstTimeFlowType: FirstTimeFlowType.import,
    completedOnboarding: true,
    showWhatsNewPopup: false,
    announcementsToShow: false,
    onboardedInThisUISession: false,
    showMultiRpcModal: false,
    showUpdateModal: false,
    newNetworkAddedConfigurationId: null,
    isNotification: false,
    totalUnapprovedCount: 0,
    defaultHomeActiveTabName: null,
    participateInMetaMetrics: false,
    haveSwapsQuotes: false,
    showAwaitingSwapScreen: false,
    haveBridgeQuotes: false,
    dataCollectionForMarketing: false,
    swapsFetchParams: null,
    shouldShowWeb3ShimUsageNotification: false,
    originOfCurrentTab: null,
    pendingApprovals: [],
    hasApprovalFlows: false,
    infuraBlocked: false,
    showOutdatedBrowserWarning: false,
    newNetworkAddedName: null,
    editedNetwork: null,
    isSigningQRHardwareTransaction: false,
    newNftAddedMessage: '',
    removeNftMessage: '',
    newTokensImported: '',
    newTokensImportedError: '',
    hasAllowedPopupRedirectApprovals: false,
    useExternalServices: true,
    redirectAfterDefaultPage: null,
    isSeedlessPasswordOutdated: false,
    isPrimarySeedPhraseBackedUp: true,
    showShieldEntryModal: false,
    isSocialLoginFlow: false,

    // Function props (mocked)
    navigate: () => {},
    setConnectedStatusPopoverHasBeenShown: () => {},
    hideWhatsNewPopup: () => {},
    onTabClick: () => {},
    setDataCollectionForMarketing: () => {},
    setWeb3ShimUsageAlertDismissed: () => {},
    disableWeb3ShimUsageAlert: () => {},
    setRecoveryPhraseReminderHasBeenShown: () => {},
    setRecoveryPhraseReminderLastShown: () => {},
    setTermsOfUseLastAgreed: () => {},
    setOutdatedBrowserWarningLastShown: () => {},
    setNewNftAddedMessage: () => {},
    setRemoveNftMessage: () => {},
    attemptCloseNotificationPopup: () => {},
    setNewTokensImported: () => {},
    setNewTokensImportedError: () => {},
    clearNewNetworkAdded: () => {},
    clearEditedNetwork: () => {},
    setActiveNetwork: () => {},
    setBasicFunctionalityModalOpen: () => {},
    fetchBuyableChains: () => {},
    clearRedirectAfterDefaultPage: () => {},
    lookupSelectedNetworks: () => {},
  },
};

export default meta;
type Story = StoryObj<typeof Home>;

export const Default: Story = {};

export const NFTNotifications: Story = {
  args: {
    ...Default.args,
    newNftAddedMessage: 'success',
    removeNftMessage: 'error',
    newTokensImported: '5',
    newTokensImportedError: 'Failed to import some tokens',
    newNetworkAddedName: 'Arbitrum One',
    defaultHomeActiveTabName: AccountOverviewTabKey.Nfts,
  },
};

export const NewNetworkAdded: Story = {
  args: {
    ...Default.args,
    newNetworkAddedName: 'Arbitrum One',
    newNetworkAddedConfigurationId: '1',
  },
};

export const UpdateLatestVersion: Story = {
  args: {
    ...Default.args,
    showUpdateModal: true,
  },
};

export const ProtectYourWallet: Story = {
  args: {
    ...Default.args,
    showRecoveryPhraseReminder: true,
    shouldShowSeedPhraseReminder: true,
    isPrimarySeedPhraseBackedUp: false,
  },
};
