import React from 'react';
import { useSelector } from 'react-redux';
import classnames from 'clsx';
import { AccountWalletType } from '@metamask/account-api';

import { Box } from '@metamask/design-system-react';
import { getWalletIdsByType } from '../../../../selectors/multichain-accounts/account-tree';
import { getIsPrimarySeedPhraseBackedUp } from '../../../../ducks/metamask/metamask';
import { SrpCard } from './srp-card';

export const SrpList = ({
  onActionComplete,
  hideShowAccounts,
  isSettingsPage = false,
}: {
  onActionComplete: (id: string, triggerBackup?: boolean) => void;
  isSettingsPage?: boolean;
  hideShowAccounts?: boolean;
}) => {
  const isPrimarySeedPhraseBackedUp = useSelector(
    getIsPrimarySeedPhraseBackedUp,
  );

  const entropyWalletIds = useSelector((state) =>
    getWalletIdsByType(state, AccountWalletType.Entropy),
  );

  return (
    <Box
      className={classnames('srp-list__container', {
        'min-h-0': isSettingsPage,
      })}
      padding={isSettingsPage ? 0 : 4}
      style={
        isSettingsPage
          ? {
              maxHeight: '100%',
              minHeight: 0,
              overflowY: 'auto',
            }
          : undefined
      }
      data-testid="srp-list"
    >
      {entropyWalletIds.map((walletId, index) => {
        // We only consider the first(primary) keyring for the backup reminder.
        const shouldTriggerBackup = !isPrimarySeedPhraseBackedUp && index === 0;

        return (
          <SrpCard
            key={`srp-card-${walletId}`}
            index={index}
            walletId={walletId}
            shouldTriggerBackup={shouldTriggerBackup}
            onActionComplete={onActionComplete}
            isSettingsPage={isSettingsPage}
            hideShowAccounts={hideShowAccounts}
          />
        );
      })}
    </Box>
  );
};
