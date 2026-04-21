import React, { useCallback, useState } from 'react';
import {
  Box,
  Text,
  TextVariant,
  TextColor,
  FontWeight,
  Checkbox,
  Button,
  AvatarAccount,
  AvatarAccountSize,
  twMerge,
  AvatarGroup,
  AvatarGroupVariant,
  AvatarAccountVariant,
  AvatarGroupSize,
} from '@metamask/design-system-react';
import { CaipChainId } from '@metamask/utils';
import { AddDeviceSettingsStep } from '../constant';
import { useI18nContext } from '../../../../hooks/useI18nContext';

type AddWalletsProps = {
  onAddWallets: (type: AddDeviceSettingsStep) => void;
};

const WalletItem = ({
  id,
  isSelected,
  onChange,
}: {
  id: string;
  isSelected: boolean;
  onChange: () => void;
}) => {
  const t = useI18nContext();

  return (
    <Box
      className={twMerge(
        'flex flex-row gap-2 items-center justify-between p-4',
        isSelected ? 'bg-primary-muted' : 'bg-background-default',
      )}
      onClick={onChange}
    >
      <Box className="flex flex-row flex-1 items-center gap-3">
        <Box onClick={(event) => event.stopPropagation()}>
          <Checkbox isSelected={isSelected} onChange={onChange} id={id} />
        </Box>
        <AvatarAccount
          shape="circle"
          address="0x1234567890123456789012345678901234567890"
          size={AvatarAccountSize.Md}
        />
        <Box className="flex flex-col gap-1">
          <Text
            variant={TextVariant.BodyMd}
            fontWeight={FontWeight.Medium}
            color={TextColor.TextDefault}
          >
            Defi wallet
          </Text>
          <Text
            variant={TextVariant.BodySm}
            fontWeight={FontWeight.Medium}
            color={TextColor.TextAlternative}
          >
            0x34567...a3456
          </Text>
        </Box>
      </Box>
      <Box className="flex flex-col items-end justify-end gap-1">
        <Text
          variant={TextVariant.BodyMd}
          fontWeight={FontWeight.Medium}
          color={TextColor.TextDefault}
        >
          $1,234.45
        </Text>
        <AvatarGroup
          variant={AvatarGroupVariant.Account}
          size={AvatarGroupSize.Xs}
          avatarPropsArr={[
            {
              variant: AvatarAccountVariant.Jazzicon,
              address: '0x123...',
            },
            {
              variant: AvatarAccountVariant.Blockies,
              address: '0x456...',
            },
            {
              variant: AvatarAccountVariant.Jazzicon,
              address: '0x789...',
            },
          ]}
        />
      </Box>
    </Box>
  );
};

const AddWallets = ({ onAddWallets }: AddWalletsProps) => {
  const [isSelectAll, setIsSelectAll] = useState(false);
  const t = useI18nContext();
  const [wallets, setWallets] = useState([
    {
      isSelected: false,
      name: 'Defi wallet 1',
      address: '1',
    },
    {
      isSelected: false,
      name: 'Defi wallet 2',
      address: '2',
    },
    {
      isSelected: false,
      name: 'Defi wallet 3',
      address: '3',
    },
  ]);

  const handleSelectAll = () => {
    const newValue = !isSelectAll;
    setWallets(wallets.map((w) => ({ ...w, isSelected: newValue })));
    setIsSelectAll(newValue);
  };

  const handleSelectWallet = useCallback(
    (address: string) => {
      const updatedWallets = wallets.map((w) =>
        w.address === address ? { ...w, isSelected: !w.isSelected } : w,
      );
      setWallets(updatedWallets);
      setIsSelectAll(updatedWallets.every((w) => w.isSelected));
    },
    [wallets],
  );

  return (
    <Box className="p-4 flex flex-1 flex-col gap-4">
      <Box className="flex-col gap-1 px-4">
        <Text
          variant={TextVariant.HeadingLg}
          fontWeight={FontWeight.Bold}
          color={TextColor.TextDefault}
        >
          Add Wallets
        </Text>
        <Text variant={TextVariant.BodyMd} color={TextColor.TextAlternative}>
          {t('add_wallets_desc')}
        </Text>
      </Box>
      <Box className="flex flex-col gap-3">
        <Checkbox
          isSelected={isSelectAll}
          onChange={handleSelectAll}
          label={t('select_all')}
          className="px-4"
          id="add-wallet-select-all-checkbox"
        />
        <Box className="flex-col">
          {wallets.map((wallet) => (
            <WalletItem
              key={wallet.address}
              id={`add-wallet-checkbox-${wallet.address}`}
              isSelected={wallet.isSelected}
              onChange={() => handleSelectWallet(wallet.address)}
            />
          ))}
        </Box>
      </Box>
      <Box className="w-full mt-auto px-4">
        <Button
          className="w-full"
          onClick={() => onAddWallets(AddDeviceSettingsStep.ScanQrCode)}
        >
          {t('add_wallets')}
        </Button>
      </Box>
    </Box>
  );
};
export default AddWallets;
