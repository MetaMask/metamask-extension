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

  function constructWarningElementString(permissionWarnings) {
    const warningElements = [];
    for (let i = 0; i < permissionWarnings.length; i++) {
      const warning = permissionWarnings[i];
      if (i > 0) {
        if (i === permissionWarnings.length - 1) {
          warningElements.push(` ${t('and')} `);
        } else {
          warningElements.push(', ');
        }
      }
      warningElements.push(
        <span key={i}>
          <Text fontWeight={FontWeight.Medium} as="span">
            {warning.warningMessageSubject}
          </Text>
        </span>,
      );
    }
    return warningElements;
  }

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
      {bip32PublicKeyPermissionWarnings.length > 0 && (
        <Box as="span">
          <PermissionCell
            permissionName={
              <Text>
                {t('snapInstallWarningPermissionNameForViewPublicKey', [
                  constructWarningElementString(
                    bip32PublicKeyPermissionWarnings,
                  ),
                ])}
              </Text>
            }
            title={
              <Text>
                {t('snapInstallWarningPermissionNameForViewPublicKey', [
                  constructWarningElementString(
                    bip32PublicKeyPermissionWarnings,
                  ),
                ])}
              </Text>
            }
            description={t(
              'snapInstallWarningPermissionDescriptionForBip32View',
            )}
            weight={1}
            avatarIcon={IconName.Key}
            key="snapInstallWarningPermissionCell"
            hideStatus
          />
        </Box>
      )}
      {bip32bip44EntropyPermissionWarnings.length > 0 && (
        <Box as="span" marginTop={4}>
          <PermissionCell
            permissionName={
              <Text>
                {t('snapInstallWarningPermissionNameForEntropy', [
                  constructWarningElementString(
                    bip32bip44EntropyPermissionWarnings,
                  ),
                ])}
              </Text>
            }
            title={
              <Text>
                {t('snapInstallWarningPermissionNameForEntropy', [
                  constructWarningElementString(
                    bip32bip44EntropyPermissionWarnings,
                  ),
                ])}
              </Text>
            }
            description={t('snapInstallWarningPermissionDescriptionForEntropy')}
            weight={1}
            avatarIcon={IconName.Key}
            key="snapInstallWarningPermissionCell"
            hideStatus
          />
        </Box>
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
          onChange={() => setUserAgree(!userAgree)}
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
    warningMessageSubject: PropTypes.string,
    id: PropTypes.string,
  }),
  /**
   * Snap name
   */
  snapName: PropTypes.string.isRequired,
};
