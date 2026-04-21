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
  AvatarGroup,
  AvatarAccountVariant,
  AvatarGroupVariant,
  AvatarGroupSize,
  twMerge,
} from '@metamask/design-system-react';
import { CaipChainId } from '@metamask/utils';
import { AddDeviceSettingsStep } from '../constant';
import { useI18nContext } from '../../../../hooks/useI18nContext';

type AddWalletsProps = {
  onAddWallets: (type: AddDeviceSettingsStep) => void;
};

const ETHEREUM_CAIP = 'eip155:1' as CaipChainId;
const USDC_ADDRESS = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48';
const DAI_ADDRESS = '0x6B175474E89094C44Da98b954EedeAC495271d0F';

const STABLECOIN_AVATAR_PROPS = [
  {
    variant: AvatarAccountVariant.Jazzicon,
    address: USDC_ADDRESS,
  },
  {
    variant: AvatarAccountVariant.Jazzicon,
    address: ETHEREUM_CAIP,
  },
  {
    variant: AvatarAccountVariant.Jazzicon,
    address: DAI_ADDRESS,
  },
];

const WalletItem = ({
  isSelected,
  onChange,
}: {
  isSelected: boolean;
  onChange: () => void;
}) => {
  const t = useI18nContext();

  return (
    <Box
      className={twMerge(
        'flex-row gap-2 items-center justify-between p-4',
        isSelected ? 'bg-primary-muted' : 'bg-background-default',
      )}
      onClick={onChange}
    >
      <Box className="flex-row flex-1 items-center gap-3">
        <Checkbox
          isSelected={isSelected}
          onChange={onChange}
          id="add-wallet-checkbox"
        />
        <AvatarAccount
          shape="circle"
          address="0x1234567890123456789012345678901234567890"
          size={AvatarAccountSize.Md}
        />
        <Box className="flex-col gap-1">
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
      <Box className="flex-col items-end justify-end gap-1">
        <Text
          variant={TextVariant.BodyMd}
          fontWeight={FontWeight.Medium}
          color={TextColor.TextDefault}
        >
          $1,234.45
        </Text>
        <AvatarGroup
          size={AvatarGroupSize.Xs}
          max={1}
          variant={AvatarGroupVariant.Account}
          avatarPropsArr={STABLECOIN_AVATAR_PROPS}
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
    <Box className="p-4 pt-0 px-0 flex-1 flex-col gap-4">
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
      <Box className="flex-col gap-3">
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
