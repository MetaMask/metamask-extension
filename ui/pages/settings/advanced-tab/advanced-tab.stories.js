import React from 'react';
import { useArgs } from '@storybook/client-api';
import AdvancedTab from './advanced-tab.component';

export default {
  title: 'Pages/Settings/AdvancedTab',
  id: __filename,
  argTypes: {
    warning: { control: 'text' },
    useNonceField: { control: 'boolean' },
    sendHexData: { control: 'boolean' },
    advancedInlineGas: { control: 'boolean' },
    showFiatInTestnets: { control: 'boolean' },
    threeBoxSyncingAllowed: { control: 'boolean' },
    threeBoxDisabled: { control: 'boolean' },
    useLedgerLive: { control: 'boolean' },
    dismissSeedBackUpReminder: { control: 'boolean' },
    setAutoLockTimeLimit: { action: 'setAutoLockTimeLimit' },
    setShowFiatConversionOnTestnetsPreference: {
      action: 'setShowFiatConversionOnTestnetsPreference',
    },
    setShowTestNetworks: { action: 'setShowTestNetworks' },
    setThreeBoxSyncingPermission: { action: 'setThreeBoxSyncingPermission' },
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
    setAdvancedInlineGasFeatureFlag: {
      action: 'setAdvancedInlineGasFeatureFlag',
    },
  },
};

export const DefaultStory = (args) => {
  const [
    {
      useNonceField,
      sendHexData,
      advancedInlineGas,
      showFiatInTestnets,
      threeBoxSyncingAllowed,
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

  const handleAdvancedInlineGas = () => {
    updateArgs({
      advancedInlineGas: !advancedInlineGas,
    });
  };

  const handleShowFiatInTestnets = () => {
    updateArgs({
      showFiatInTestnets: !showFiatInTestnets,
    });
  };

  const handleThreeBoxSyncingAllowed = () => {
    updateArgs({
      threeBoxSyncingAllowed: !threeBoxSyncingAllowed,
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
        advancedInlineGas={advancedInlineGas}
        setAdvancedInlineGasFeatureFlag={handleAdvancedInlineGas}
        showFiatInTestnets={showFiatInTestnets}
        setShowFiatConversionOnTestnetsPreference={handleShowFiatInTestnets}
        threeBoxSyncingAllowed={threeBoxSyncingAllowed}
        setThreeBoxSyncingPermission={handleThreeBoxSyncingAllowed}
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
  advancedInlineGas: false,
  showFiatInTestnets: false,
  threeBoxSyncingAllowed: false,
  threeBoxDisabled: false,
  useLedgerLive: false,
  dismissSeedBackUpReminder: false,
};
