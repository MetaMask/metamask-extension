import React, { useContext } from 'react';
import {
  Box,
  BoxAlignItems,
  BoxFlexDirection,
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
import { captureException } from '../../../../shared/lib/sentry';
import { MetaMetricsContext } from '../../../contexts/metametrics';
import { backupUserData } from '../../../store/actions';

type BackupUserDataResponse = {
  data: string;
  fileName?: string;
  filename?: string;
};

type ExportYourDataModalProps = {
  onClose: () => void;
};

export default function ExportYourDataModal({
  onClose,
}: Readonly<ExportYourDataModalProps>) {
  const t = useI18nContext();
  const { trackEvent } = useContext(MetaMetricsContext);

  const handleDownload = async () => {
    try {
      const { data, fileName, filename } =
        (await backupUserData()) as BackupUserDataResponse;

      await exportAsFile(
        fileName ?? filename ?? 'MetaMaskUserData.json',
        data,
        ExportableContentType.JSON,
      );

      await trackEvent({
        event: 'User Data Exported',
        category: 'Backup',
        properties: {},
      });
    } catch (error) {
      captureException(error);
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
            <Text variant={TextVariant.HeadingSm}>{t('exportYourData')}</Text>
          </Box>
        </ModalHeader>
        <Box marginHorizontal={4} marginBottom={3}>
          <Text variant={TextVariant.BodyMd} color={TextColor.TextAlternative}>
            {t('exportYourDataDescription')}
          </Text>
        </Box>
        <ModalFooter>
          <Button
            data-testid="export-your-data-modal-download-button"
            className="w-full"
            variant={ButtonVariant.Primary}
            onClick={handleDownload}
          >
            {t('exportYourDataButton')}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
