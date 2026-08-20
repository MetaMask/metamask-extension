import PropTypes from 'prop-types';
import React, { memo } from 'react';
import { SubjectType } from '@metamask/permission-controller';
import {
  Caip25CaveatType,
  Caip25EndowmentPermissionName,
  getPermittedEthChainIds,
} from '@metamask/chain-agnostic-permission';
import {
  Box,
  BoxAlignItems,
  BoxJustifyContent,
  BoxBackgroundColor,
} from '@metamask/design-system-react';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import PermissionsConnectPermissionList from '../../permissions-connect-permission-list';
import {
  FontWeight,
  TextAlign,
  TextVariant,
} from '../../../../helpers/constants/design-system';
import { Text } from '../../../component-library';
import { getURLHost } from '../../../../helpers/utils/util';

function PermissionPageContainerContent({
  request = {},
  subjectMetadata,
  selectedPermissions,
  selectedAccounts = [],
  requestedChainIds = [],
  selectedCaipChainIds = null,
}) {
  const t = useI18nContext();

  const accounts = selectedAccounts.reduce((accumulator, account) => {
    accumulator.push({
      avatarValue: account.address,
      avatarName: account.label,
    });
    return accumulator;
  }, []);
  const { origin, subjectType } = subjectMetadata;
  const displayOrigin =
    subjectType === SubjectType.Website ? getURLHost(origin) : origin;

  const permissionDiffMap = request.diff?.permissionDiffMap;
  const permissionDiffRequestedChainIds = getPermittedEthChainIds(
    permissionDiffMap?.[Caip25EndowmentPermissionName]?.[Caip25CaveatType] ?? {
      requiredScopes: {},
      optionalScopes: {},
    },
  );

  return (
    <Box
      className="permission-page-container-content flex flex-col h-full"
      justifyContent={BoxJustifyContent.Start}
      alignItems={BoxAlignItems.Center}
      paddingLeft={4}
      paddingRight={4}
      backgroundColor={BoxBackgroundColor.BackgroundDefault}
    >
      <Box
        className="flex flex-col"
        justifyContent={BoxJustifyContent.Center}
        alignItems={BoxAlignItems.Center}
        paddingTop={4}
        paddingBottom={4}
      >
        <Text variant={TextVariant.headingMd} textAlign={TextAlign.Center}>
          {t('reviewPermissions')}
        </Text>
        <Text variant={TextVariant.bodyMd} textAlign={TextAlign.Center}>
          {t('nativeNetworkPermissionRequestDescription', [
            <Text
              as="span"
              key={`description_key_${displayOrigin}`}
              fontWeight={FontWeight.Medium}
              className="break-all"
            >
              {displayOrigin}
            </Text>,
          ])}
        </Text>
      </Box>
      <Box
        className="flex rounded-xl"
        backgroundColor={BoxBackgroundColor.BackgroundDefault}
        paddingLeft={4}
        paddingRight={4}
        paddingTop={2}
        paddingBottom={2}
      >
        <PermissionsConnectPermissionList
          isRequestApprovalPermittedChains={Boolean(
            request.diff?.permissionDiffMap,
          )}
          permissions={selectedPermissions}
          subjectName={subjectMetadata.origin}
          accounts={accounts}
          requestedChainIds={
            permissionDiffRequestedChainIds.length > 0
              ? permissionDiffRequestedChainIds
              : requestedChainIds
          }
          caipChainIds={permissionDiffMap ? null : selectedCaipChainIds}
        />
      </Box>
    </Box>
  );
}

PermissionPageContainerContent.propTypes = {
  request: PropTypes.object,
  subjectMetadata: PropTypes.shape({
    name: PropTypes.string.isRequired,
    origin: PropTypes.string.isRequired,
    subjectType: PropTypes.string.isRequired,
    extensionId: PropTypes.string,
    iconUrl: PropTypes.string,
  }),
  selectedPermissions: PropTypes.object.isRequired,
  selectedAccounts: PropTypes.array,
  requestedChainIds: PropTypes.array,
  selectedCaipChainIds: PropTypes.array,
};

export default memo(PermissionPageContainerContent);
