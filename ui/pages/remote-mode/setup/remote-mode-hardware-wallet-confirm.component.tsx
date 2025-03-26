import React from 'react';
import {
  Box,
  Button,
  Text,
  Icon,
  IconName,
} from '../../../components/component-library';
import {
  FontWeight,
  TextVariant,
  Display,
  JustifyContent,
  BlockSize,
  BackgroundColor,
} from '../../../helpers/constants/design-system';
import Card from '../../../components/ui/card';

export default function RemoteModeHardwareWalletConfirm({
  visible,
  onConfirm,
  onBack,
  onClose,
}: {
  visible: boolean;
  onConfirm: () => void;
  onBack: () => void;
  onClose: () => void;
}) {

  const handleClose = () => {
    onClose();
  };

  const handleBack = () => {
    onBack();
  };

  return (
    <Card
      display={visible ? Display.Block : Display.None}
      style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
        background: 'var(--color-background-default)',
        padding: '16px',
      }}
      backgroundColor={BackgroundColor.backgroundAlternativeSoft}
    >
      <Box display={Display.Flex} justifyContent={JustifyContent.spaceBetween}>
        <Icon name={IconName.ArrowLeft} onClick={handleBack} />
        <Text variant={TextVariant.headingSm} fontWeight={FontWeight.Bold}>
          Confirm
        </Text>
        <Icon name={IconName.Close} onClick={handleClose} />
      </Box>
      <Box marginTop={4} marginBottom={6}>
        <Text>Prior to clicking confirm:</Text>
        <ul style={{ listStyleType: 'disc', paddingLeft: '20px' }}>
          <Text as="li">
            Be sure your Ledger is plugged in and to select the Ethereum app.
          </Text>
          <Text as="li">
            Enable "smart contract data" or "blind signing" on your Ledger
            device.
          </Text>
        </ul>
      </Box>
      <Button onClick={onConfirm} width={BlockSize.Full}>
        Confirm on hardware wallet
      </Button>
    </Card>
  );
}
