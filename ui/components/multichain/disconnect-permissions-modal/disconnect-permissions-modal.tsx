import React from 'react';
import {
  Button,
  ButtonVariant,
  Text,
  Box,
  ButtonSize,
  BoxFlexDirection,
} from '@metamask/design-system-react';
import {
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
} from '../../component-library';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { PermissionItem } from './permission-item';
import { DisconnectPermissionsModalProps } from './types';

export const DisconnectPermissionsModal: React.FC<
  DisconnectPermissionsModalProps
> = ({ isOpen, onClose, onSkip, onRemoveAll, permissions = [] }) => {
  const t = useI18nContext();

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      data-testid="disconnect-permissions-modal"
    >
      <ModalOverlay />
      <ModalContent>
        <ModalHeader onClose={onClose}>
          {t('otherPermissionsOnSiteTitle')}
        </ModalHeader>
        <ModalBody paddingLeft={0} paddingRight={0}>
          <Box padding={4}>
            <Text>{t('otherPermissionsOnSiteDescription')}</Text>
          </Box>
          {permissions.length > 0 && (
            <Box>
              {permissions.map((permission, index) => {
                return (
                  <PermissionItem
                    key={`${permission.chainId}-${permission.permissionType}-${index}`}
                    permission={permission}
                  />
                );
              })}
            </Box>
          )}
        </ModalBody>
        <ModalFooter>
          <Box flexDirection={BoxFlexDirection.Row} gap={2}>
            <Button
              onClick={onSkip}
              variant={ButtonVariant.Secondary}
              size={ButtonSize.Lg}
              data-testid="skip-disconnect-permissions"
              isFullWidth
            >
              {t('skip')}
            </Button>
            <Button
              onClick={onRemoveAll}
              variant={ButtonVariant.Primary}
              size={ButtonSize.Lg}
              isDanger
              data-testid="remove-all-disconnect-permissions"
              isFullWidth
            >
              {t('removeAll')}
            </Button>
          </Box>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};
