import React from 'react';
import {
  Box,
  BoxFlexDirection,
  BoxAlignItems,
  BoxJustifyContent,
  Button,
  ButtonVariant,
  Text,
  TextVariant,
  TextColor,
} from '@metamask/design-system-react';
import {
  Modal,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
} from '../../../components/component-library';
import {
  AlignItems,
  Display,
  FlexDirection,
} from '../../../helpers/constants/design-system';
import { useI18nContext } from '../../../hooks/useI18nContext';
import {
  exportAsFile,
  ExportableContentType,
} from '../../../helpers/utils/export-utils';

type DownloadStateLogsModalProps = {
  onClose: () => void;
  onError: () => void;
};

export default function DownloadStateLogsModal({
  onClose,
  onError,
}: Readonly<DownloadStateLogsModalProps>) {
  const t = useI18nContext();

  const handleDownload = async () => {
    try {
      const stateString = await window.logStateString();
      await exportAsFile(
        `${t('stateLogFileName')}.json`,
        stateString,
        ExportableContentType.JSON,
      );
    } catch {
      onError();
    }
    onClose();
  };

  return (
    <Modal isOpen onClose={onClose}>
      <ModalOverlay />
      <ModalContent
        alignItems={AlignItems.center}
        modalDialogProps={{
          display: Display.Flex,
          flexDirection: FlexDirection.Column,
        }}
      >
        <ModalHeader onClose={onClose}>
          <Box
            flexDirection={BoxFlexDirection.Column}
            alignItems={BoxAlignItems.Center}
            justifyContent={BoxJustifyContent.Center}
          >
            <Text variant={TextVariant.HeadingSm}>{t('stateLogs')}</Text>
          </Box>
        </ModalHeader>
        <Box marginHorizontal={4} marginBottom={3}>
          <Text variant={TextVariant.BodyMd} color={TextColor.TextAlternative}>
            {t('stateLogsModalDescription')}
          </Text>
        </Box>
        <ModalFooter>
          <Button
            data-testid="download-state-logs-modal-button"
            className="w-full"
            variant={ButtonVariant.Primary}
            onClick={handleDownload}
          >
            {t('download')}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
