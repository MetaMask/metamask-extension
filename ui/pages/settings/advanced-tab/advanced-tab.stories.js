import React from 'react';
import { text, boolean } from '@storybook/addon-knobs';
import AdvancedTab from './advanced-tab.component';

export default {
  title: 'Pages/Settings/AdvancedTab',
  id: __filename,
};

export const DefaultStory = () => {
  return (
    <div style={{ flex: 1, height: 500 }}>
      <AdvancedTab
        setAutoLockTimeLimit={() => undefined}
        setShowFiatConversionOnTestnetsPreference={() => undefined}
        setShowTestNetworks={() => undefined}
        setThreeBoxSyncingPermission={() => undefined}
        setIpfsGateway={() => undefined}
        setLedgerTransportPreference={() => undefined}
        setDismissSeedBackUpReminder={() => undefined}
        setUseNonceField={() => undefined}
        setHexDataFeatureFlag={() => undefined}
        displayWarning={() => undefined}
        history={{ push: () => undefined }}
        showResetAccountConfirmationModal={() => undefined}
        setAdvancedInlineGasFeatureFlag={() => undefined}
        warning={text('Warning', 'Warning Sample')}
        ipfsGateway="ipfs-gateway"
        useNonceField={boolean('Customize Transaction Nonce', false)}
        sendHexData={boolean('Show Hex Data', false)}
        advancedInlineGas={boolean('Advanced Inline Gas', false)}
        showFiatInTestnets={boolean('Show Conversion on Testnets', false)}
        threeBoxSyncingAllowed={boolean(
          'Sync data with 3Box (experimental)',
          false,
        )}
        threeBoxDisabled={boolean('3Box Disabled', false)}
        useLedgerLive={boolean('Use Ledger Live', false)}
        dismissSeedBackUpReminder={boolean(
          'Dismiss recovery phrase backup reminder',
          false,
        )}
      />
    </div>
  );
};

DefaultStory.storyName = 'Default';
