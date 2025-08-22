import React from 'react';

import { useHistory } from 'react-router-dom';
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
  const accounts = useSelector(getInternalAccountsFromSelectedGroup);
  const selectedAccountGroup = useSelector(getSelectedAccountGroup);
  const accountGroup = useSelector((state) =>
    selectedAccountGroup
      ? getMultichainAccountGroupById(state, selectedAccountGroup)
      : null,
  );

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
        {accountGroup?.metadata?.name || t('account')} / {t('addresses')}
      </Header>
      <Content className="p-0">
        <Box flexDirection={BoxFlexDirection.Column}>
          <MultichainAddressRowsList accounts={accounts} />
        </Box>
      </Content>
    </Page>
  );
};
