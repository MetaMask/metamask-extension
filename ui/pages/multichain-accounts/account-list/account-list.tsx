import React from 'react';

import { useHistory } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  Box,
  ButtonIcon,
  ButtonIconSize,
  IconName,
} from '../../../components/component-library';
import {
  Content,
  Header,
  Page,
} from '../../../components/multichain/pages/page';
import {
  Display,
  FlexDirection,
  TextVariant,
} from '../../../helpers/constants/design-system';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { MultichainAccountList } from '../../../components/multichain-accounts/multichain-account-list';
import { getAccountTree } from '../../../selectors/multichain-accounts/account-tree';

export const AccountList = () => {
  const t = useI18nContext();
  const history = useHistory();
  const accountTree = useSelector(getAccountTree);
  const { wallets } = accountTree;
  const { selectedAccountGroup } = accountTree;

  return (
    <Page className="account-list-page">
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
          />
        }
      >
        {t('accounts')}
      </Header>
      <Content className="account-list-page__content">
        <Box display={Display.Flex} flexDirection={FlexDirection.Column}>
          <MultichainAccountList
            wallets={wallets}
            selectedAccountGroup={selectedAccountGroup}
          />
        </Box>
      </Content>
    </Page>
  );
};
