import PropTypes from 'prop-types';
import { SubjectType } from '@metamask/permission-controller';
import React from 'react';
import {
  AvatarBase,
  AvatarBaseSize,
  AvatarFavicon,
  AvatarFaviconSize,
  IconSize,
  Text,
} from '../../../component-library';
import {
  AlignItems,
  BackgroundColor,
  Display,
  FontWeight,
  JustifyContent,
  TextColor,
  TextVariant,
} from '../../../../helpers/constants/design-system';
import { getAvatarFallbackLetter } from '../../../../helpers/utils/util';
import PermissionCell from '../../permission-cell';
import { useI18nContext } from '../../../../hooks/useI18nContext';

export default function SnapPermissionCellDisplay({
  snapId,
  showOptions,
  permission,
  subjectMetadata,
  index,
  revoked,
  approved,
}) {
  const t = useI18nContext();
  let { label, description, leftIcon } = permission;

  if (permission.connection) {
    if (subjectMetadata?.subjectType === SubjectType.Snap) {
      label = t('snapConnectTo', [
        <Text
          key="connectToMain"
          fontWeight={FontWeight.Medium}
          variant={TextVariant.inherit}
          color={TextColor.inherit}
        >
          {subjectMetadata.name}
        </Text>,
      ]);
      description = t('snapConnectionPermissionDescription', [
        <Text
          key={`permissionSubject_${permission.subjectName}`}
          fontWeight={FontWeight.Medium}
          variant={TextVariant.inherit}
          color={TextColor.inherit}
        >
          {permission.subjectName}
        </Text>,
        <Text
          key={`permissionSubjectDescription_${subjectMetadata.name}`}
          fontWeight={FontWeight.Medium}
          variant={TextVariant.inherit}
          color={TextColor.inherit}
        >
          {subjectMetadata.name}
        </Text>,
      ]);
    }

    const faviconUrl = subjectMetadata?.iconUrl;

    leftIcon = faviconUrl ? (
      <AvatarFavicon
        backgroundColor={BackgroundColor.backgroundAlternative}
        size={AvatarFaviconSize.Md}
        iconProps={{
          size: IconSize.Sm,
        }}
        src={faviconUrl}
        name={permission.connection}
      />
    ) : (
      <AvatarBase
        size={AvatarBaseSize.Md}
        display={Display.Flex}
        alignItems={AlignItems.center}
        justifyContent={JustifyContent.center}
        color={TextColor.textAlternative}
        style={{ borderWidth: '0px' }}
        backgroundColor={BackgroundColor.backgroundAlternative}
      >
        {getAvatarFallbackLetter(permission.connectionName)}
      </AvatarBase>
    );
  }

  return (
    <PermissionCell
      snapId={snapId}
      permissionName={permission.permissionName}
      title={label}
      description={description}
      weight={permission.weight}
      avatarIcon={leftIcon}
      dateApproved={permission?.permissionValue?.date}
      key={`${permission.permissionName}-${index}`}
      showOptions={showOptions}
      revoked={revoked}
      approved={approved}
    />
  );
}

SnapPermissionCellDisplay.propTypes = {
  snapId: PropTypes.string.isRequired,
  showOptions: PropTypes.bool,
  permission: PropTypes.object.isRequired,
  subjectMetadata: PropTypes.object,
  index: PropTypes.number,
  revoked: PropTypes.bool,
  approved: PropTypes.bool,
};
