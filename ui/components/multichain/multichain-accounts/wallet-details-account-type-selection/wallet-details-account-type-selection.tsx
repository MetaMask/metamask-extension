import React from 'react';
import { useSelector } from 'react-redux';
import {
  AlignItems,
  Display,
  FlexDirection,
  JustifyContent,
  TextColor,
  TextVariant,
} from '../../../../helpers/constants/design-system';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import {
  ButtonIcon,
  ButtonLink,
  ButtonLinkSize,
  IconName,
  IconSize,
  ModalBody,
  ModalHeader,
  Text,
  Box,
} from '../../../component-library';
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
          display={Display.Flex}
          flexDirection={FlexDirection.Column}
          justifyContent={JustifyContent.flexStart}
          alignItems={AlignItems.flexStart}
        >
          <Text
            variant={TextVariant.bodySmMedium}
            marginBottom={2}
            color={TextColor.textAlternative}
          >
            {t('createNewAccountHeader')}
          </Text>
          <ButtonLink
            marginBottom={2}
            size={ButtonLinkSize.Sm}
            startIconName={IconName.Add}
            startIconProps={{ size: IconSize.Md }}
            onClick={() => onAccountTypeSelect(EVM_WALLET_TYPE)}
            data-testid="wallet-details-add-ethereum-account"
          >
            {t('addNewEthereumAccountLabel')}
          </ButtonLink>
          {solanaSupportEnabled && (
            <ButtonLink
              marginBottom={2}
              size={ButtonLinkSize.Sm}
              startIconName={IconName.Add}
              startIconProps={{ size: IconSize.Md }}
              onClick={() => onAccountTypeSelect(WalletClientType.Solana)}
              data-testid="wallet-details-add-solana-account"
            >
              {t('addNewSolanaAccountLabel')}
            </ButtonLink>
          )}
          {bitcoinSupportEnabled && (
            <ButtonLink
              size={ButtonLinkSize.Sm}
              startIconName={IconName.Add}
              startIconProps={{ size: IconSize.Md }}
              onClick={() => onAccountTypeSelect(WalletClientType.Bitcoin)}
              data-testid="wallet-details-add-bitcoin-account"
            >
              {t('addBitcoinAccountLabel')}
            </ButtonLink>
          )}
          {tronSupportEnabled && (
            <ButtonLink
              size={ButtonLinkSize.Sm}
              startIconName={IconName.Add}
              startIconProps={{ size: IconSize.Md }}
              onClick={() => onAccountTypeSelect(WalletClientType.Tron)}
              data-testid="wallet-details-add-tron-account"
            >
              {t('addNewTronAccountLabel')}
            </ButtonLink>
          )}
        </Box>
      </ModalBody>
    </>
  );
};
