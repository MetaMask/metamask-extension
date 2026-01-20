import React from 'react';
import {
  AlignItems,
  Display,
  FlexDirection,
  JustifyContent,
  TextColor,
  TextVariant,
} from '../../../helpers/constants/design-system';
import { useI18nContext } from '../../../hooks/useI18nContext';
import {
  ButtonIcon,
  ButtonLink,
  ButtonLinkSize,
  IconName,
  IconSize,
  ModalBody,
  ModalContent,
  ModalHeader,
  Text,
  Box,
} from '../../component-library';
import {
  WalletClientType,
  EVM_WALLET_TYPE,
} from '../../../hooks/accounts/useMultichainWalletSnapClient';

type EditAccountModalAddNewAccountOptionProps = {
  setAccountTypeToAdd: (
    accountTypeToAdd: WalletClientType | typeof EVM_WALLET_TYPE,
  ) => void;
};

export const EditAccountModalAddNewAccountOption: React.FC<
  EditAccountModalAddNewAccountOptionProps
> = ({ setAccountTypeToAdd }) => {
  const t = useI18nContext();

  return (
    <ModalContent>
      <ModalHeader
        endAccessory={
          <ButtonIcon
            iconName={IconName.Close}
            onClick={() => setAccountTypeToAdd(EVM_WALLET_TYPE)}
            ariaLabel={t('close')}
          />
        }
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
            onClick={() => setAccountTypeToAdd(EVM_WALLET_TYPE)}
            data-testid="multichain-account-menu-popover-add-account"
          >
            {t('addNewEthereumAccountLabel')}
          </ButtonLink>
          <ButtonLink
            size={ButtonLinkSize.Sm}
            startIconName={IconName.Add}
            startIconProps={{ size: IconSize.Md }}
            onClick={() => setAccountTypeToAdd(WalletClientType.Solana)}
            data-testid="multichain-account-menu-popover-add-solana-account"
          >
            {t('addNewSolanaAccountLabel')}
          </ButtonLink>
        </Box>
      </ModalBody>
    </ModalContent>
  );
};
