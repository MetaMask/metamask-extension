import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import {
  BackgroundColor,
  IconColor,
  TextVariant,
  TextAlign,
  JustifyContent,
  FontWeight,
  Display,
  AlignItems,
  BorderRadius,
  TextColor,
} from '../../../../helpers/constants/design-system';
import {
  AvatarIcon,
  AvatarIconSize,
  Checkbox,
  Box,
  IconName,
  Text,
  Modal,
  ModalFooter,
  ModalBody,
  ModalContent,
  ModalHeader,
} from '../../../component-library';
import PermissionCell from '../../permission-cell';

export default function SnapInstallWarning({
  onCancel,
  onSubmit,
  warnings,
  snapName,
}) {
  const t = useI18nContext();
  const [userAgree, setUserAgree] = useState(false);
  const [isOpen, setIsOpen] = useState(true);

  function onConfirm() {
    setIsOpen(false);
    onSubmit();
  }

  function constructWarningElementComponentArray(permissionWarnings) {
    if (permissionWarnings.length === 1) {
      return [
        <Text
          fontWeight={FontWeight.Medium}
          as="span"
          key="warningMessageSubject"
        >
          {permissionWarnings[0].warningMessageSubject}
        </Text>,
      ];
    }

    if (permissionWarnings.length === 2) {
      const firstWarningSubject = permissionWarnings[0].warningMessageSubject;
      const secondWarningSubject = permissionWarnings[1].warningMessageSubject;
      return [
        <Text
          fontWeight={FontWeight.Normal}
          as="span"
          key="warningMessageSubject"
        >
          {t('andForTwoItems', [
            <Text
              fontWeight={FontWeight.Medium}
              variant={TextVariant.inherit}
              key={`${firstWarningSubject}_and_first`}
            >
              {firstWarningSubject}
            </Text>,
            <Text
              fontWeight={FontWeight.Medium}
              variant={TextVariant.inherit}
              key={`${secondWarningSubject}_and_second`}
            >
              {secondWarningSubject}
            </Text>,
          ])}
        </Text>,
      ];
    }

    return permissionWarnings.map((warning, index) => {
      if (permissionWarnings.length - 1 === index) {
        return [];
      }
      // Handle last two elements
      if (permissionWarnings.length - 2 === index) {
        return [
          <Text
            fontWeight={FontWeight.Normal}
            as="span"
            key={`${warning.permissionName}_and_${index}`}
          >
            {t('andForListItems', [
              <Text
                fontWeight={FontWeight.Medium}
                variant={TextVariant.inherit}
                key={`${warning.permissionName}_and_first_${index}`}
              >
                {warning.warningMessageSubject}
              </Text>,
              <Text
                fontWeight={FontWeight.Medium}
                variant={TextVariant.inherit}
                key={`${warning.permissionName}_and_second_first_${index}`}
              >
                {
                  permissionWarnings[permissionWarnings.length - 1]
                    .warningMessageSubject
                }
              </Text>,
            ])}
          </Text>,
        ];
      }

      return [
        <span key={`${warning.permissionName}_${index}`}>
          <Text fontWeight={FontWeight.Medium} as="span">
            {warning.warningMessageSubject}
            {', '}
          </Text>
        </span>,
      ];
    });
  }

  function constructWarningPermissionCell(permissionWarnings, permission) {
    const warningElementComponentArray =
      constructWarningElementComponentArray(permissionWarnings);
    return (
      <Box as="span" marginBottom={4}>
        <PermissionCell
          permissionName={
            <Text>{t(permission.name, [warningElementComponentArray])}</Text>
          }
          title={
            <Text>{t(permission.title, [warningElementComponentArray])}</Text>
          }
          description={t(permission.description, [
            <Text
              color={TextColor.inherit}
              variant={TextVariant.inherit}
              fontWeight={FontWeight.Medium}
              key="1"
            >
              {snapName}
            </Text>,
          ])}
          weight={1}
          avatarIcon={IconName.Key}
          key={`snapInstallWarningPermissionCellKeyEntropy_${permission.permissionName}`}
          hideStatus
          margin={0}
        />
      </Box>
    );
  }

  const criticalPermissions = {
    publicKey: {
      name: 'snapInstallWarningPermissionNameForViewPublicKey',
      title: 'snapInstallWarningPermissionNameForViewPublicKey',
      description: 'snapInstallWarningPermissionDescriptionForBip32View',
    },
    entropy: {
      name: 'snapInstallWarningPermissionNameForEntropy',
      title: 'snapInstallWarningPermissionNameForEntropy',
      description: 'snapInstallWarningPermissionDescriptionForEntropy',
    },
  };

  // Filter and group warnings based on permission name
  const bip32PublicKeyPermissionWarnings = warnings.filter(
    (warning) => warning.permissionName === 'snap_getBip32PublicKey',
  );
  const bip32bip44EntropyPermissionWarnings = warnings.filter(
    (warning) =>
      warning.permissionName === 'snap_getBip32Entropy' ||
      warning.permissionName === 'snap_getBip44Entropy',
  );

  return (
    <Modal onClose={onCancel} isOpen={isOpen} className="snap-install-warning">
      <ModalContent>
        <ModalHeader onClose={onCancel}>
          <Box
            display={Display.Flex}
            justifyContent={JustifyContent.center}
            marginBottom={4}
          >
            <AvatarIcon
              iconName={IconName.Danger}
              backgroundColor={BackgroundColor.warningMuted}
              color={IconColor.warningDefault}
              size={AvatarIconSize.Xl}
            />
          </Box>
        </ModalHeader>
        <ModalBody>
          <Text
            paddingBottom={4}
            textAlign={TextAlign.Center}
            variant={TextVariant.headingMd}
            as="h2"
          >
            {t('snapInstallWarningHeading')}
          </Text>
          <Text paddingBottom={4} textAlign={TextAlign.Left}>
            {t('snapInstallWarningCheck', [
              <Text
                key="snapNameInWarningDescription"
                fontWeight={FontWeight.Medium}
                as="span"
              >
                {snapName}
              </Text>,
            ])}
          </Text>
          {bip32bip44EntropyPermissionWarnings.length > 0 &&
            constructWarningPermissionCell(
              bip32bip44EntropyPermissionWarnings,
              criticalPermissions.entropy,
            )}
          {bip32PublicKeyPermissionWarnings.length > 0 &&
            constructWarningPermissionCell(
              bip32PublicKeyPermissionWarnings,
              criticalPermissions.publicKey,
            )}
          <Box
            display={Display.Flex}
            justifyContent={JustifyContent.flexStart}
            alignItems={AlignItems.center}
            marginTop={4}
            padding={4}
            borderRadius={BorderRadius.SM}
            backgroundColor={
              userAgree
                ? BackgroundColor.infoMuted
                : BackgroundColor.backgroundAlternative
            }
          >
            <Checkbox
              isRequired
              onChange={() => setUserAgree((state) => !state)}
              isChecked={userAgree}
              label={
                <Text as="span">
                  Install{' '}
                  <Text as="span" fontWeight={FontWeight.Medium}>
                    {snapName}
                  </Text>
                </Text>
              }
            />
          </Box>
        </ModalBody>
        <ModalFooter
          onSubmit={onConfirm}
          submitButtonProps={{ children: t('confirm'), disabled: !userAgree }}
        />
      </ModalContent>
    </Modal>
  );
}

SnapInstallWarning.propTypes = {
  /**
   * onCancel handler
   */
  onCancel: PropTypes.func,
  /**
   * onSubmit handler
   */
  onSubmit: PropTypes.func,
  /**
   * warnings list
   */
  warnings: PropTypes.arrayOf({
    id: PropTypes.string,
    permissionName: PropTypes.string,
    warningMessageSubject: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.element,
    ]),
  }),
  /**
   * Snap name
   */
  snapName: PropTypes.string.isRequired,
};
