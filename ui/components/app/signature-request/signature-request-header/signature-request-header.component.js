import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import AccountListItem from '../../account-list-item';
import { getNetworkLabelKey } from '../../../../helpers/utils/i18n-helper';
import {
  BackgroundColor,
  BorderColor,
  Display,
} from '../../../../helpers/constants/design-system';
import {
  getCurrentNetwork,
  getTestNetworkBackgroundColor,
} from '../../../../selectors';
import { getProviderConfig } from '../../../../ducks/metamask/metamask';
import { PickerNetwork } from '../../../component-library';
import { NETWORK_TYPES } from '../../../../../shared/constants/network';
import { t } from '../../../../../app/scripts/translate';

class SignatureRequestHeader extends PureComponent {
  static propTypes = {
    fromAccount: PropTypes.object,
    providerConfig: PropTypes.object,
    currentNetwork: PropTypes.object,
    testNetworkBackgroundColor: BackgroundColor || undefined,
  };

  render() {
    const {
      fromAccount,
      providerConfig,
      currentNetwork,
      testNetworkBackgroundColor,
    } = this.props;

    return (
      <div className="signature-request-header">
        <div className="signature-request-header--account">
          {fromAccount ? (
            <AccountListItem
              account={fromAccount}
              ///: BEGIN:ONLY_INCLUDE_IN(build-mmi)
              hideDefaultMismatchWarning
              ///: END:ONLY_INCLUDE_IN
            />
          ) : null}
        </div>
        <div className="signature-request-header--network">
          <PickerNetwork
            as="div"
            src={currentNetwork?.rpcPrefs?.imageUrl}
            label={
              providerConfig?.type === NETWORK_TYPES.RPC
                ? providerConfig?.nickname ?? t('privateNetwork')
                : t(getNetworkLabelKey(providerConfig?.type))
            }
            backgroundColor={BackgroundColor.transparent}
            borderColor={BorderColor.borderMuted}
            iconProps={{ display: Display.None }}
            avatarNetworkProps={{
              backgroundColor: testNetworkBackgroundColor,
            }}
            data-testid='network-display'
            dataTestId="network-display"
          />
        </div>
      </div>
    );
  }
}

const mapStateToProps = (state) => ({
  providerConfig: getProviderConfig(state),
  currentNetwork: getCurrentNetwork(state),
  testNetworkBackgroundColor: getTestNetworkBackgroundColor(state),
});

export default connect(mapStateToProps)(SignatureRequestHeader);
