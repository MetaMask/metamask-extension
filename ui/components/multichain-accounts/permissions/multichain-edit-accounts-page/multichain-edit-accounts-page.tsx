import React, { useCallback, useMemo, useState } from 'react';
import { AccountGroupId, AccountWalletId } from '@metamask/account-api';
import { useSelector } from 'react-redux';
import classnames from 'clsx';
import {
  IconName,
  BannerBase,
  ButtonIcon,
  ButtonIconSize,
  Button,
  ButtonSize,
  ButtonVariant,
  AvatarFavicon,
  AvatarFaviconSize,
  FontWeight,
  Text,
  TextColor,
  TextVariant as DSTextVariant,
} from '@metamask/design-system-react';
import { useBoolean } from '../../../../hooks/useBoolean';
import { useI18nContext } from '../../../../hooks/useI18nContext';

import {
  BackgroundColor,
  TextVariant,
} from '../../../../helpers/constants/design-system';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../../shared/constants/metametrics';
import { useAnalytics } from '../../../../hooks/useAnalytics';
import { MultichainAccountList } from '../../multichain-account-list';
import { getAccountTree } from '../../../../selectors/multichain-accounts/account-tree';
import { AccountGroupWithInternalAccounts } from '../../../../selectors/multichain-accounts/account-tree.types';
import { Footer, Header, Page } from '../../../multichain/pages/page';
import { extractWalletIdFromGroupId } from '../../../../selectors/multichain-accounts/utils';
import { ScrollContainer } from '../../../../contexts/scroll-container';
import { DisconnectAllModal } from '../../../multichain/disconnect-all-modal/disconnect-all-modal';
import { getURLHost } from '../../../../helpers/utils/util';

/**
 * Represents the type of Snaps permission request:
 * - Initial: Initial account permission request (new session) - requires at least 1 account
 * - Existing: Editing existing Snap permissions - allows 0 accounts for revoke flow
 * - None: Not a Snaps permission request - requires at least 1 account
 */
export enum SnapsPermissionsRequestType {
  Initial = 'initial',
  Existing = 'existing',
  None = 'none',
}

export type SiteMetadata = {
  origin: string;
  name?: string;
  iconUrl?: string;
};

type MultichainEditAccountsPageProps = {
  title?: string;
  confirmButtonText?: string;
  defaultSelectedAccountGroups: AccountGroupId[];
  supportedAccountGroups: AccountGroupWithInternalAccounts[];
  onSubmit: (accountGroups: AccountGroupId[]) => void;
  onClose: () => void;
  snapsPermissionsRequestType?: SnapsPermissionsRequestType;
  siteMetadata?: SiteMetadata;
  onDisconnect?: () => void;
};

export const MultichainEditAccountsPage = ({
  title,
  confirmButtonText,
  defaultSelectedAccountGroups,
  supportedAccountGroups,
  onSubmit,
  onClose,
  snapsPermissionsRequestType = SnapsPermissionsRequestType.None,
  siteMetadata,
  onDisconnect,
}: MultichainEditAccountsPageProps) => {
  const t = useI18nContext();
  const { trackEvent, createEventBuilder } = useAnalytics();
  const [selectedAccountGroups, setSelectedAccountGroups] = useState(
    defaultSelectedAccountGroups,
  );
  const showDisconnectModal = useBoolean();
  const accountTree = useSelector(getAccountTree);

  const walletsWithSupportedAccountGroups = useMemo(() => {
    const walletMap = new Map();

    // Build wallets from scratch using only supported account groups
    supportedAccountGroups.forEach((group) => {
      const walletId = extractWalletIdFromGroupId(group.id);
      const walletIdTyped = walletId as AccountWalletId;
      const wallet = accountTree.wallets[walletIdTyped];

      if (wallet) {
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

  const handleConnect = useCallback(() => {
    const defaultSet = new Set(defaultSelectedAccountGroups);
    const selectedSet = new Set(selectedAccountGroups);

    const addedAccounts = selectedAccountGroups.filter(
      (accountGroup) => !defaultSet.has(accountGroup),
    );
    const removedAccounts = defaultSelectedAccountGroups.filter(
      (accountGroup) => !selectedSet.has(accountGroup),
    );

    onSubmit(selectedAccountGroups);
    trackEvent(
      createEventBuilder(MetaMetricsEventName.UpdatePermissionedAccounts)
        .addCategory(MetaMetricsEventCategory.Permissions)
        .addProperties({
          addedAccounts: addedAccounts.length,
          removedAccounts: removedAccounts.length,
          location: 'Edit Accounts Modal',
        })
        .build(),
    );
  }, [
    selectedAccountGroups,
    defaultSelectedAccountGroups,
    onSubmit,
    trackEvent,
    createEventBuilder,
  ]);

  const isSaveDisabled =
    selectedAccountGroups.length === 0 &&
    snapsPermissionsRequestType !== SnapsPermissionsRequestType.Existing;

  const handleDisconnectConfirm = () => {
    showDisconnectModal.setFalse();
    onDisconnect?.();
  };

  const siteHost = siteMetadata?.origin
    ? getURLHost(siteMetadata.origin)
    : undefined;

  return (
    <Page
      data-testid="modal-page"
      className={classnames('main-container', 'multichain-edit-accounts-page', {
        'multichain-edit-accounts-page--snap':
          snapsPermissionsRequestType === SnapsPermissionsRequestType.Initial ||
          snapsPermissionsRequestType === SnapsPermissionsRequestType.Existing,
      })}
      backgroundColor={BackgroundColor.backgroundDefault}
    >
      {snapsPermissionsRequestType === SnapsPermissionsRequestType.None && (
        <Header
          data-testid="edit-accounts-modal-header"
          textProps={{
            variant: TextVariant.headingSm,
          }}
          startAccessory={
            <ButtonIcon
              size={ButtonIconSize.Md}
              ariaLabel={t('back')}
              iconName={IconName.ArrowLeft}
              onClick={onClose}
              data-testid="back-button"
            />
          }
          endAccessory={
            onDisconnect ? (
              <ButtonIcon
                data-testid="disconnect-button"
                ariaLabel={t('disconnect')}
                iconName={IconName.Logout}
                size={ButtonIconSize.Md}
                onClick={showDisconnectModal.setTrue}
                className="text-error-default"
              />
            ) : undefined
          }
        >
          {title ?? t('editAccounts')}
        </Header>
      )}
      <ScrollContainer className="flex-1 overflow-y-auto">
        {siteMetadata && (
          <BannerBase
            className="mx-4 mb-3 bg-muted"
            data-testid="connected-site-info-banner"
            startAccessory={
              siteMetadata.iconUrl ? (
                <AvatarFavicon
                  name={siteMetadata.name ?? siteHost}
                  size={AvatarFaviconSize.Xs}
                  src={siteMetadata.iconUrl}
                  className="mt-1"
                />
              ) : undefined
            }
          >
            <Text
              variant={DSTextVariant.BodySm}
              color={TextColor.TextAlternative}
            >
              {t('sitePermissionsBanner', [
                <Text
                  key="siteHost"
                  asChild
                  variant={DSTextVariant.BodySm}
                  color={TextColor.TextAlternative}
                  fontWeight={FontWeight.Bold}
                >
                  <span>{siteHost}</span>
                </Text>,
              ])}
            </Text>
          </BannerBase>
        )}
        <MultichainAccountList
          wallets={walletsWithSupportedAccountGroups}
          selectedAccountGroups={selectedAccountGroups}
          handleAccountClick={handleAccountClick}
          showAccountCheckbox={true}
        />
      </ScrollContainer>
      <Footer>
        <Button
          data-testid="connect-more-accounts-button"
          onClick={handleConnect}
          variant={ButtonVariant.Primary}
          size={ButtonSize.Lg}
          isDisabled={isSaveDisabled}
          isFullWidth
        >
          {confirmButtonText ?? t('connect')}
        </Button>
      </Footer>
      {showDisconnectModal.value && siteMetadata && (
        <DisconnectAllModal
          onClick={handleDisconnectConfirm}
          onClose={showDisconnectModal.setFalse}
          origin={siteMetadata.origin}
        />
      )}
    </Page>
  );
};
