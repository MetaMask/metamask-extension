import React, { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom-v5-compat';
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
import {
  TextVariant,
  AlignItems,
} from '../../../helpers/constants/design-system';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { MultichainPrivateKeyList } from '../../../components/multichain-accounts/multichain-private-key-list';
import {
  BannerAlert,
  BannerAlertSeverity,
  ButtonLink,
  ButtonLinkSize,
} from '../../../components/component-library';
import { getMultichainAccountGroupById } from '../../../selectors/multichain-accounts/account-tree';
import ZENDESK_URLS from '../../../helpers/constants/zendesk-url';
import { PREVIOUS_ROUTE } from '../../../helpers/constants/routes';

type MultichainAccountPrivateKeyListPageProps = {
  params?: { accountGroupId: string };
};

export const MultichainAccountPrivateKeyListPage = ({
  params: propsParams,
}: MultichainAccountPrivateKeyListPageProps = {}) => {
  const t = useI18nContext();
  const navigate = useNavigate();
  const hookParams = useParams<{ accountGroupId: string }>();

  const { accountGroupId } = propsParams || hookParams;

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

  const learnMoreLink = (
    <ButtonLink
      size={ButtonLinkSize.Inherit}
      textProps={{
        variant: TextVariant.bodyMd,
        alignItems: AlignItems.flexStart,
      }}
      as="a"
      href={ZENDESK_URLS.PRIVATE_KEY_GUIDE}
      target="_blank"
      rel="noopener noreferrer"
    >
      {t('learnMoreUpperCase')}
    </ButtonLink>
  );

  return (
    <Page>
      <Header
        textProps={{
          variant: TextVariant.headingSm,
        }}
        startAccessory={
          <ButtonIcon
            size={ButtonIconSize.Md}
            ariaLabel={t('back')}
            iconName={IconName.ArrowLeft}
            onClick={() => navigate(PREVIOUS_ROUTE)}
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
          paddingTop={2}
          paddingBottom={2}
          severity={BannerAlertSeverity.Danger}
        >
          {t('revealMultichainPrivateKeysBannerDescription', [learnMoreLink])}
        </BannerAlert>
        <Box flexDirection={BoxFlexDirection.Column}>
          {decodedAccountGroupId ? (
            <MultichainPrivateKeyList
              groupId={decodedAccountGroupId}
              goBack={() => navigate(PREVIOUS_ROUTE)}
              data-testid="multichain-account-private-key-list"
            />
          ) : null}
        </Box>
      </Content>
    </Page>
  );
};
