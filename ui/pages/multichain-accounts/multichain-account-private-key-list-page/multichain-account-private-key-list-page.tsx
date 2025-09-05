import React, { useCallback } from 'react';
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

  const decodedAccountGroupId = accountGroupId
    ? (decodeURIComponent(accountGroupId) as AccountGroupId)
    : null;

  const getAccountGroupName = useCallback(() => {
    if (decodedAccountGroupId) {
      const account = useSelector((state) =>
        getMultichainAccountGroupById(state, decodedAccountGroupId),
      );
      return account.metadata.name;
    }
    return t('account');
  }, [decodedAccountGroupId, t]);

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
        {getAccountGroupName()} / {t('privateKeys')}
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
