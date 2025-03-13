import React from 'react';
import { useArgs } from '@storybook/client-api';
import AdvancedTab from './advanced-tab.component';

export default {
  title: 'Pages/Settings/AdvancedTab',

  argTypes: {
    warning: { control: 'text' },
    sendHexData: { control: 'boolean' },
    showFiatInTestnets: { control: 'boolean' },
    useLedgerLive: { control: 'boolean' },
    dismissSeedBackUpReminder: { control: 'boolean' },
    overrideContentSecurityPolicyHeader: { control: 'boolean' },
    setAutoLockTimeLimit: { action: 'setAutoLockTimeLimit' },
    setShowFiatConversionOnTestnetsPreference: {
      action: 'setShowFiatConversionOnTestnetsPreference',
    },
    setShowTestNetworks: { action: 'setShowTestNetworks' },
    setIpfsGateway: { action: 'setIpfsGateway' },
    setIsIpfsGatewayEnabled: { action: 'setIsIpfsGatewayEnabled' },
    setDismissSeedBackUpReminder: { action: 'setDismissSeedBackUpReminder' },
    setOverrideContentSecurityPolicyHeader: {
      action: 'setOverrideContentSecurityPolicyHeader',
    },
    setHexDataFeatureFlag: { action: 'setHexDataFeatureFlag' },
    displayErrorInSettings: { action: 'displayErrorInSettings' },
    hideErrorInSettings: { action: 'hideErrorInSettings' },
    history: { action: 'history' },
    showResetAccountConfirmationModal: {
      action: 'showResetAccountConfirmationModal',
    },
  },
};

export const DefaultStory = (args) => {
  const [
    {
      sendHexData,
      showFiatInTestnets,
      dismissSeedBackUpReminder,
      overrideContentSecurityPolicyHeader,
    },
    updateArgs,
  ] = useArgs();

  const handleSendHexData = () => {
    updateArgs({
      sendHexData: !sendHexData,
    });
  };

  const handleShowFiatInTestnets = () => {
    updateArgs({
      showFiatInTestnets: !showFiatInTestnets,
    });
  };

  const handleDismissSeedBackUpReminder = () => {
    updateArgs({
      dismissSeedBackUpReminder: !dismissSeedBackUpReminder,
    });
  };

  const handleOverrideContentSecurityPolicyHeader = () => {
    updateArgs({
      overrideContentSecurityPolicyHeader: !overrideContentSecurityPolicyHeader,
    });
  };
  return (
    <div style={{ flex: 1, height: 500 }}>
      <AdvancedTab
        {...args}
        sendHexData={sendHexData}
        setHexDataFeatureFlag={handleSendHexData}
        showFiatInTestnets={showFiatInTestnets}
        setShowFiatConversionOnTestnetsPreference={handleShowFiatInTestnets}
        dismissSeedBackUpReminder={dismissSeedBackUpReminder}
        setDismissSeedBackUpReminder={handleDismissSeedBackUpReminder}
        overrideContentSecurityPolicyHeader={
          overrideContentSecurityPolicyHeader
        }
        setOverrideContentSecurityPolicyHeader={
          handleOverrideContentSecurityPolicyHeader
        }
        ipfsGateway="ipfs-gateway"
      />
    </div>
  );
};

DefaultStory.storyName = 'Default';
DefaultStory.args = {
  warning: 'Warning Sample',
  sendHexData: false,
  showFiatInTestnets: false,
  useLedgerLive: false,
  dismissSeedBackUpReminder: false,
  overrideContentSecurityPolicyHeader: true,
};
