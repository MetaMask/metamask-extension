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
  BlockSize,
  TextColor,
} from '../../../../helpers/constants/design-system';
import Popover from '../../../ui/popover';
import {
  AvatarIcon,
  AvatarIconSize,
  Checkbox,
  Box,
  IconName,
  Text,
  Button,
  ButtonSize,
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

  const SnapInstallWarningFooter = () => {
    return (
      <Box
        display={Display.Flex}
        justifyContent={JustifyContent.center}
        alignItems={AlignItems.center}
        width={BlockSize.Full}
      >
        <Button
          type="primary"
          disabled={!userAgree}
          onClick={onSubmit}
          width={BlockSize.Full}
          size={ButtonSize.Lg}
        >
          {t('confirm')}
        </Button>
      </Box>
    );
  };

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
              as="span"
              key={`${firstWarningSubject}_and_first`}
            >
              {firstWarningSubject}
            </Text>,
            <Text
              fontWeight={FontWeight.Medium}
              as="span"
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
                as="span"
                key={`${warning.permissionName}_and_first_${index}`}
              >
                {warning.warningMessageSubject}
              </Text>,
              <Text
                fontWeight={FontWeight.Medium}
                as="span"
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
    return (
      <Box as="span" marginBottom={4}>
        <PermissionCell
          permissionName={
            <Text>
              {t(permission.name, [
                constructWarningElementComponentArray(permissionWarnings),
              ])}
            </Text>
          }
          title={
            <Text>
              {t(permission.title, [
                constructWarningElementComponentArray(permissionWarnings),
              ])}
            </Text>
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
          weight={permission.weight}
          avatarIcon={IconName.Key}
          key={`snapInstallWarningPermissionCellKeyEntropy_${permission.permissionName}`}
          hideStatus
        />
      </Box>
    );
  }

  const criticalPermissions = {
    snap_getBip32PublicKey: {
      weight: 2,
      name: 'snapInstallWarningPermissionNameForViewPublicKey',
      title: 'snapInstallWarningPermissionNameForViewPublicKey',
      description: 'snapInstallWarningPermissionDescriptionForBip32View',
    },
    snap_getBip32Entropy_snap_getBip44Entropy: {
      weight: 1,
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

  const bip32PublicKeyPermissionCellWarning =
    bip32PublicKeyPermissionWarnings.length
      ? constructWarningPermissionCell(
          bip32PublicKeyPermissionWarnings,
          criticalPermissions.snap_getBip32PublicKey,
        )
      : null;
  const bip32bip44PermissionCellWarning =
    bip32bip44EntropyPermissionWarnings.length
      ? constructWarningPermissionCell(
          bip32bip44EntropyPermissionWarnings,
          criticalPermissions.snap_getBip32Entropy_snap_getBip44Entropy,
        )
      : null;

  return (
    <Popover
      className="snap-install-warning"
      footer={<SnapInstallWarningFooter />}
      headerProps={{ padding: [4, 4, 0] }}
      contentProps={{
        paddingLeft: [4, 4],
        paddingRight: [4, 4],
        paddingTop: 0,
        paddingBottom: [4, 4],
      }}
      footerProps={{ padding: [4, 4] }}
      onClose={onCancel}
    >
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
      {bip32bip44PermissionCellWarning}
      {bip32PublicKeyPermissionCellWarning}
      <Box
        display={Display.Flex}
        justifyContent={JustifyContent.flexStart}
        alignItems={AlignItems.center}
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
    </Popover>
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
