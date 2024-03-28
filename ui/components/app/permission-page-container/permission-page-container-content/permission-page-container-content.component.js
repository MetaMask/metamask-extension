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
  TextAlign,
  TextVariant,
} from '../../../../helpers/constants/design-system';
import { Box, Text } from '../../../component-library';

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
  };

  static defaultProps = {
    selectedAccounts: [],
  };

  static contextTypes = {
    t: PropTypes.func,
  };

  render() {
    const { t } = this.context;

    const { selectedPermissions, selectedAccounts, subjectMetadata } =
      this.props;

    const accounts = selectedAccounts.reduce((accumulator, account) => {
      accumulator.push({
        avatarValue: account.address,
        avatarName: account.label,
      });
      return accumulator;
    }, []);

    return (
      <Box
        display={Display.Flex}
        flexDirection={FlexDirection.Column}
        justifyContent={JustifyContent.flexStart}
        alignItems={AlignItems.center}
        height={BlockSize.Full}
        paddingLeft={4}
        paddingRight={4}
      >
        <Box
          display={Display.Flex}
          flexDirection={FlexDirection.Column}
          justifyContent={JustifyContent.center}
          alignItems={AlignItems.center}
          paddingTop={4}
          paddingBottom={4}
        >
          <Text variant={TextVariant.headingLg} textAlign={TextAlign.Center}>
            {t('permissions')}
          </Text>
          <Text variant={TextVariant.bodyMd}>
            {t('nativePermissionRequestDescription', [
              <Text
                key={`description_key_${subjectMetadata.origin}`}
                fontWeight={FontWeight.Medium}
              >
                {subjectMetadata.origin}
              </Text>,
            ])}
          </Text>
        </Box>
        <Box
          display={Display.Flex}
          backgroundColor={BackgroundColor.backgroundAlternative}
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
      </Box>
    );
  }
}
