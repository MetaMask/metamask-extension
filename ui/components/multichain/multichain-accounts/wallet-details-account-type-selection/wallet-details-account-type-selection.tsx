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
  ///: BEGIN:ONLY_INCLUDE_IF(bitcoin)
  getIsBitcoinSupportEnabled,
  ///: END:ONLY_INCLUDE_IF
  ///: BEGIN:ONLY_INCLUDE_IF(tron)
  getIsTronSupportEnabled,
  ///: END:ONLY_INCLUDE_IF
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
  ///: BEGIN:ONLY_INCLUDE_IF(bitcoin)
  const bitcoinSupportEnabled = useSelector(getIsBitcoinSupportEnabled);
  ///: END:ONLY_INCLUDE_IF
  ///: BEGIN:ONLY_INCLUDE_IF(tron)
  const tronSupportEnabled = useSelector(getIsTronSupportEnabled);
  ///: END:ONLY_INCLUDE_IF
  const solanaSupportEnabled = useSelector(getIsSolanaSupportEnabled);

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
          {
            ///: BEGIN:ONLY_INCLUDE_IF(bitcoin)
            bitcoinSupportEnabled && (
              <ButtonLink
                size={ButtonLinkSize.Sm}
                startIconName={IconName.Add}
                startIconProps={{ size: IconSize.Md }}
                onClick={() => onAccountTypeSelect(WalletClientType.Bitcoin)}
                data-testid="wallet-details-add-bitcoin-account"
              >
                {t('addBitcoinAccountLabel')}
              </ButtonLink>
            )
            ///: END:ONLY_INCLUDE_IF
          }
          {
            ///: BEGIN:ONLY_INCLUDE_IF(tron)
            tronSupportEnabled && (
              <ButtonLink
                size={ButtonLinkSize.Sm}
                startIconName={IconName.Add}
                startIconProps={{ size: IconSize.Md }}
                onClick={() => onAccountTypeSelect(WalletClientType.Tron)}
                data-testid="wallet-details-add-tron-account"
              >
                {t('addNewTronAccountLabel')}
              </ButtonLink>
            )
            ///: END:ONLY_INCLUDE_IF
          }
        </Box>
      </ModalBody>
    </>
  );
};
