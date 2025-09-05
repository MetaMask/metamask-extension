import React, { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { useHistory, useParams } from 'react-router-dom';
import {
  Box,
  BoxFlexDirection,
  ButtonIcon,
  ButtonIconSize,
  IconName,
} from '@metamask/design-system-react';
import { AccountGroupId } from '@metamask/account-api';
import {
  Content,
  Header,
  Page,
} from '../../../components/multichain/pages/page';
import { TextVariant } from '../../../helpers/constants/design-system';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { MultichainPrivateKeyList } from '../../../components/multichain-accounts/multichain-private-key-list';
import {
  BannerAlert,
  BannerAlertSeverity,
} from '../../../components/component-library';
import { getMultichainAccountGroupById } from '../../../selectors/multichain-accounts/account-tree';

export const MultichainAccountPrivateKeyListPage = () => {
  const t = useI18nContext();
  const history = useHistory();
  const { accountGroupId } = useParams<{ accountGroupId: string }>();

  const decodedAccountGroupId: AccountGroupId | null = accountGroupId
    ? (decodeURIComponent(accountGroupId) as AccountGroupId)
    : null;

  const account = useSelector((state) =>
    decodedAccountGroupId
      ? getMultichainAccountGroupById(state, decodedAccountGroupId)
      : null,
  );

  // Compute the account group name using `useMemo`
  const accountGroupName = useMemo(() => {
    return account ? account.metadata.name : t('account');
  }, [account, t]);

  return (
    <Page className="max-w-[600px]">
      <Header
        textProps={{
          variant: TextVariant.headingSm,
        }}
        startAccessory={
          <ButtonIcon
            size={ButtonIconSize.Md}
            ariaLabel={t('back')}
            iconName={IconName.ArrowLeft}
            onClick={() => history.goBack()}
            data-testid="multichain-account-address-list-page-back-button"
          />
        }
      >
        {accountGroupName} / {t('privateKeys')}
      </Header>
      <Content>
        <BannerAlert
          data-testid="backup-state-banner-alert"
          title={t('revealMultichainPrivateKeysBannerTitle')}
          description={t('revealMultichainPrivateKeysBannerDescription')}
          paddingTop={2}
          paddingBottom={2}
          severity={BannerAlertSeverity.Danger}
        />
        <Box flexDirection={BoxFlexDirection.Column}>
          {decodedAccountGroupId ? (
            <MultichainPrivateKeyList groupId={decodedAccountGroupId} />
          ) : null}
        </Box>
      </Content>
    </Page>
  );
};
