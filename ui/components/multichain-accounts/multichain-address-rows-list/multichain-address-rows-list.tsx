import React, { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { type AccountGroupId } from '@metamask/account-api';
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
import { MultichainAddressRow } from '../multichain-address-row/multichain-address-row';
import { getInternalAccountListSpreadByScopesByGroupId } from '../../../selectors/multichain-accounts/account-tree';

export type MultichainAddressRowsListProps = {
  /**
   * Array of InternalAccount objects to determine compatible networks for
   */
  groupId: AccountGroupId;
};

export const MultichainAddressRowsList = ({
  groupId,
}: MultichainAddressRowsListProps) => {
  const t = useI18nContext();
  const [searchPattern, setSearchPattern] = React.useState<string>('');

  const getAccountSpreadByNetworkByGroupId = useSelector((state) =>
    getInternalAccountListSpreadByScopesByGroupId(state, groupId),
  );

  const filteredItems = useMemo(() => {
    if (!searchPattern.trim()) {
      return getAccountSpreadByNetworkByGroupId;
    }

    const pattern = searchPattern.toLowerCase();
    const filtered = getAccountSpreadByNetworkByGroupId.filter(
      ({ networkName, account }) => {
        return (
          networkName.toLowerCase().includes(pattern) ||
          account.address.toLowerCase().includes(pattern)
        );
      },
    );

    return filtered;
  }, [getAccountSpreadByNetworkByGroupId, searchPattern]);

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchPattern(event.target.value);
  };

  const handleClearSearch = () => {
    setSearchPattern('');
  };

  const renderedRows = useMemo(() => {
    return filteredItems.map((item, index) => (
      <MultichainAddressRow
        key={`${item.account.address}-${item.scope}-${index}`}
        chainId={item.scope}
        networkName={item.networkName}
        address={item.account.address}
      />
    ));
  }, [filteredItems]);

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
