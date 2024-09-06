import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useHistory, useParams } from 'react-router-dom';
import { NonEmptyArray } from '@metamask/utils';
import {
  AlignItems,
  BackgroundColor,
  BlockSize,
  Display,
  FlexDirection,
  IconColor,
  JustifyContent,
  TextAlign,
  TextVariant,
} from '../../../helpers/constants/design-system';
import { getURLHost } from '../../../helpers/utils/util';
import { useI18nContext } from '../../../hooks/useI18nContext';
import {
  getConnectedSitesList,
  getSelectedAccountsForDappConnection,
  getNonTestNetworks,
  getOrderedConnectedAccountsForConnectedDapp,
  getPermissionSubjects,
  getPermittedChainsForSelectedTab,
  getSelectedInternalAccount,
  getSelectedNetworksForDappConnection,
  getTestNetworks,
} from '../../../selectors';
import {
  AvatarFavicon,
  AvatarFaviconSize,
  Box,
  Button,
  ButtonIcon,
  ButtonIconSize,
  ButtonSecondarySize,
  ButtonSize,
  ButtonVariant,
  Icon,
  IconName,
  IconSize,
  Text,
} from '../../../components/component-library/index';
import {
  Content,
  Footer,
  Header,
  Page,
} from '../../../components/multichain/pages/page/index';
import { SiteCell } from '../../../components/multichain/pages/review-permissions-page/index';

export const ConnectPage = ({
  request,
  rejectPermissionsRequest,
  permissionsRequestId,
  approveConnection,
  accounts,
  selectAccounts,
  selectNewAccountViaModal,
  selectedAccountAddresses,
  activeTabOrigin,
}: {
  request: any;
  permissionsRequestId: string;
  rejectPermissionsRequest: () => void;
  approveConnection: (requestId: string) => void;
}) => {
  const t = useI18nContext();
  const networksList = useSelector(getNonTestNetworks);
  const selectednetworksList = useSelector(
    getSelectedNetworksForDappConnection,
  );
  const testNetworks = useSelector(getTestNetworks);
  const combinedNetworks = [...networksList, ...testNetworks];
  console.log(combinedNetworks, selectednetworksList);

  const currentAccount = useSelector(getSelectedInternalAccount);
  const [selectedAccounts, setSelectedAccounts] = useState(
    selectedAccountAddresses,
  );
  // const evmAccounts = accounts.filter((account) =>
  //   isEvmAccountType(account.type),
  // );
  const selectedAccountsForDappConnection = useSelector(
    getSelectedAccountsForDappConnection,
  );
  const handleAccountClick = (address) => {
    const newSelectedAccounts = new Set(selectedAccounts);
    if (newSelectedAccounts.has(address)) {
      newSelectedAccounts.delete(address);
    } else {
      newSelectedAccounts.add(address);
    }
    setSelectedAccounts(newSelectedAccounts);
  };
  const filteredNetworksByChainId = () => {
    // Ensure that selectednetworksList is an array before filtering
    if (Array.isArray(selectednetworksList)) {
      return combinedNetworks.filter((network) =>
        selectednetworksList.includes(network.chainId),
      );
    } else {
      // Return an empty array or handle cases when selectednetworksList is not an array
      console.warn('selectednetworksList is not an array');
      return [];
    }
  };
  const filteredNetworks = filteredNetworksByChainId();

  const approvedAccounts =
    selectedAccountsForDappConnection.length > 0
      ? selectedAccountsForDappConnection
      : [currentAccount.address];
  const approvedNetworks =
    filteredNetworks?.length > 0 ? filteredNetworks : networksList;
  // TODO we should check if there are actually specifically requested accounts and preselect them and otherwise default
  // to the currentAccount
  const onConfirm = () => {
    const _request = {
      ...request,
      permissions: { ...request.permissions },
      approvedAccounts: approvedAccounts,
      approvedChainIds: approvedNetworks.map((network) => network.chainId),
    };
    approveConnection(_request);
  };
  const filterAccountsByAddress = accounts.filter((account) =>
    approvedAccounts.includes(account.address),
  );

  return (
    <Page
      data-testid="connections-page"
      className="main-container connections-page"
    >
      <Header backgroundColor={BackgroundColor.backgroundDefault}>
        <Text>Connect with MetaMask</Text>
        <Text>This site wants to: </Text>
      </Header>
      <Content padding={0}>
        <SiteCell
          networks={approvedNetworks}
          accounts={filterAccountsByAddress}
          selectNewAccountViaModal={selectNewAccountViaModal}
          handleAccountClick={handleAccountClick}
          onAccountsClick={() => selectAccounts(selectedAccounts)}
          onNetworksClick={() => console.log('testing')}
          approvedAccounts={approvedAccounts}
          activeTabOrigin={activeTabOrigin}
        />
      </Content>
      <Footer>
        <Box display={Display.Flex} gap={4} width={BlockSize.Full}>
          <Button
            block
            variant={ButtonVariant.Secondary}
            size={ButtonSize.Lg}
            data-testid="cancel-btn"
            onClick={rejectPermissionsRequest}
          >
            {t('cancel')}
          </Button>
          <Button
            block
            data-testid="confirm-btn"
            size={ButtonSize.Lg}
            onClick={onConfirm}
          >
            {t('confirm')}
          </Button>
        </Box>
      </Footer>{' '}
    </Page>
  );
};
