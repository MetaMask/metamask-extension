import React from 'react';

import AdvancedTab from './advanced-tab.component';

export default {
  title: 'Pages/Settings/AdvancedTab',

  argTypes: {
    warning: { control: 'text' },
    useNonceField: { control: 'boolean' },
    sendHexData: { control: 'boolean' },
    showFiatInTestnets: { control: 'boolean' },
    useLedgerLive: { control: 'boolean' },
    dismissSeedBackUpReminder: { control: 'boolean' },
    setAutoLockTimeLimit: { action: 'setAutoLockTimeLimit' },
    setShowFiatConversionOnTestnetsPreference: {
      action: 'setShowFiatConversionOnTestnetsPreference',
    },
    setShowTestNetworks: { action: 'setShowTestNetworks' },
    setIpfsGateway: { action: 'setIpfsGateway' },
    setIsIpfsGatewayEnabled: { action: 'setIsIpfsGatewayEnabled' },
    setDismissSeedBackUpReminder: { action: 'setDismissSeedBackUpReminder' },
    setUseNonceField: { action: 'setUseNonceField' },
    setHexDataFeatureFlag: { action: 'setHexDataFeatureFlag' },
    displayWarning: { action: 'displayWarning' },
    history: { action: 'history' },
    showResetAccountConfirmationModal: {
      action: 'showResetAccountConfirmationModal',
    },
    showEthSignModal: {
      action: 'showEthSignModal',
    },
  },
};

export const DefaultStory = (args) => {
  return (
    <div style={{ flex: 1, height: 500 }}>
      <AdvancedTab {...args} ipfsGateway="ipfs-gateway" />
    </div>
  );
};

DefaultStory.storyName = 'Default';
DefaultStory.args = {
  warning: 'Warning Sample',
  useNonceField: false,
  sendHexData: false,
  showFiatInTestnets: false,
  useLedgerLive: false,
  dismissSeedBackUpReminder: false,
};
