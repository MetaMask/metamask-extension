import React from 'react';
import {
  Box,
  Text,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Icon,
  IconName,
  IconSize,
} from '../../../../components/component-library';
import {
  AlignItems,
  IconColor,
  Display,
  JustifyContent,
  TextVariant,
  FlexDirection,
} from '../../../../helpers/constants/design-system';

export enum RevokeWithdrawlConfirmModalType {
  Swap = 'Swap',
  Spend = 'Spend',
}

/**
 * A modal component that displays confirmation modal for revoking withdrawl limit.
 *
 * @param props - Component props
 * @param props.visible - Controls the visibility of the modal
 * @param props.onConfirm - Callback function triggered when user confirms
 * @param props.onClose - Callback function triggered when modal is closed
 * @param props.type - The type of the modal
 * @returns A modal with hardware wallet confirmation instructions
 */
// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
export default function RevokeWithdrawlConfirm({
  visible,
  onConfirm,
  onClose,
  type,
}: {
  visible: boolean;
  onConfirm: () => void;
  onClose: () => void;
  type: RevokeWithdrawlConfirmModalType;
}) {
  return (
    <Modal onClose={onClose} isOpen={visible}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader onClose={onClose}>
          <Box
            display={Display.Flex}
            flexDirection={FlexDirection.Column}
            alignItems={AlignItems.center}
            justifyContent={JustifyContent.center}
            gap={2}
          >
            <Icon
              name={IconName.Warning}
              size={IconSize.Xl}
              color={IconColor.warningDefault}
            />
            <Text variant={TextVariant.headingSm}>
              Revoke withdrawal limit?
            </Text>
          </Box>
        </ModalHeader>
        <ModalBody>
          <Text paddingBottom={4}>
            This will remove your current {type} allowances. You&apos;ll pay
            ($$) in network fees, since this happens on-chain.
          </Text>
          <Text paddingBottom={4}>
            To update allowance preferences instead, close this window and
            choose <span style={{ fontWeight: 'bold' }}>Update</span>.
          </Text>
        </ModalBody>
        <ModalFooter
          onCancel={onClose}
          onSubmit={onConfirm}
          submitButtonProps={{
            children: 'Continue',
          }}
        />
      </ModalContent>
    </Modal>
  );
}
