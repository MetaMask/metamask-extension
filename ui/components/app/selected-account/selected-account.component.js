import React, { Component } from 'react';
import PropTypes from 'prop-types';
import copyToClipboard from 'copy-to-clipboard';
import { shortenAddress } from '../../../helpers/utils/util';

import Tooltip from '../../ui/tooltip';
import { toChecksumHexAddress } from '../../../../shared/modules/hexstring-utils';
import { SECOND } from '../../../../shared/constants/time';
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
    const { selectedAccount } = this.props;

    const checksummedAddress = toChecksumHexAddress(selectedAccount.address);

    const title = this.state.copied
      ? t('copiedExclamation')
      : t('copyToClipboard');

    const showAccountCopyIcon = true;

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
              {/* // TODO Wallet UX?: Migrate to new account group name */}
            </Text>
            <Text
              data-testid="selected-account-address"
              variant={TextVariant.bodyXs}
              color={TextColor.textAlternative}
              display={Display.Flex}
              alignItems={AlignItems.Center}
            >
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
