import React from 'react';
import { ButtonVariant } from '@metamask/snaps-sdk';
import {
  Box,
  Button,
  ButtonSize,
  Checkbox,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
} from '../../../../../components/component-library';
import {
  BlockSize,
  Display,
  FlexDirection,
  JustifyContent,
} from '../../../../../helpers/constants/design-system';
import useAlerts from '../../../hooks/useAlerts';

export function AlertModal({
  ownerId,
  onButtonClick,
  onActionClick,
}: {
  ownerId: string;
  onButtonClick: () => void;
  onActionClick: (actionKey: string) => void;
}) {
  const { alerts, isAlertConfirmed, setAlertConfirmed } = useAlerts(ownerId);

  return (
    <Modal
      isOpen
      onClose={() => {
        // Intentionally empty
      }}
    >
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Alerts</ModalHeader>
        <ModalBody>
          {alerts.map((alert) => {
            const isConfirmed = isAlertConfirmed(alert.key);

            return (
              <Box
                key={alert.key}
                display={Display.Flex}
                flexDirection={FlexDirection.Row}
                justifyContent={JustifyContent.spaceBetween}
                paddingBottom={3}
                width={BlockSize.Full}
                gap={3}
              >
                <p>{alert.message}</p>
                <Checkbox
                  label="Acknowledge"
                  isChecked={isConfirmed}
                  onClick={() => setAlertConfirmed(alert.key, !isConfirmed)}
                />
              </Box>
            );
          })}
        </ModalBody>
        <ModalFooter>
          <Box
            display={Display.Flex}
            flexDirection={FlexDirection.Column}
            gap={3}
            width={BlockSize.Full}
          >
            {alerts
              .flatMap((alert) => alert.actions || [])
              .map((action) => (
                <Button
                  key={action.key}
                  variant={ButtonVariant.Secondary}
                  width={BlockSize.Full}
                  onClick={() => {
                    onActionClick(action.key);
                  }}
                >
                  {action.label}
                </Button>
              ))}
            <Button
              variant={ButtonVariant.Primary}
              width={BlockSize.Full}
              onClick={onButtonClick}
              size={ButtonSize.Lg}
            >
              Got It
            </Button>
          </Box>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
