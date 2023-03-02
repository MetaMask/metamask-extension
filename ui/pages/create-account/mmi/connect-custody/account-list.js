import PropTypes from 'prop-types';
import React, { Component } from 'react';
import copy from 'copy-to-clipboard';
import Button from '../../../../components/ui/button';
import CustodyLabels from '../../../../components/ui/mmi/custody-labels';
import { SWAPS_CHAINID_DEFAULT_BLOCK_EXPLORER_URL_MAP } from '../../../../../shared/constants/swaps';
import { CHAIN_IDS } from '../../../../../shared/constants/network';
import { SECOND } from '../../../../../shared/constants/time';
import { shortenAddress } from '../../../../helpers/utils/util';
import Tooltip from '../../../../components/ui/tooltip';
import CopyIcon from '../../../../components/ui/mmi/icon/copy-icon.component';
import OpenInNewTab from '../../../../components/ui/mmi/icon/open-in-new-tab.component';

class CustodyAccountList extends Component {
  state = {
    copied: false,
  };

  renderAccounts() {
    const { rawList, accounts, onAccountChange, selectedAccounts } = this.props;

    const tooltipText = this.state.copied
      ? this.context.t('copiedExclamation')
      : this.context.t('copyToClipboard');

    return (
      <div className="custody-account-list" data-testid="custody-account-list">
        {accounts.map((account, idx) => (
          <div className="custody-account-list__item" key={account.address}>
            <div
              data-testid="custody-account-list-item-radio-button"
              className="custody-account-list__item__radio"
            >
              {!rawList && (
                <input
                  type="checkbox"
                  name="selectedAccount"
                  id={`address-${idx}`}
                  value={account.address}
                  onChange={(e) =>
                    onAccountChange({
                      name: account.name,
                      address: e.target.value,
                      custodianDetails: account.custodianDetails,
                      labels: account.labels,
                      chainId: account.chainId,
                    })
                  }
                  checked={
                    selectedAccounts && selectedAccounts[account.address]
                  }
                />
              )}
            </div>
            <div className="custody-account-list__item__body">
              <label
                htmlFor={`address-${idx}`}
                className="custody-account-list__item__title"
              >
                <span className="custody-account-list__item__name">
                  {account.name}
                </span>
              </label>
              <label
                htmlFor={`address-${idx}`}
                className="custody-account-list__item__subtitle"
              >
                <span className="custody-account-list__item__address">
                  <a
                    className="custody-account-list__item__address-link"
                    href={`${
                      SWAPS_CHAINID_DEFAULT_BLOCK_EXPLORER_URL_MAP[
                        CHAIN_IDS.MAINNET
                      ]
                    }address/${account.address}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {shortenAddress(account.address)}
                    <OpenInNewTab
                      size={15}
                      color="#037DD6"
                      className="link-icon"
                    />
                  </a>
                  <Tooltip position="bottom" title={tooltipText}>
                    <button
                      className="custody-account-list__item__address-clipboard"
                      onClick={() => {
                        this.setState({ copied: true });
                        this.copyTimeout = setTimeout(
                          () => this.setState({ copied: false }),
                          SECOND * 3,
                        );
                        copy(account.address);
                      }}
                    >
                      <CopyIcon
                        size={12}
                        color="#989a9b"
                        className="copy-icon"
                      />
                    </button>
                  </Tooltip>
                </span>
              </label>
              <div className="custody-account-list__item-details">
                {account.labels && (
                  <CustodyLabels
                    labels={account.labels}
                    index={idx.toString()}
                    hideNetwork
                  />
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  renderButtons() {
    const disabled = Object.keys(this.props.selectedAccounts).length === 0;
    const buttonProps = {};
    if (disabled) {
      buttonProps.disabled = true;
    }

    return (
      <div className="new-custody-account-form__buttons">
        <Button
          type="default"
          large
          className="new-custody-account-form__button"
          onClick={this.props.onCancel.bind(this)}
        >
          {this.context.t('cancel')}
        </Button>
        <Button
          data-testid="custody-account-connect-button"
          type="primary"
          large
          className="new-custody-account-form__button unlock"
          disabled={disabled}
          onClick={this.props.onAddAccounts.bind(this, this.props.custody)}
        >
          {this.context.t('connect')}
        </Button>
      </div>
    );
  }

  render() {
    const { rawList } = this.props;
    return (
      <>
        <div className="custody-account-list-container">
          {this.renderAccounts()}
        </div>
        {!rawList && this.renderButtons()}
      </>
    );
  }
}

CustodyAccountList.propTypes = {
  custody: PropTypes.string,
  accounts: PropTypes.array.isRequired,
  onAccountChange: PropTypes.func,
  selectedAccounts: PropTypes.object,
  onAddAccounts: PropTypes.func,
  onCancel: PropTypes.func,
  // eslint-disable-next-line react/no-unused-prop-types
  provider: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
  rawList: PropTypes.bool,
};

CustodyAccountList.contextTypes = {
  t: PropTypes.func,
};

export default CustodyAccountList;
