import React from 'react';
import { useSelector } from 'react-redux';
import {
  Box,
  BoxAlignItems,
  BoxFlexDirection,
  BoxJustifyContent,
  ButtonIcon,
  ButtonIconSize,
  FontWeight,
  IconName,
  IconSize,
  Text,
  TextButton,
  TextButtonSize,
  TextColor,
  TextVariant,
} from '@metamask/design-system-react';
import { ModalBody, ModalHeader } from '../../../component-library';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import {
  WalletClientType,
  EVM_WALLET_TYPE,
} from '../../../../hooks/accounts/useMultichainWalletSnapClient';
import {
  getIsSolanaSupportEnabled,
  getIsBitcoinSupportEnabled,
  getIsTronSupportEnabled,
} from '../../../../selectors';

type WalletDetailsAccountTypeSelectionProps = {
  onAccountTypeSelect: (
    accountType: WalletClientType | typeof EVM_WALLET_TYPE,
  ) => void;
  onClose: () => void;
};

export const WalletDetailsAccountTypeSelection: React.FC<
  WalletDetailsAccountTypeSelectionProps
> = ({ onAccountTypeSelect, onClose }) => {
  const t = useI18nContext();
  const bitcoinSupportEnabled = useSelector(getIsBitcoinSupportEnabled);
  const solanaSupportEnabled = useSelector(getIsSolanaSupportEnabled);
  const tronSupportEnabled = useSelector(getIsTronSupportEnabled);

  return (
    <>
      <ModalHeader
        endAccessory={
          <ButtonIcon
            size={ButtonIconSize.Md}
            iconName={IconName.Close}
            onClick={onClose}
            ariaLabel={t('close')}
          />
        }
        padding={4}
      >
        {t('newAccount')}
      </ModalHeader>
      <ModalBody>
        <Box
          paddingLeft={4}
          paddingRight={4}
          paddingBottom={4}
          flexDirection={BoxFlexDirection.Column}
          justifyContent={BoxJustifyContent.Start}
          alignItems={BoxAlignItems.Start}
        >
          <Text
            variant={TextVariant.BodySm}
            fontWeight={FontWeight.Medium}
            className="mb-2"
            color={TextColor.TextAlternative}
          >
            {t('createNewAccountHeader')}
          </Text>
          <TextButton
            className="mb-2"
            size={TextButtonSize.BodySm}
            startIconName={IconName.Add}
            startIconProps={{ size: IconSize.Md }}
            onClick={() => onAccountTypeSelect(EVM_WALLET_TYPE)}
            data-testid="wallet-details-add-ethereum-account"
          >
            {t('addNewEthereumAccountLabel')}
          </TextButton>
          {solanaSupportEnabled && (
            <TextButton
              className="mb-2"
              size={TextButtonSize.BodySm}
              startIconName={IconName.Add}
              startIconProps={{ size: IconSize.Md }}
              onClick={() => onAccountTypeSelect(WalletClientType.Solana)}
              data-testid="wallet-details-add-solana-account"
            >
              {t('addNewSolanaAccountLabel')}
            </TextButton>
          )}
          {bitcoinSupportEnabled && (
            <TextButton
              size={TextButtonSize.BodySm}
              startIconName={IconName.Add}
              startIconProps={{ size: IconSize.Md }}
              onClick={() => onAccountTypeSelect(WalletClientType.Bitcoin)}
              data-testid="wallet-details-add-bitcoin-account"
            >
              {t('addBitcoinAccountLabel')}
            </TextButton>
          )}
          {tronSupportEnabled && (
            <TextButton
              size={TextButtonSize.BodySm}
              startIconName={IconName.Add}
              startIconProps={{ size: IconSize.Md }}
              onClick={() => onAccountTypeSelect(WalletClientType.Tron)}
              data-testid="wallet-details-add-tron-account"
            >
              {t('addNewTronAccountLabel')}
            </TextButton>
          )}
        </Box>
      </ModalBody>
    </>
  );
};
