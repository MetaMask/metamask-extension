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
      <div className="snap-install-warning__footer">
        <Button
          className="snap-install-warning__footer-button"
          type="primary"
          disabled={!userAgree}
          onClick={onSubmit}
          width={BlockSize.Full}
          size={ButtonSize.Lg}
        >
          {t('confirm')}
        </Button>
      </div>
    );
  };

  const warningElements = [];
  for (let i = 0; i < warnings.length; i++) {
    const warning = warnings[i];
    if (i > 0 && i < warnings.length - 1) {
      warningElements.push(', ');
    }
    if (i === warnings.length - 1) {
      warningElements.push(` ${t('and')} `);
    }
    warningElements.push(
      <span key={i}>
        <Text fontWeight={FontWeight.Medium} as="span">
          {warning.warningMessageSubject}
        </Text>
      </span>,
    );
  }
  const permissionName = (
    <Text>{t('snapInstallWarningPermissionName', [warningElements])}</Text>
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
        marginBottom={6}
      >
        <AvatarIcon
          iconName={IconName.Danger}
          backgroundColor={BackgroundColor.warningMuted}
          color={IconColor.warningDefault}
          size={AvatarIconSize.Xl}
        />
      </Box>
      <Text
        paddingBottom={6}
        textAlign={TextAlign.Center}
        variant={TextVariant.headingMd}
        as="h2"
      >
        {t('snapInstallWarningHeading')}
      </Text>
      <Text paddingBottom={6} textAlign={TextAlign.Center}>
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
      <PermissionCell
        permissionName={permissionName}
        title={permissionName}
        description={t('permission_manageBip44AndBip32KeysDescription')}
        weight={1}
        avatarIcon={IconName.Key}
        key="snapInstallWarningPermissionCell"
        hideStatus
      />
      <Box
        display={Display.Flex}
        justifyContent={JustifyContent.center}
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
