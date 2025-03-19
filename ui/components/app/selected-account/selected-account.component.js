import React, { Component } from 'react';
import PropTypes from 'prop-types';
import copyToClipboard from 'copy-to-clipboard';
import { shortenAddress } from '../../../helpers/utils/util';

import Tooltip from '../../ui/tooltip';
import { toChecksumHexAddress } from '../../../../shared/modules/hexstring-utils';
import { SECOND } from '../../../../shared/constants/time';
///: BEGIN:ONLY_INCLUDE_IF(build-mmi)
// TODO: Remove restricted import
// eslint-disable-next-line import/no-restricted-paths
import { getEnvironmentType } from '../../../../app/scripts/lib/util';
import { ENVIRONMENT_TYPE_POPUP } from '../../../../shared/constants/app';
import { AccountType } from '../../../../shared/constants/custody';
import CustodyLabels from '../../institutional/custody-labels/custody-labels';
///: END:ONLY_INCLUDE_IF
import { Icon, IconName, IconSize, Text } from '../../component-library';
import {
  IconColor,
  TextVariant,
  TextColor,
  TextAlign,
  BlockSize,
  Display,
  FontWeight,
  AlignItems,
} from '../../../helpers/constants/design-system';
import { COPY_OPTIONS } from '../../../../shared/constants/copy';

class SelectedAccount extends Component {
  state = {
    copied: false,
  };

  static contextTypes = {
    t: PropTypes.func,
  };

  static propTypes = {
    selectedAccount: PropTypes.object.isRequired,
    ///: BEGIN:ONLY_INCLUDE_IF(build-mmi)
    accountType: PropTypes.string,
    accountDetails: PropTypes.object,
    provider: PropTypes.object,
    isCustodianSupportedChain: PropTypes.bool,
    ///: END:ONLY_INCLUDE_IF
  };

  componentDidMount() {
    this.copyTimeout = null;
  }

  componentWillUnmount() {
    if (this.copyTimeout) {
      clearTimeout(this.copyTimeout);
      this.copyTimeout = null;
    }
  }

  render() {
    const { t } = this.context;
    const {
      selectedAccount,
      ///: BEGIN:ONLY_INCLUDE_IF(build-mmi)
      accountType,
      accountDetails,
      provider,
      isCustodianSupportedChain,
      ///: END:ONLY_INCLUDE_IF
    } = this.props;

    const checksummedAddress = toChecksumHexAddress(selectedAccount.address);

    let title = this.state.copied
      ? t('copiedExclamation')
      : t('copyToClipboard');

    let showAccountCopyIcon = true;

    ///: BEGIN:ONLY_INCLUDE_IF(build-mmi)
    const custodyLabels = accountDetails
      ? accountDetails[checksummedAddress]?.labels
      : {};

    const showCustodyLabels =
      getEnvironmentType() !== ENVIRONMENT_TYPE_POPUP &&
      accountType === AccountType.CUSTODY &&
      custodyLabels;

    const tooltipText = this.state.copied
      ? t('copiedExclamation')
      : t('copyToClipboard');

    title = isCustodianSupportedChain
      ? tooltipText
      : t('custodyWrongChain', [provider.nickname || provider.type]);

    showAccountCopyIcon = isCustodianSupportedChain;
    ///: END:ONLY_INCLUDE_IF

    return (
      <div className="selected-account">
        <Tooltip
          wrapperClassName="selected-account__tooltip-wrapper"
          position="bottom"
          title={title}
        >
          <button
            className="selected-account__clickable"
            data-testid="selected-account-click"
            ///: BEGIN:ONLY_INCLUDE_IF(build-mmi)
            disabled={!isCustodianSupportedChain}
            ///: END:ONLY_INCLUDE_IF
            onClick={() => {
              this.setState({ copied: true });
              this.copyTimeout = setTimeout(
                () => this.setState({ copied: false }),
                SECOND * 3,
              );
              copyToClipboard(checksummedAddress, COPY_OPTIONS);
            }}
          >
            <Text
              data-testid="selected-account-name"
              width={BlockSize.Full}
              fontWeight={FontWeight.Medium}
              color={TextColor.textDefault}
              ellipsis
              textAlign={TextAlign.Center}
              marginBottom={1}
            >
              {selectedAccount.metadata.name}
            </Text>
            <Text
              data-testid="selected-account-address"
              variant={TextVariant.bodyXs}
              color={TextColor.textAlternative}
              display={Display.Flex}
              alignItems={AlignItems.Center}
            >
              {
                ///: BEGIN:ONLY_INCLUDE_IF(build-mmi)
                showCustodyLabels && <CustodyLabels labels={custodyLabels} />
                ///: END:ONLY_INCLUDE_IF
              }
              {shortenAddress(checksummedAddress)}
              {showAccountCopyIcon && (
                <div
                  data-testid="selected-account-copy"
                  className="selected-account__copy"
                >
                  <Icon
                    name={
                      this.state.copied ? IconName.CopySuccess : IconName.Copy
                    }
                    size={IconSize.Sm}
                    color={IconColor.iconAlternative}
                  />
                </div>
              )}
            </Text>
          </button>
        </Tooltip>
      </div>
    );
  }
}

export default SelectedAccount;
