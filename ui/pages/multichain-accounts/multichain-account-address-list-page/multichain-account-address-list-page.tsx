import React from 'react';

import { useHistory, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  Box,
  BoxFlexDirection,
  ButtonIcon,
  ButtonIconSize,
  IconName,
} from '@metamask/design-system-react';
import {
  Content,
  Header,
  Page,
} from '../../../components/multichain/pages/page';
import { TextVariant } from '../../../helpers/constants/design-system';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { MultichainAddressRowsList } from '../../../components/multichain-accounts/multichain-address-rows-list';
import {
  getInternalAccountsFromSelectedGroup,
  getSelectedAccountGroup,
  getMultichainAccountGroupById,
} from '../../../selectors/multichain-accounts/account-tree';

export const MultichainAccountAddressListPage = () => {
  const t = useI18nContext();
  const history = useHistory();
  const location = useLocation();
  const accounts = useSelector(getInternalAccountsFromSelectedGroup);
  const selectedAccountGroup = useSelector(getSelectedAccountGroup);
  const accountGroup = useSelector((state) =>
    selectedAccountGroup
      ? getMultichainAccountGroupById(state, selectedAccountGroup)
      : null,
  );

  // Check if we're in "receive" mode based on query parameter
  const searchParams = new URLSearchParams(location.search);
  const isReceiveMode = searchParams.get('source') === 'receive';

  // Determine the page title based on the mode
  const pageTitle = isReceiveMode
    ? t('receivingAddress')
    : `${accountGroup?.metadata?.name || t('account')} / ${t('addresses')}`;

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
          />
        }
      >
        {pageTitle}
      </Header>
      <Content className="p-0">
        <Box flexDirection={BoxFlexDirection.Column}>
          <MultichainAddressRowsList accounts={accounts} />
        </Box>
      </Content>
    </Page>
  );
};
