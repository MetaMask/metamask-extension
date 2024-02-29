import React from 'react';
import {
  Display,
  FlexDirection,
  BorderColor,
  TextVariant,
  BlockSize,
  AlignItems,
  JustifyContent,
} from '../../../helpers/constants/design-system';
import {
  ModalOverlay,
  ModalContent,
  ModalHeader,
  Modal,
  Box,
  Text,
  AvatarAccount,
  AvatarAccountSize,
  AvatarAccountVariant,
  ModalFooter,
  Button,
  IconName,
  ButtonVariant,
} from '../../component-library';
import { useSelector } from 'react-redux';
import { getDappPermissionModal, getUseBlockie } from '../../../selectors';
import { shortenAddress } from '../../../helpers/utils/util';
import { useI18nContext } from '../../../hooks/useI18nContext';
import Confusable from '../../ui/confusable';

export const DappPermissionModal = () => {
  const t = useI18nContext();
  const useBlockie = useSelector(getUseBlockie);
  const { account } = useSelector(getDappPermissionModal);

  return (
    <Modal isOpen={true} onClose={() => {}} className="snap-metadata-modal">
      <ModalOverlay />
      <ModalContent
        modalDialogProps={{
          display: Display.Flex,
          flexDirection: FlexDirection.Column,
        }}
      >
        <ModalHeader
          paddingBottom={4}
          paddingRight={4}
          paddingLeft={4}
          onClose={() => {}}
        >
          <Box
            display={Display.Flex}
            flexDirection={FlexDirection.Row}
            alignItems={AlignItems.center}
            justifyContent={JustifyContent.center}
          >
            <AvatarAccount
              borderColor={BorderColor.transparent}
              size={AvatarAccountSize.Sm}
              address={'0x00'}
              variant={
                useBlockie
                  ? AvatarAccountVariant.Blockies
                  : AvatarAccountVariant.Jazzicon
              }
              marginInlineEnd={2}
            />
            <Text
              variant={TextVariant.headingSm}
              className="address-list-item__label"
            >
              {account.label ? (
                <Confusable input={account.label} />
              ) : (
                shortenAddress(account.address)
              )}
            </Text>
          </Box>
        </ModalHeader>
        <Box marginLeft={4} marginRight={4}>
          -Content Goes Here-
        </Box>
        <ModalFooter>
          <Button
            startIconName={IconName.Logout}
            width={BlockSize.Full}
            variant={ButtonVariant.Secondary}
            onClick={() => {}}
            danger
          >
            {t('disconnect')}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};
