import PropTypes from 'prop-types';
import React, { PureComponent } from 'react';
import { SubjectType } from '@metamask/permission-controller';
import {
  Caip25CaveatType,
  Caip25EndowmentPermissionName,
  getPermittedEthChainIds,
  getAllScopesFromCaip25CaveatValue,
} from '@metamask/chain-agnostic-permission';
import { parseCaipChainId, KnownCaipNamespace } from '@metamask/utils';
import PermissionsConnectPermissionList from '../../permissions-connect-permission-list';
import {
  AlignItems,
  BackgroundColor,
  BlockSize,
  BorderRadius,
  Display,
  FlexDirection,
  FontWeight,
  JustifyContent,
  TextAlign,
  TextVariant,
} from '../../../../helpers/constants/design-system';
import { Box, Text } from '../../../component-library';
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
    const diffCaveatValue = permissionDiffMap?.[
      Caip25EndowmentPermissionName
    ]?.[Caip25CaveatType] ?? {
      requiredScopes: {},
      optionalScopes: {},
    };
    // Extract the requested chain IDs from the permission diff, specifically from the CAIP-25 endowment permission
    // This represents the new chains being requested in addition to existing permissions
    const permissionDiffRequestedChainIds =
      getPermittedEthChainIds(diffCaveatValue);

    // Extract non-EVM CAIP chain IDs from the diff so we only show newly
    // requested non-EVM chains, not the entire set of already-granted chains.
    const permissionDiffNonEvmCaipChainIds = permissionDiffMap
      ? getAllScopesFromCaip25CaveatValue(diffCaveatValue).filter((chainId) => {
          try {
            const { namespace } = parseCaipChainId(chainId);
            return (
              namespace !== KnownCaipNamespace.Wallet &&
              namespace !== KnownCaipNamespace.Eip155
            );
          } catch {
            return false;
          }
        })
      : null;
    return (
      <Box
        className="permission-page-container-content"
        display={Display.Flex}
        flexDirection={FlexDirection.Column}
        justifyContent={JustifyContent.flexStart}
        alignItems={AlignItems.center}
        height={BlockSize.Full}
        paddingLeft={4}
        paddingRight={4}
        backgroundColor={BackgroundColor.backgroundDefault}
      >
        <Box
          display={Display.Flex}
          flexDirection={FlexDirection.Column}
          justifyContent={JustifyContent.center}
          alignItems={AlignItems.center}
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
          display={Display.Flex}
          backgroundColor={BackgroundColor.backgroundDefault}
          paddingLeft={4}
          paddingRight={4}
          paddingTop={2}
          paddingBottom={2}
          borderRadius={BorderRadius.XL}
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
            // For incremental requests, only show non-EVM chains from the diff
            // (avoids showing already-granted non-EVM chains like Bitcoin/Solana/Tron
            // when the request is only adding an EVM chain like Sepolia).
            // When permissionDiffNonEvmCaipChainIds is empty, PermissionCell falls
            // back to EVM-only display via requestedChainIds.
            caipChainIds={
              permissionDiffMap
                ? permissionDiffNonEvmCaipChainIds
                : selectedCaipChainIds
            }
          />
        </Box>
      </Box>
    );
  }
}
