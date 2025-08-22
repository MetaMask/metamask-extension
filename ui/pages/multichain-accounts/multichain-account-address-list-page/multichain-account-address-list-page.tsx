import React from 'react';

import { useHistory, useLocation, useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
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
import { MultichainAddressRowsList } from '../../../components/multichain-accounts/multichain-address-rows-list';
import {
  getInternalAccountsFromGroupById,
  getMultichainAccountGroupById,
} from '../../../selectors/multichain-accounts/account-tree';

export const MultichainAccountAddressListPage = () => {
  const t = useI18nContext();
  const history = useHistory();
  const location = useLocation();
  const { accountGroupId } = useParams<{ accountGroupId: string }>();

  // Decode the account group ID from the URL parameter and cast to proper type
  const decodedAccountGroupId = accountGroupId
    ? (decodeURIComponent(accountGroupId) as AccountGroupId)
    : null;

  // Get accounts for the specific group from the URL
  const accounts = useSelector((state) =>
    getInternalAccountsFromGroupById(state, decodedAccountGroupId),
  );

  // Get the account group details using the URL parameter
  const accountGroup = useSelector((state) =>
    decodedAccountGroupId
      ? getMultichainAccountGroupById(state, decodedAccountGroupId)
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
      <Content>
        <Box flexDirection={BoxFlexDirection.Column}>
          <MultichainAddressRowsList accounts={accounts} />
        </Box>
      </Content>
    </Page>
  );
};
