import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { withRouter } from 'react-router-dom';
import { compose } from 'redux';
import { connect } from 'react-redux';
import FileInput from 'react-simple-file-input';
import * as actions from '../../../store/actions';
import { getMetaMaskAccounts } from '../../../selectors';
import Button from '../../../components/ui/button';
import { getMostRecentOverviewPage } from '../../../ducks/history/history';

const HELP_LINK =
  'https://metamask.zendesk.com/hc/en-us/articles/360015489331-Importing-an-Account';

class JsonImportSubview extends Component {
  state = {
    fileContents: '',
    isEmpty: true,
  };

  inputRef = React.createRef();

  render() {
    const { error, history, mostRecentOverviewPage } = this.props;
    const enabled = !this.state.isEmpty && this.state.fileContents !== '';

    return (
      <div className="new-account-import-form__json">
        <p>{this.context.t('usedByClients')}</p>
        <a
          className="warning"
          href={HELP_LINK}
          target="_blank"
          rel="noopener noreferrer"
        >
          {this.context.t('fileImportFail')}
        </a>
        <FileInput
          readAs="text"
          onLoad={this.onLoad.bind(this)}
          style={{
            padding: '20px 0px 12px 15%',
            fontSize: '15px',
            display: 'flex',
            justifyContent: 'center',
            width: '100%',
          }}
        />
        <input
          className="new-account-import-form__input-password"
          type="password"
          placeholder={this.context.t('enterPassword')}
          id="json-password-box"
          onKeyPress={this.createKeyringOnEnter.bind(this)}
          onChange={() => this.checkInputEmpty()}
          ref={this.inputRef}
        />
        <div className="new-account-create-form__buttons">
          <Button
            type="default"
            large
            className="new-account-create-form__button"
            onClick={() => history.push(mostRecentOverviewPage)}
          >
            {this.context.t('cancel')}
          </Button>
          <Button
            type="secondary"
            large
            className="new-account-create-form__button"
            onClick={() => this.createNewKeychain()}
            disabled={!enabled}
          >
            {this.context.t('import')}
          </Button>
        </div>
        {error ? <span className="error">{error}</span> : null}
      </div>
    );
  }

  onLoad(event) {
    this.setState({
      fileContents: event.target.result,
    });
  }

  createKeyringOnEnter(event) {
    if (event.key === 'Enter') {
      event.preventDefault();
      this.createNewKeychain();
    }
  }

  createNewKeychain() {
    const {
      firstAddress,
      displayWarning,
      history,
      importNewJsonAccount,
      mostRecentOverviewPage,
      setSelectedAddress,
    } = this.props;
    const { fileContents } = this.state;

    if (!fileContents) {
      const message = this.context.t('needImportFile');
      displayWarning(message);
      return;
    }

    const password = this.inputRef.current.value;

    importNewJsonAccount([fileContents, password])
      .then(({ selectedAddress }) => {
        if (selectedAddress) {
          history.push(mostRecentOverviewPage);
          this.context.metricsEvent({
            eventOpts: {
              category: 'Accounts',
              action: 'Import Account',
              name: 'Imported Account with JSON',
            },
          });
          displayWarning(null);
        } else {
          displayWarning('Error importing account.');
          this.context.metricsEvent({
            eventOpts: {
              category: 'Accounts',
              action: 'Import Account',
              name: 'Error importing JSON',
            },
          });
          setSelectedAddress(firstAddress);
        }
      })
      .catch((err) => err && displayWarning(err.message || err));
  }

  checkInputEmpty() {
    const password = this.inputRef.current.value;
    let isEmpty = true;
    if (password !== '') {
      isEmpty = false;
    }
    this.setState({ isEmpty });
  }
}

JsonImportSubview.propTypes = {
  error: PropTypes.string,
  displayWarning: PropTypes.func,
  firstAddress: PropTypes.string,
  importNewJsonAccount: PropTypes.func,
  history: PropTypes.object,
  setSelectedAddress: PropTypes.func,
  mostRecentOverviewPage: PropTypes.string.isRequired,
};

const mapStateToProps = (state) => {
  return {
    error: state.appState.warning,
    firstAddress: Object.keys(getMetaMaskAccounts(state))[0],
    mostRecentOverviewPage: getMostRecentOverviewPage(state),
  };
};

const mapDispatchToProps = (dispatch) => {
  return {
    displayWarning: (warning) => dispatch(actions.displayWarning(warning)),
    importNewJsonAccount: (options) =>
      dispatch(actions.importNewAccount('JSON File', options)),
    setSelectedAddress: (address) =>
      dispatch(actions.setSelectedAddress(address)),
  };
};

JsonImportSubview.contextTypes = {
  t: PropTypes.func,
  metricsEvent: PropTypes.func,
};

export default compose(
  withRouter,
  connect(mapStateToProps, mapDispatchToProps),
)(JsonImportSubview);
