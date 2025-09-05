import React from 'react';
import {
  Box,
  BoxAlignItems,
  BoxBackgroundColor,
  BoxFlexDirection,
  FontWeight,
  IconColor,
  Icon,
  IconName,
  IconSize,
  Text,
  TextColor,
  TextVariant,
  BoxBorderColor,
} from '@metamask/design-system-react';

import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
} from '../../component-library';
import type { ModalProps } from '../../component-library';
import { FlexDirection } from '../../../helpers/constants/design-system';
import { useI18nContext } from '../../../hooks/useI18nContext';

export type AddWalletModalProps = Omit<
  ModalProps,
  'isOpen' | 'onClose' | 'children'
> & {
  isOpen: boolean;
  onClose: () => void;
};

type WalletOption = {
  id: string;
  titleKey: string;
  iconName: IconName;
};

export const AddWalletModal: React.FC<AddWalletModalProps> = ({
  onClose,
  isOpen,
  ...props
}) => {
  const t = useI18nContext();

  const walletOptions: WalletOption[] = [
    {
      id: 'import-wallet',
      titleKey: 'importAWallet',
      iconName: IconName.Wallet,
    },
    {
      id: 'import-account',
      titleKey: 'importAnAccount',
      iconName: IconName.Download,
    },
    {
      id: 'hardware-wallet',
      titleKey: 'addAHardwareWallet',
      iconName: IconName.Hardware,
    },
  ];

  const handleOptionClick = () => {
    // TODO Handle optionId selection logic here in subsequent PR
    onClose?.();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} {...props}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader onClose={onClose}>{t('addWallet')}</ModalHeader>
        <ModalBody
          paddingLeft={0}
          paddingRight={0}
          flexDirection={FlexDirection.Column}
          gap={2}
        >
          {walletOptions.map((option) => (
            <Box
              key={option.id}
              onClick={() => handleOptionClick()}
              onKeyDown={(e: React.KeyboardEvent) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleOptionClick();
                }
              }}
              alignItems={BoxAlignItems.Center}
              padding={4}
              gap={3}
              backgroundColor={BoxBackgroundColor.BackgroundDefault}
              flexDirection={BoxFlexDirection.Row}
              borderColor={BoxBorderColor.BorderMuted}
              className="hover:bg-background-default-hover cursor-pointer transition-all duration-200 w-full text-left outline-none focus:outline-none focus:shadow-none focus-visible:shadow-[inset_0_0_0_2px_var(--color-primary-default)]"
              tabIndex={0}
            >
              <Icon
                name={option.iconName}
                size={IconSize.Md}
                color={IconColor.IconMuted}
              />
              <Text
                variant={TextVariant.BodyMd}
                fontWeight={FontWeight.Medium}
                color={TextColor.TextDefault}
                className="flex-1"
              >
                {t(option.titleKey)}
              </Text>
              <Icon name={IconName.ArrowRight} size={IconSize.Sm} />
            </Box>
          ))}
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export default AddWalletModal;
