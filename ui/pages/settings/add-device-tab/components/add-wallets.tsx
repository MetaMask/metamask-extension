import React, { useCallback, useState } from 'react';
import { useSelector } from 'react-redux';
import { AccountGroupId } from '@metamask/account-api';
import {
  Box,
  Text,
  TextVariant,
  TextColor,
  FontWeight,
  Button,
} from '@metamask/design-system-react';
import { AddDeviceSettingsStep } from '../constant';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import { MultichainAccountList } from '../../../../components/multichain-accounts/multichain-account-list';
import { getAccountTree } from '../../../../selectors/multichain-accounts/account-tree';
import { ScrollContainer } from '../../../../contexts/scroll-container';

type AddWalletsProps = {
  onAddWallets: (type: AddDeviceSettingsStep) => void;
};

const AddWallets = (_props: AddWalletsProps) => {
  const t = useI18nContext();
  const { wallets } = useSelector(getAccountTree);
  const [selectedAccountGroups, setSelectedAccountGroups] = useState<
    AccountGroupId[]
  >([]);

  const handleAccountClick = useCallback((accountGroupId: AccountGroupId) => {
    setSelectedAccountGroups((prev) =>
      prev.includes(accountGroupId)
        ? prev.filter((id) => id !== accountGroupId)
        : [...prev, accountGroupId],
    );
  }, []);

  return (
    <Box className="p-4 flex flex-1 flex-col gap-4">
      <Box className="flex-col gap-1 px-4">
        <Text
          variant={TextVariant.HeadingLg}
          fontWeight={FontWeight.Bold}
          color={TextColor.TextDefault}
        >
          {t('add_wallets')}
        </Text>
        <Text variant={TextVariant.BodyMd} color={TextColor.TextAlternative}>
          {t('add_wallets_desc')}
        </Text>
      </Box>
      <ScrollContainer className="flex flex-1 flex-col overflow-y-auto mt-4">
        <MultichainAccountList
          wallets={wallets}
          selectedAccountGroups={selectedAccountGroups}
          handleAccountClick={handleAccountClick}
          showAccountCheckbox={true}
        />
      </ScrollContainer>
      <Box className="w-full mt-auto px-4">
        <Button
          className="w-full"
          onClick={() =>
            console.log('Selected account groups:', selectedAccountGroups)
          }
        >
          {t('add_wallets')}
        </Button>
      </Box>
    </Box>
  );
};
export default AddWallets;
