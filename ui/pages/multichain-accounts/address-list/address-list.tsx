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
import { getSelectedInternalAccount } from '../../../selectors/accounts';

export const AddressList = () => {
  const t = useI18nContext();
  const history = useHistory();
  const selectedAccount = useSelector(getSelectedInternalAccount);

  // MultichainAddressRowsList expects an array of accounts
  const accounts = selectedAccount ? [selectedAccount] : [];

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
        {selectedAccount?.metadata?.name || t('account')} / {t('addresses')}
      </Header>
      <Content className="p-0">
        <Box flexDirection={BoxFlexDirection.Column}>
          <MultichainAddressRowsList accounts={accounts} />
        </Box>
      </Content>
    </Page>
  );
};
