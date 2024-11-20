import React from 'react';
import { useArgs } from '@storybook/client-api';
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
    setUseNonceField: { action: 'setUseNonceField' },
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
      useNonceField,
      sendHexData,
      showFiatInTestnets,
      dismissSeedBackUpReminder,
      overrideContentSecurityPolicyHeader,
    },
    updateArgs,
  ] = useArgs();

  const handleUseNonceField = () => {
    updateArgs({
      useNonceField: !useNonceField,
    });
  };

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
        useNonceField={useNonceField}
        setUseNonceField={handleUseNonceField}
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
  useNonceField: false,
  sendHexData: false,
  showFiatInTestnets: false,
  useLedgerLive: false,
  dismissSeedBackUpReminder: false,
  overrideContentSecurityPolicyHeader: true,
};
