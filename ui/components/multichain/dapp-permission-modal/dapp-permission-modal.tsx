import React from 'react';
import { flatten } from 'lodash';
import { useDispatch, useSelector } from 'react-redux';
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
import {
  getDappPermissionModal,
  getPermissionsForActiveTab,
  getOriginOfCurrentTab,
  getUseBlockie,
  getPermissionSubjects,
} from '../../../selectors';
import { shortenAddress } from '../../../helpers/utils/util';
import { useI18nContext } from '../../../hooks/useI18nContext';
import {
  hideDappPermissionModal,
  removePermittedAccount,
} from '../../../store/actions';
import Confusable from '../../ui/confusable';
import { getPermissionDescription } from '../../../helpers/utils/permission';
import PermissionCell from '../../app/permission-cell';

export const DappPermissionModal = () => {
  const t = useI18nContext();
  const dispatch = useDispatch();
  const activeTabOrigin = useSelector(getOriginOfCurrentTab);
  const permissionSubjects = useSelector(getPermissionSubjects);
  const permissions = useSelector(getPermissionsForActiveTab);
  const useBlockie = useSelector(getUseBlockie);
  const { open, account } = useSelector(getDappPermissionModal);

  function closeModal() {
    dispatch(hideDappPermissionModal());
  }

  const permissionLabels = flatten(
    permissions.map(({ key, value }) =>
      getPermissionDescription({
        t,
        permissionName: key,
        permissionValue: value,
        targetSubjectMetadata: permissionSubjects,
      }),
    ),
  );

  return (
    <Modal isOpen={open} onClose={closeModal}>
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
          onClose={closeModal}
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
            <Text variant={TextVariant.headingSm}>
              {account.label ? (
                <Confusable input={account.label} />
              ) : (
                shortenAddress(account.address)
              )}
            </Text>
          </Box>
        </ModalHeader>
        <Box marginLeft={4} marginRight={4}>
          {permissionLabels.map((permission, index) => (
            <PermissionCell
              permissionName={permission.permissionName}
              title={permission.label}
              description={permission.description}
              weight={permission.weight}
              avatarIcon={permission.leftIcon}
              dateApproved={(permission?.permissionValue as any).date}
              key={`${permission.permissionName}-${index}`}
              disableInfoSection={true}
            />
          ))}
        </Box>
        <ModalFooter>
          <Button
            startIconName={IconName.Logout}
            width={BlockSize.Full}
            variant={ButtonVariant.Secondary}
            onClick={() => {
              dispatch(
                removePermittedAccount(activeTabOrigin, account.address),
              );
              closeModal();
            }}
            danger
          >
            {t('disconnect')}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};
