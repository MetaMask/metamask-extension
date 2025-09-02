import React from 'react';
import { useHistory } from 'react-router-dom';
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
import {
  CONNECT_HARDWARE_ROUTE,
  IMPORT_SRP_ROUTE,
  ADD_WALLET_PAGE_ROUTE,
} from '../../../helpers/constants/routes';
import { ENVIRONMENT_TYPE_POPUP } from '../../../../shared/constants/app';
import { getEnvironmentType } from '../../../../app/scripts/lib/util';

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
  route: string;
};

export const AddWalletModal: React.FC<AddWalletModalProps> = ({
  onClose,
  isOpen,
  ...props
}) => {
  const t = useI18nContext();
  const history = useHistory();

  const walletOptions: WalletOption[] = [
    {
      id: 'import-wallet',
      titleKey: 'importAWallet',
      iconName: IconName.Wallet,
      route: IMPORT_SRP_ROUTE,
    },
    {
      id: 'import-account',
      titleKey: 'importAnAccount',
      iconName: IconName.Download,
      route: ADD_WALLET_PAGE_ROUTE,
    },
    {
      id: 'hardware-wallet',
      titleKey: 'addAHardwareWallet',
      iconName: IconName.Hardware,
      route: CONNECT_HARDWARE_ROUTE,
    },
  ];

  const handleOptionClick = (option: WalletOption) => {
    onClose?.();

    // Hardware wallet connections require expanded view
    if (option.id === 'hardware-wallet') {
      if (getEnvironmentType() === ENVIRONMENT_TYPE_POPUP) {
        global.platform.openExtensionInBrowser?.(option.route);
      } else {
        history.push(option.route);
      }
    } else {
      history.push(option.route);
    }
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
              onClick={() => handleOptionClick(option)}
              onKeyDown={(e: React.KeyboardEvent) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleOptionClick(option);
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
