import React, { Component } from 'react';
import { withRouter } from 'react-router-dom';
import { compose } from 'redux';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import * as actions from '../../../store/actions';
import { getMetaMaskAccounts } from '../../../selectors';
import Button from '../../../components/ui/button';
import { getMostRecentOverviewPage } from '../../../ducks/history/history';
import {
  isBurnAddress,
  isValidHexAddress,
} from '../../../../shared/modules/hexstring-utils';

class PublicAddressImportView extends Component {
  static contextTypes = {
    t: PropTypes.func,
    metricsEvent: PropTypes.func,
  };

  static propTypes = {
    addWatchOnlyAccount: PropTypes.func.isRequired,
    addAddresses: PropTypes.func.isRequired,
    history: PropTypes.object.isRequired,
    displayWarning: PropTypes.func.isRequired,
    setSelectedAddress: PropTypes.func.isRequired,
    firstAddress: PropTypes.string.isRequired,
    error: PropTypes.node,
    mostRecentOverviewPage: PropTypes.string.isRequired,
  };

  inputRef = React.createRef();

  state = { isEmpty: true, validAddress: false };

  watchAccount() {
    const publicAddress = this.inputRef.current.value;
    const {
      addWatchOnlyAccount,
      history,
      displayWarning,
      mostRecentOverviewPage,
      setSelectedAddress,
      firstAddress,
      addAddresses,
    } = this.props;
    const { t } = this.context;

    Promise.all([
      addWatchOnlyAccount(publicAddress),
      addAddresses(publicAddress),
    ])
      .then(() => {
        this.context.metricsEvent({
          eventOpts: {
            category: 'Accounts',
            action: 'Watch Account',
            name: 'Watched Account with Public Address',
          },
        });
        history.push(mostRecentOverviewPage);
        displayWarning(null);
      })
      .catch((err) => {
        displayWarning(err.message || t('importAccountError'));
        this.context.metricsEvent({
          eventOpts: {
            category: 'Accounts',
            action: 'Watch Account',
            name: 'Error watching with Public Address',
          },
        });
        setSelectedAddress(firstAddress);
      });
  }

  checkInputEmpty() {
    const publicAddress = this.inputRef.current.value;
    let isEmpty = true;
    if (publicAddress !== '') {
      isEmpty = false;
    }
    this.setState({ isEmpty });
  }

  onPaste = (event) => {
    const { displayWarning } = this.props;
    const { t } = this.context;
    if (event.clipboardData.items?.length) {
      const clipboardItem = event.clipboardData.items[0];
      clipboardItem?.getAsString((text) => {
        const input = text.trim();
        this.setState({ validAddress: false });
        if (
          !isBurnAddress(input) &&
          isValidHexAddress(input, { mixedCaseUseChecksum: true })
        ) {
          this.setState({ validAddress: true });
          displayWarning(null);
        } else {
          displayWarning(t('invalidAddressRecipient'));
        }
      });
    }
  };

  onChange = ({ target: { value } }) => {
    const { displayWarning } = this.props;
    const { t } = this.context;
    const input = value.trim();
    this.setState({ validAddress: false });
    if (
      !isBurnAddress(input) &&
      isValidHexAddress(input, { mixedCaseUseChecksum: true })
    ) {
      this.setState({ validAddress: true });
      displayWarning(null);
    } else {
      displayWarning(t('invalidAddressRecipient'));
    }
    return null;
  };

  render() {
    const { error, displayWarning } = this.props;

    return (
      <div className="new-account-import-form__public-address">
        <span className="new-account-create-form__instruction">
          {this.context.t('pastePublicAddress')}
        </span>
        <div className="new-account-import-form__public-address-text-container">
          <input
            className="new-account-import-form__input-text"
            type="text"
            id="public-address-box"
            onPaste={(e) => {
              this.onPaste(e);
              this.checkInputEmpty();
            }}
            onChange={(e) => {
              this.onChange(e);
              this.checkInputEmpty();
            }}
            ref={this.inputRef}
            autoFocus
          />
        </div>
        <div className="new-account-import-form__buttons">
          <Button
            type="secondary"
            large
            className="new-account-create-form__button"
            onClick={() => {
              const { history, mostRecentOverviewPage } = this.props;
              displayWarning(null);
              history.push(mostRecentOverviewPage);
            }}
          >
            {this.context.t('cancel')}
          </Button>
          <Button
            type="primary"
            large
            className="new-account-create-form__button"
            onClick={() => this.watchAccount()}
            disabled={this.state.isEmpty || !this.state.validAddress}
          >
            {this.context.t('import')}
          </Button>
        </div>
        {error ? <span className="error">{error}</span> : null}
      </div>
    );
  }
}

export default compose(
  withRouter,
  connect(mapStateToProps, mapDispatchToProps),
)(PublicAddressImportView);

function mapStateToProps(state) {
  return {
    error: state.appState.warning,
    firstAddress: Object.keys(getMetaMaskAccounts(state))[0],
    mostRecentOverviewPage: getMostRecentOverviewPage(state),
  };
}

function mapDispatchToProps(dispatch) {
  return {
    addWatchOnlyAccount: (publicAddress) =>
      dispatch(actions.addWatchOnlyAccount(publicAddress.toLowerCase())),
    addAddresses: (publicAddress) =>
      dispatch(actions.addAddresses([publicAddress.toLowerCase()])),
    displayWarning: (message) =>
      dispatch(actions.displayWarning(message || null)),
    setSelectedAddress: (address) =>
      dispatch(actions.setSelectedAddress(address)),
  };
}
