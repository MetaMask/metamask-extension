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
    setAutoLockTimeLimit: { action: 'setAutoLockTimeLimit' },
    setShowFiatConversionOnTestnetsPreference: {
      action: 'setShowFiatConversionOnTestnetsPreference',
    },
    setShowTestNetworks: { action: 'setShowTestNetworks' },
    setIpfsGateway: { action: 'setIpfsGateway' },
    setLedgerTransportPreference: { action: 'setLedgerTransportPreference' },
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
  const [
    {
      useNonceField,
      sendHexData,
      showFiatInTestnets,
      dismissSeedBackUpReminder,
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
};
