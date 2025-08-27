import React, { useCallback, useContext, useMemo, useState } from 'react';
import { AccountGroupId, AccountWalletId } from '@metamask/account-api';
import { useSelector } from 'react-redux';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import {
  Box,
  ButtonPrimary,
  ButtonPrimarySize,
  Text,
  IconName,
  IconSize,
  ButtonBaseSize,
  Icon,
} from '../../../component-library';

import {
  BackgroundColor,
  Display,
  FlexDirection,
  JustifyContent,
} from '../../../../helpers/constants/design-system';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../../shared/constants/metametrics';
import { MetaMetricsContext } from '../../../../contexts/metametrics';
import { MultichainAccountList } from '../../multichain-account-list';
import { getAccountTree } from '../../../../selectors/multichain-accounts/account-tree';
import { AccountGroupWithInternalAccounts } from '../../../../selectors/multichain-accounts/account-tree.types';
import { Content, Footer, Header, Page } from '../../../multichain/pages/page';
import IconButton from '../../../ui/icon-button';

type MultichainEditAccountsPageProps = {
  defaultSelectedAccountGroups: AccountGroupId[];
  supportedAccountGroups: AccountGroupWithInternalAccounts[];
  onSubmit: (accountGroups: AccountGroupId[]) => void;
  onClose: () => void;
};

export const MultichainEditAccountsPage: React.FC<
  MultichainEditAccountsPageProps
> = ({
  defaultSelectedAccountGroups,
  supportedAccountGroups,
  onSubmit,
  onClose,
}) => {
  const t = useI18nContext();
  const trackEvent = useContext(MetaMetricsContext);
  const [selectedAccountGroups, setSelectedAccountGroups] = useState(
    defaultSelectedAccountGroups,
  );
  const accountTree = useSelector(getAccountTree);

  const walletsWithSupportedAccountGroups = useMemo(() => {
    const walletMap = new Map();

    // Build wallets from scratch using only supported account groups
    supportedAccountGroups.forEach((group) => {
      const [walletId] = group.id.split('/');
      const walletIdTyped = walletId as AccountWalletId;
      const wallet = accountTree.wallets[walletIdTyped];

      if (group && wallet) {
        if (!walletMap.has(walletId)) {
          walletMap.set(walletId, {
            id: wallet.id,
            type: wallet.type,
            metadata: wallet.metadata,
            groups: {},
          });
        }
        walletMap.get(walletId).groups[group.id] = group;
      }
    });

    return Object.fromEntries(walletMap);
  }, [accountTree.wallets, supportedAccountGroups]);

  const handleAccountClick = useCallback(
    (accountGroupId: AccountGroupId) => {
      if (selectedAccountGroups.includes(accountGroupId)) {
        // Remove item if it exists
        setSelectedAccountGroups(
          selectedAccountGroups.filter((id) => id !== accountGroupId),
        );
      } else {
        // Add item if it doesn't exist
        setSelectedAccountGroups([...selectedAccountGroups, accountGroupId]);
      }
    },
    [selectedAccountGroups],
  );

  const defaultSet = new Set(defaultSelectedAccountGroups);
  const selectedSet = new Set(selectedAccountGroups);

  return (
    <Page
      data-testid="modal-page"
      className="main-container connect-page"
      backgroundColor={BackgroundColor.backgroundDefault}
    >
      <Header
        paddingTop={8}
        paddingBottom={0}
        startAccessory={
          <IconButton
            onClick={onClose}
            size={ButtonBaseSize.Md}
            label={'close'}
            aria-label="Close"
            Icon={<Icon name={IconName.Close} size={IconSize.Md} />}
          />
        }
      >
        <Box
          display={Display.Flex}
          justifyContent={JustifyContent.center}
          marginBottom={8}
        >
          <Text>{t('editAccounts')}</Text>
        </Box>
      </Header>
      <Content
        paddingLeft={4}
        paddingRight={4}
        backgroundColor={BackgroundColor.transparent}
      >
        <Box display={Display.Flex} flexDirection={FlexDirection.Column}>
          <MultichainAccountList
            wallets={walletsWithSupportedAccountGroups}
            selectedAccountGroups={selectedAccountGroups}
            handleAccountClick={handleAccountClick}
          />
        </Box>
      </Content>
      <Footer>
        <ButtonPrimary
          data-testid="connect-more-accounts-button"
          onClick={() => {
            const addedAccounts = selectedAccountGroups.filter(
              (accountGroup) => !defaultSet.has(accountGroup),
            );
            const removedAccounts = defaultSelectedAccountGroups.filter(
              (accountGroup) => !selectedSet.has(accountGroup),
            );

            onSubmit(selectedAccountGroups);
            trackEvent({
              category: MetaMetricsEventCategory.Permissions,
              event: MetaMetricsEventName.UpdatePermissionedAccounts,
              properties: {
                addedAccounts: addedAccounts.length,
                removedAccounts: removedAccounts.length,
                location: 'Edit Accounts Modal',
              },
            });

            onClose();
          }}
          size={ButtonPrimarySize.Lg}
          block
        >
          {t('connect')}
        </ButtonPrimary>
      </Footer>
    </Page>
  );
};
