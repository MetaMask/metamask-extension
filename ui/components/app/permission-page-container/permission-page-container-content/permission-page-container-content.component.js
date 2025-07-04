import PropTypes from 'prop-types';
import React, { PureComponent } from 'react';
import { SubjectType } from '@metamask/permission-controller';
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
  };

  static defaultProps = {
    request: {},
    selectedAccounts: [],
    requestedChainIds: [],
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
            requestedChainIds={requestedChainIds}
          />
        </Box>
      </Box>
    );
  }
}
