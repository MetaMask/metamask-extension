import React, { useMemo, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { type AccountGroupId } from '@metamask/account-api';
import { CaipChainId } from '@metamask/utils';
import { InternalAccount } from '@metamask/keyring-internal-api';
import { useI18nContext } from '../../../hooks/useI18nContext';
import {
  BackgroundColor,
  BlockSize,
  BorderRadius,
  Display,
  FlexDirection,
  TextAlign,
  TextColor,
  TextVariant,
} from '../../../helpers/constants/design-system';
import {
  Box,
  Text,
  TextFieldSearch,
  TextFieldSearchSize,
} from '../../component-library';
import { useCopyToClipboard } from '../../../hooks/useCopyToClipboard';
import { MultichainAddressRow } from '../multichain-address-row/multichain-address-row';
import { getInternalAccountListSpreadByScopesByGroupId } from '../../../selectors/multichain-accounts/account-tree';

export type MultichainAddressRowsListProps = {
  /**
   * The account group ID.
   */
  groupId: AccountGroupId;
  /**
   * Callback for when QR code button is clicked
   */
  onQrClick: (
    address: string,
    networkName: string,
    networkImageSrc?: string,
  ) => void;
};

export const MultichainAddressRowsList = ({
  groupId,
  onQrClick,
}: MultichainAddressRowsListProps) => {
  const t = useI18nContext();
  const [searchPattern, setSearchPattern] = React.useState<string>('');
  const [, handleCopy] = useCopyToClipboard();

  const getAccountsSpreadByNetworkByGroupId = useSelector((state) =>
    getInternalAccountListSpreadByScopesByGroupId(state, groupId),
  );

  const filteredItems = useMemo(() => {
    if (!searchPattern.trim()) {
      return getAccountsSpreadByNetworkByGroupId;
    }

    const pattern = searchPattern.toLowerCase();
    const filtered = getAccountsSpreadByNetworkByGroupId.filter(
      ({ networkName, account }) => {
        return (
          networkName.toLowerCase().includes(pattern) ||
          account.address.toLowerCase().includes(pattern)
        );
      },
    );

    return filtered;
  }, [getAccountsSpreadByNetworkByGroupId, searchPattern]);

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchPattern(event.target.value);
  };

  const handleClearSearch = () => {
    setSearchPattern('');
  };

  const renderAddressItem = useCallback(
    (
      item: {
        scope: CaipChainId;
        account: InternalAccount;
        networkName: string;
      },
      index: number,
    ): React.JSX.Element => {
      const handleCopyClick = () => {
        handleCopy(item.account.address);
      };

      return (
        <MultichainAddressRow
          key={`${item.account.address}-${item.scope}-${index}`}
          chainId={item.scope}
          networkName={item.networkName}
          address={item.account.address}
          copyActionParams={{
            message: t('multichainAccountAddressCopied'),
            callback: handleCopyClick,
          }}
          qrActionParams={{
            callback: onQrClick,
          }}
        />
      );
    },
    [handleCopy, onQrClick, t],
  );

  const renderedRows = useMemo(() => {
    return filteredItems.map((item, index) => renderAddressItem(item, index));
  }, [filteredItems, renderAddressItem]);

  return (
    <Box
      display={Display.Flex}
      flexDirection={FlexDirection.Column}
      data-testid="multichain-address-rows-list"
    >
      <TextFieldSearch
        size={TextFieldSearchSize.Lg}
        placeholder={t('searchNetworks')}
        value={searchPattern}
        onChange={handleSearchChange}
        clearButtonOnClick={handleClearSearch}
        width={BlockSize.Full}
        borderWidth={0}
        backgroundColor={BackgroundColor.backgroundMuted}
        borderRadius={BorderRadius.LG}
        data-testid="multichain-address-rows-list-search"
      />

      <Box>
        {filteredItems.length > 0 ? (
          renderedRows
        ) : (
          <Text
            variant={TextVariant.bodyMd}
            color={TextColor.textAlternative}
            textAlign={TextAlign.Center}
            paddingTop={8}
            data-testid="multichain-address-rows-list-empty-message"
          >
            {searchPattern ? t('noNetworksFound') : t('noNetworksAvailable')}
          </Text>
        )}
      </Box>
    </Box>
  );
};

export default MultichainAddressRowsList;
