import PropTypes from 'prop-types';
import React, { PureComponent } from 'react';
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
import PermissionsConnectPermissionList from '../../permissions-connect-permission-list';
import {
  FontWeight,
  TextAlign,
  TextVariant,
} from '../../../../helpers/constants/design-system';
import { Text } from '../../../component-library';
import { getURLHost } from '../../../../helpers/utils/util';

export default class PermissionPageContainerContent extends PureComponent {
  static propTypes = {
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
    /** CAIP chain IDs for multichain permission display (e.g., 'solana:...') */
    selectedCaipChainIds: PropTypes.array,
  };

  static defaultProps = {
    request: {},
    selectedAccounts: [],
    requestedChainIds: [],
    selectedCaipChainIds: null,
  };

  static contextTypes = {
    t: PropTypes.func,
  };

  render() {
    const { t } = this.context;

    const {
      selectedPermissions,
      selectedAccounts,
      subjectMetadata,
      requestedChainIds,
      selectedCaipChainIds,
      request,
    } = this.props;

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

    // permissionDiffMap is expected to be present when an incremental permission request is made
    // This occurs when a "wallet_switchEthereumChain" request comes in and we already have a set of permissions
    const permissionDiffMap = request.diff?.permissionDiffMap;
    // Extract the requested chain IDs from the permission diff, specifically from the CAIP-25 endowment permission
    // This represents the new chains being requested in addition to existing permissions
    const permissionDiffRequestedChainIds = getPermittedEthChainIds(
      permissionDiffMap?.[Caip25EndowmentPermissionName]?.[
        Caip25CaveatType
      ] ?? {
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
            // On an incremental permission request, we only want to render the newly requested chains in the UI
            // permissionDiffRequestedChainIds will only have content when an incremental permission request is made
            // Otherwise, we fall back to the original requestedChainIds for initial permission requests
            requestedChainIds={
              permissionDiffRequestedChainIds.length > 0
                ? permissionDiffRequestedChainIds
                : requestedChainIds
            }
            // Incremental permission requests (permissionDiffMap present) are
            // EVM-only (wallet_switchEthereumChain). Passing null here lets
            // PermissionCell fall back to the EVM-only display via
            // requestedChainIds, instead of showing pre-existing non-EVM
            // chains (Bitcoin/Solana/Tron) from the full permission set.
            caipChainIds={permissionDiffMap ? null : selectedCaipChainIds}
          />
        </Box>
      </Box>
    );
  }
}
