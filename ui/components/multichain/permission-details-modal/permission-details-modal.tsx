import React from 'react';
import { flatten } from 'lodash';
import { useSelector } from 'react-redux';
import {
  ModalOverlay,
  ModalContent,
  ModalHeader,
  Modal,
  Box,
  Text,
  AvatarAccount,
  ModalFooter,
  Button,
  IconName,
  ButtonVariant,
  AvatarAccountSize,
  AvatarAccountVariant,
  ModalBody,
  ButtonSize,
} from '../../component-library';
import { getUseBlockie } from '../../../selectors';
import { shortenAddress } from '../../../helpers/utils/util';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { getPermissionDescription } from '../../../helpers/utils/permission';
import PermissionCell from '../../app/permission-cell';
import {
  Identity,
  Permission,
} from '../connected-accounts-menu/connected-accounts-menu.types';
import {
  AlignItems,
  Display,
  JustifyContent,
  TextVariant,
} from '../../../helpers/constants/design-system';

export const PermissionDetailsModal = ({
  onClose,
  onClick,
  isOpen,
  account,
  permissions,
}: {
  isOpen: boolean;
  onClose: () => void;
  onClick: () => void;
  account: Identity;
  permissions: Permission[];
}) => {
  const t = useI18nContext();
  const useBlockie = useSelector(getUseBlockie);

  const permissionLabels = flatten(
    permissions.map(({ key, value }) =>
      getPermissionDescription({
        t,
        permissionName: key,
        permissionValue: value,
        subjectName: '', // Used for snaps but for accounts we can set a default one. It's not used here. Done to avoid TS errors
        getSubjectName: () => '', // Used for snaps but for accounts we can set a default one. It's not used here. Done to avoid TS errors
      }),
    ),
  );

  return (
    <Modal
      isOpen={isOpen}
      data-testid="permission-details-modal"
      onClose={onClose}
    >
      <ModalOverlay />
      <ModalContent>
        <ModalHeader onClose={onClose}>
          <Box
            display={Display.Flex}
            alignItems={AlignItems.center}
            justifyContent={JustifyContent.center}
            gap={2}
          >
            <AvatarAccount
              size={AvatarAccountSize.Sm}
              address={account.address}
              variant={
                useBlockie
                  ? AvatarAccountVariant.Blockies
                  : AvatarAccountVariant.Jazzicon
              }
            />
            <Text variant={TextVariant.headingSm}>
              {account.metadata.name
                ? account.metadata.name
                : shortenAddress(account.address)}
            </Text>
          </Box>
        </ModalHeader>
        <ModalBody>
          {permissionLabels.map((permission, index) => (
            <PermissionCell
              permissionName={permission.permissionName}
              title={permission.label}
              description={permission.description}
              weight={permission.weight}
              avatarIcon={permission.leftIcon}
              // TODO: Replace `any` with type
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              dateApproved={(permission?.permissionValue as any).date}
              key={`${permission.permissionName}-${index}`}
            />
          ))}
        </ModalBody>
        <ModalFooter>
          <Button
            startIconName={IconName.Logout}
            variant={ButtonVariant.Secondary}
            onClick={onClick}
            size={ButtonSize.Lg}
            danger
            block
            data-testid="disconnect"
          >
            {t('disconnect')}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};
