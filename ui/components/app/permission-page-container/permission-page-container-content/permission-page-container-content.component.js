import PropTypes from 'prop-types';
import React, { PureComponent } from 'react';
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
  Severity,
  TextAlign,
  TextVariant,
} from '../../../../helpers/constants/design-system';
import { BannerAlert, Box, Text } from '../../../component-library';
import { getURLHost } from '../../../../helpers/utils/util';
import {
  CaveatTypes,
  EndowmentTypes,
} from '../../../../../shared/constants/permissions';

export default class PermissionPageContainerContent extends PureComponent {
  static propTypes = {
    subjectMetadata: PropTypes.shape({
      name: PropTypes.string.isRequired,
      origin: PropTypes.string.isRequired,
      subjectType: PropTypes.string.isRequired,
      extensionId: PropTypes.string,
      iconUrl: PropTypes.string,
    }),
    selectedPermissions: PropTypes.object.isRequired,
    selectedAccounts: PropTypes.array,
    originPendingApprovals: PropTypes.array,
  };

  static defaultProps = {
    selectedAccounts: [],
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
      originPendingApprovals,
    } = this.props;

    const accounts = selectedAccounts.reduce((accumulator, account) => {
      accumulator.push({
        avatarValue: account.address,
        avatarName: account.label,
      });
      return accumulator;
    }, []);

    const otherOriginApprovalsCount = originPendingApprovals.length - 1;
    const originHasPendingApprovals = otherOriginApprovalsCount > 0;

    const hasChainPermissions = Boolean(
      selectedPermissions?.[EndowmentTypes.permittedChains]?.[
        CaveatTypes.restrictNetworkSwitching
      ]?.length,
    );

    return (
      <Box
        display={Display.Flex}
        flexDirection={FlexDirection.Column}
        justifyContent={JustifyContent.flexStart}
        alignItems={AlignItems.center}
        height={BlockSize.Full}
        paddingLeft={4}
        paddingRight={4}
        backgroundColor={BackgroundColor.backgroundAlternative}
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
                key={`description_key_${subjectMetadata.origin}`}
                fontWeight={FontWeight.Medium}
              >
                {getURLHost(subjectMetadata.origin)}
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
            permissions={selectedPermissions}
            subjectName={subjectMetadata.origin}
            accounts={accounts}
          />
        </Box>
        {hasChainPermissions && originHasPendingApprovals && (
          <BannerAlert severity={Severity.Warning} marginTop={2}>
            {otherOriginApprovalsCount === 1
              ? t(
                  'switchingNetworksCancelsPendingConfirmationsExtendedSingular',
                )
              : t('switchingNetworksCancelsPendingConfirmationsExtended', [
                  otherOriginApprovalsCount,
                ])}
          </BannerAlert>
        )}
      </Box>
    );
  }
}
