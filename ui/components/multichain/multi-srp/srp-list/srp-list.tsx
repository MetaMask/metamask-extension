import React from 'react';
import { useSelector } from 'react-redux';
import classnames from 'classnames';
import { AccountWalletType } from '@metamask/account-api';

import { getWalletIdsByType } from '../../../../selectors/multichain-accounts/account-tree';
import { getIsPrimarySeedPhraseBackedUp } from '../../../../ducks/metamask/metamask';
import { SrpCard } from './srp-card';
import { Box } from '../../../component-library';

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

  const walletIdsFromStore = useSelector((state) =>
    getWalletIdsByType(state, AccountWalletType.Entropy),
  );

  return (
    <Box
      className={classnames('srp-list__container', {
        'srp-list__container--settings': isSettingsPage,
      })}
      padding={isSettingsPage ? 0 : 4}
      data-testid="srp-list"
    >
      {walletIdsFromStore.map((walletId, index) => {
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
