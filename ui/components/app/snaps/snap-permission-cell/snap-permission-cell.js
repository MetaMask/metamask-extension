import PropTypes from 'prop-types';
import { SubjectType } from '@metamask/permission-controller';
import React from 'react';
import { useSelector } from 'react-redux';
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
import {
  getAvatarFallbackLetter,
  getSnapName,
} from '../../../../helpers/utils/util';
import PermissionCell from '../../permission-cell';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import { getSnapsMetadata } from '../../../../selectors';

export default function SnapPermissionCell({
  snapId,
  showOptions,
  permission,
  connectionSubjectMetadata,
  index,
  revoked,
  approved,
}) {
  const t = useI18nContext();

  let { label, description, leftIcon } = permission;

  const snapsMetadata = useSelector(getSnapsMetadata);

  const createConnectionIcon = (faviconUrl, permissionSubject) => {
    return faviconUrl ? (
      <AvatarFavicon
        backgroundColor={BackgroundColor.backgroundAlternative}
        size={AvatarFaviconSize.Md}
        iconProps={{
          size: IconSize.Sm,
        }}
        src={faviconUrl}
        name={permissionSubject.connection}
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
        {getAvatarFallbackLetter(permissionSubject.connectionName)}
      </AvatarBase>
    );
  };

  const createSnapConnectionLabel = (snapName) => {
    return t('snapConnectTo', [
      <Text
        key="snapConnectTo"
        fontWeight={FontWeight.Medium}
        variant={TextVariant.inherit}
        color={TextColor.inherit}
      >
        {snapName}
      </Text>,
    ]);
  };

  const createSnapConnectionDescription = (snapName) => {
    return t('snapConnectionPermissionDescription', [
      <Text
        key={`permissionSubject_${permission.subjectName}`}
        fontWeight={FontWeight.Medium}
        variant={TextVariant.inherit}
        color={TextColor.inherit}
      >
        {permission.subjectName}
      </Text>,
      <Text
        key={`permissionSubjectDescription_${snapName}`}
        fontWeight={FontWeight.Medium}
        variant={TextVariant.inherit}
        color={TextColor.inherit}
      >
        {snapName}
      </Text>,
    ]);
  };

  if (permission.connection) {
    if (connectionSubjectMetadata?.subjectType === SubjectType.Snap) {
      const snapName = getSnapName(snapsMetadata)(
        connectionSubjectMetadata.origin,
      );
      label = createSnapConnectionLabel(snapName);
      description = createSnapConnectionDescription(snapName);
    }

    leftIcon = createConnectionIcon(
      connectionSubjectMetadata?.iconUrl,
      permission,
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

SnapPermissionCell.propTypes = {
  snapId: PropTypes.string.isRequired,
  showOptions: PropTypes.bool,
  permission: PropTypes.object.isRequired,
  connectionSubjectMetadata: PropTypes.object,
  index: PropTypes.number,
  revoked: PropTypes.bool,
  approved: PropTypes.bool,
};
