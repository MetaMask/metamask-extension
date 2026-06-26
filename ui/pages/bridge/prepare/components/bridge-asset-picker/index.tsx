import React, { useRef } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalBody,
  ModalHeader,
  ButtonIconSize,
  ModalContentSize,
} from '../../../../../components/component-library';
import {
  BlockSize,
  Display,
  FlexDirection,
} from '../../../../../helpers/constants/design-system';
import {
  BridgeAssetPickerContent,
  type BridgeAssetPickerContentHandle,
} from './bridge-asset-picker-content';

export const BridgeAssetPicker = ({
  isOpen,
  onClose,
  header,
  ...contentProps
}: {
  header: string;
} & React.ComponentProps<typeof BridgeAssetPickerContent>) => {
  const contentRef = useRef<BridgeAssetPickerContentHandle>(null);
  const handleClose = () => contentRef.current?.handleClose();

  return (
    <Modal
      isOpen={isOpen}
      data-testid="bridge-asset-picker-modal"
      onClose={handleClose}
    >
      <ModalOverlay onClick={handleClose} />
      <ModalContent
        paddingTop={4}
        paddingBottom={4}
        gap={3}
        size={ModalContentSize.Md}
        height={BlockSize.Full}
        width={BlockSize.Full}
        modalDialogProps={{
          height: BlockSize.Full,
          minWidth: 400,
        }}
      >
        <ModalHeader
          closeButtonProps={{ size: ButtonIconSize.Sm }}
          onClose={handleClose}
        >
          {header}
        </ModalHeader>
        <ModalBody
          height={BlockSize.Full}
          paddingLeft={0}
          paddingRight={0}
          data-testid="bridge-asset-picker-modal__body"
          gap={4}
          display={Display.Flex}
          flexDirection={FlexDirection.Column}
        >
          <BridgeAssetPickerContent
            ref={contentRef}
            isOpen={isOpen}
            onClose={onClose}
            {...contentProps}
          />
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};
