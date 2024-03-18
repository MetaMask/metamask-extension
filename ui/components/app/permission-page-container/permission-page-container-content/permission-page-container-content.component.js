import PropTypes from 'prop-types';
import React, { PureComponent } from 'react';
import Tooltip from '../../../ui/tooltip';
import PermissionsConnectPermissionList from '../../permissions-connect-permission-list';
import {
  AlignItems,
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

  renderRequestedPermissions() {
    const { selectedPermissions, subjectMetadata } = this.props;

    return (
      <div className="permission-approval-container__content__requested">
        <PermissionsConnectPermissionList
          permissions={selectedPermissions}
          subjectName={subjectMetadata.origin}
        />
      </div>
    );
  }

  renderAccountTooltip(textContent) {
    const { selectedAccounts } = this.props;
    const { t } = this.context;

    return (
      <Tooltip
        key="all-account-connect-tooltip"
        position="bottom"
        wrapperClassName="permission-approval-container__bold-title-elements"
        html={
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {selectedAccounts.slice(0, 6).map((account, index) => {
              return (
                <div key={`tooltip-account-${index}`}>
                  {account.addressLabel}
                </div>
              );
            })}
            {selectedAccounts.length > 6
              ? t('plusXMore', [selectedAccounts.length - 6])
              : null}
          </div>
        }
      >
        {textContent}
      </Tooltip>
    );
  }

  render() {
    const { t } = this.context;
    const { subjectMetadata } = this.props;

    return (
      <div className="permission-approval-container__content">
        <div className="permission-approval-container__content-container">
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
          <section className="permission-approval-container__permissions-container">
            {this.renderRequestedPermissions()}
          </section>
        </div>
      </div>
    );
  }
}
