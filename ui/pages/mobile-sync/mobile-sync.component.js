import React, { Component } from 'react';

import PropTypes from 'prop-types';
import classnames from 'classnames';
import PubNub from 'pubnub';
import qrCode from 'qrcode-generator';

import Button from '../../components/ui/button';
import LoadingScreen from '../../components/ui/loading-screen';
import { MINUTE, SECOND } from '../../../shared/constants/time';

const PASSWORD_PROMPT_SCREEN = 'PASSWORD_PROMPT_SCREEN';
const REVEAL_SEED_SCREEN = 'REVEAL_SEED_SCREEN';
const KEYS_GENERATION_TIME = SECOND * 30;
const IDLE_TIME = MINUTE * 2;

export default class MobileSyncPage extends Component {
  static contextTypes = {
    t: PropTypes.func,
  };

  static propTypes = {
    history: PropTypes.object.isRequired,
    selectedAddress: PropTypes.string.isRequired,
    displayWarning: PropTypes.func.isRequired,
    fetchInfoToSync: PropTypes.func.isRequired,
    mostRecentOverviewPage: PropTypes.string.isRequired,
    requestRevealSeedWords: PropTypes.func.isRequired,
    exportAccounts: PropTypes.func.isRequired,
    keyrings: PropTypes.array,
  };

  state = {
    screen: PASSWORD_PROMPT_SCREEN,
    password: '',
    seedWords: null,
    importedAccounts: [],
    error: null,
    syncing: false,
    completed: false,
    channelName: undefined,
    cipherKey: undefined,
  };

  syncing = false;

  componentDidMount() {
    const passwordBox = document.getElementById('password-box');
    if (passwordBox) {
      passwordBox.focus();
    }
  }

  startIdleTimeout() {
    this.idleTimeout = setTimeout(() => {
      this.clearTimeouts();
      this.goBack();
    }, IDLE_TIME);
  }

  handleSubmit(event) {
    event.preventDefault();
    this.setState({ seedWords: null, error: null });
    this.props
      .requestRevealSeedWords(this.state.password)
      .then((seedWords) => {
        this.startKeysGeneration();
        this.startIdleTimeout();
        this.exportAccounts().then((importedAccounts) => {
          this.setState({
            seedWords,
            importedAccounts,
            screen: REVEAL_SEED_SCREEN,
          });
        });
      })
      .catch((error) => this.setState({ error: error.message }));
  }

  async exportAccounts() {
    const addresses = [];
    this.props.keyrings.forEach((keyring) => {
      if (keyring.type === 'Simple Key Pair') {
        addresses.push(keyring.accounts[0]);
      }
    });
    const importedAccounts = await this.props.exportAccounts(
      this.state.password,
      addresses,
    );
    return importedAccounts;
  }

  startKeysGeneration() {
    this.keysGenerationTimeout && clearTimeout(this.keysGenerationTimeout);
    this.disconnectWebsockets();
    this.generateCipherKeyAndChannelName();
    this.initWebsockets();
    this.keysGenerationTimeout = setTimeout(() => {
      this.startKeysGeneration();
    }, KEYS_GENERATION_TIME);
  }

  goBack() {
    const { history, mostRecentOverviewPage } = this.props;
    history.push(mostRecentOverviewPage);
  }

  clearTimeouts() {
    this.keysGenerationTimeout && clearTimeout(this.keysGenerationTimeout);
    this.idleTimeout && clearTimeout(this.idleTimeout);
  }

  generateCipherKeyAndChannelName() {
    this.cipherKey = `${this.props.selectedAddress.substr(
      -4,
    )}-${PubNub.generateUUID()}`;
    this.channelName = `mm-${PubNub.generateUUID()}`;
    this.setState({ cipherKey: this.cipherKey, channelName: this.channelName });
  }

  initWithCipherKeyAndChannelName(cipherKey, channelName) {
    this.cipherKey = cipherKey;
    this.channelName = channelName;
  }

  initWebsockets() {
    // Make sure there are no existing listeners
    this.disconnectWebsockets();

    this.pubnub = new PubNub({
      subscribeKey: process.env.PUBNUB_SUB_KEY,
      publishKey: process.env.PUBNUB_PUB_KEY,
      cipherKey: this.cipherKey,
      ssl: true,
    });

    this.pubnubListener = {
      message: (data) => {
        const { channel, message } = data;
        // handle message
        if (channel !== this.channelName || !message) {
          return;
        }

        if (message.event === 'start-sync') {
          this.startSyncing();
        } else if (message.event === 'connection-info') {
          this.keysGenerationTimeout &&
            clearTimeout(this.keysGenerationTimeout);
          this.disconnectWebsockets();
          this.initWithCipherKeyAndChannelName(message.cipher, message.channel);
          this.initWebsockets();
        } else if (message.event === 'end-sync') {
          this.disconnectWebsockets();
          this.setState({ syncing: false, completed: true });
        }
      },
    };

    this.pubnub.addListener(this.pubnubListener);

    this.pubnub.subscribe({
      channels: [this.channelName],
      withPresence: false,
    });
  }

  disconnectWebsockets() {
    if (this.pubnub && this.pubnubListener) {
      this.pubnub.removeListener(this.pubnubListener);
    }
  }

  // Calculating a PubNub Message Payload Size.
  calculatePayloadSize(channel, message) {
    return encodeURIComponent(channel + JSON.stringify(message)).length + 100;
  }

  chunkString(str, size) {
    const numChunks = Math.ceil(str.length / size);
    const chunks = new Array(numChunks);
    let o = 0;
    for (let i = 0; i < numChunks; i += 1) {
      chunks[i] = str.substr(o, size);
      o += size;
    }
    return chunks;
  }

  notifyError(errorMsg) {
    return new Promise((resolve, reject) => {
      this.pubnub.publish(
        {
          message: {
            event: 'error-sync',
            data: errorMsg,
          },
          channel: this.channelName,
          sendByPost: false, // true to send via post
          storeInHistory: false,
        },
        (status, response) => {
          if (status.error) {
            reject(response);
          } else {
            resolve();
          }
        },
      );
    });
  }

  async startSyncing() {
    if (this.syncing) {
      return;
    }
    this.syncing = true;
    this.setState({ syncing: true });

    const {
      accounts,
      network,
      preferences,
      transactions,
    } = await this.props.fetchInfoToSync();

    const allDataStr = JSON.stringify({
      accounts,
      network,
      preferences,
      transactions,
      udata: {
        pwd: this.state.password,
        seed: this.state.seedWords,
        importedAccounts: this.state.importedAccounts,
      },
    });

    const chunks = this.chunkString(allDataStr, 17000);
    const totalChunks = chunks.length;
    try {
      for (let i = 0; i < totalChunks; i++) {
        await this.sendMessage(chunks[i], i + 1, totalChunks);
      }
    } catch (e) {
      this.props.displayWarning('Sync failed :(');
      this.setState({ syncing: false });
      this.syncing = false;
      this.notifyError(e.toString());
    }
  }

  sendMessage(data, pkg, count) {
    return new Promise((resolve, reject) => {
      this.pubnub.publish(
        {
          message: {
            event: 'syncing-data',
            data,
            totalPkg: count,
            currentPkg: pkg,
          },
          channel: this.channelName,
          sendByPost: false, // true to send via post
          storeInHistory: false,
        },
        (status, response) => {
          if (status.error) {
            reject(response);
          } else {
            resolve();
          }
        },
      );
    });
  }

  componentWillUnmount() {
    this.clearTimeouts();
    this.disconnectWebsockets();
  }

  renderWarning(text) {
    return (
      <div className="page-container__warning-container">
        <div className="page-container__warning-message">
          <div>{text}</div>
        </div>
      </div>
    );
  }

  renderContent() {
    const { syncing, completed, screen } = this.state;
    const { t } = this.context;

    if (syncing) {
      return <LoadingScreen loadingMessage={t('syncInProgress')} />;
    }

    if (completed) {
      return (
        <div className="reveal-seed__content">
          <label
            className="reveal-seed__label"
            style={{
              width: '100%',
              textAlign: 'center',
            }}
          >
            {t('syncWithMobileComplete')}
          </label>
        </div>
      );
    }

    return screen === PASSWORD_PROMPT_SCREEN ? (
      <div>
        {this.renderWarning(this.context.t('mobileSyncText'))}
        <div className="reveal-seed__content">
          {this.renderPasswordPromptContent()}
        </div>
      </div>
    ) : (
      <div>
        {this.renderWarning(this.context.t('syncWithMobileBeCareful'))}
        <div className="reveal-seed__content">
          {this.renderRevealSeedContent()}
        </div>
      </div>
    );
  }

  renderPasswordPromptContent() {
    const { t } = this.context;

    return (
      <form onSubmit={(event) => this.handleSubmit(event)}>
        <label className="input-label" htmlFor="password-box">
          {t('enterPasswordContinue')}
        </label>
        <div className="input-group">
          <input
            type="password"
            placeholder={t('password')}
            id="password-box"
            value={this.state.password}
            onChange={(event) =>
              this.setState({ password: event.target.value })
            }
            className={classnames('form-control', {
              'form-control--error': this.state.error,
            })}
          />
        </div>
        {this.state.error && (
          <div className="reveal-seed__error">{this.state.error}</div>
        )}
      </form>
    );
  }

  renderRevealSeedContent() {
    const qrImage = qrCode(0, 'M');
    qrImage.addData(
      `metamask-sync:${this.state.channelName}|@|${this.state.cipherKey}`,
    );
    qrImage.make();

    const { t } = this.context;
    return (
      <div>
        <label
          className="reveal-seed__label"
          style={{
            width: '100%',
            textAlign: 'center',
          }}
        >
          {t('syncWithMobileScanThisCode')}
        </label>
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
          }}
          dangerouslySetInnerHTML={{
            __html: qrImage.createTableTag(4),
          }}
        />
      </div>
    );
  }

  renderFooter() {
    return this.state.screen === PASSWORD_PROMPT_SCREEN
      ? this.renderPasswordPromptFooter()
      : this.renderRevealSeedFooter();
  }

  renderPasswordPromptFooter() {
    const { t } = this.context;
    const { password } = this.state;

    return (
      <div className="new-account-import-form__buttons" style={{ padding: 30 }}>
        <Button
          type="default"
          large
          className="new-account-create-form__button"
          onClick={() => this.goBack()}
        >
          {t('cancel')}
        </Button>
        <Button
          type="secondary"
          large
          className="new-account-create-form__button"
          onClick={(event) => this.handleSubmit(event)}
          disabled={password === ''}
        >
          {t('next')}
        </Button>
      </div>
    );
  }

  renderRevealSeedFooter() {
    const { t } = this.context;

    return (
      <div className="page-container__footer" style={{ padding: 30 }}>
        <Button
          type="default"
          large
          className="page-container__footer-button"
          onClick={() => this.goBack()}
        >
          {t('close')}
        </Button>
      </div>
    );
  }

  render() {
    const { t } = this.context;
    const { screen } = this.state;

    return (
      <div className="page-container">
        <div className="page-container__header">
          <div className="page-container__title">
            {t('syncWithMobileTitle')}
          </div>
          {screen === PASSWORD_PROMPT_SCREEN ? (
            <div className="page-container__subtitle">
              {t('syncWithMobileDesc')}
            </div>
          ) : null}
          {screen === PASSWORD_PROMPT_SCREEN ? (
            <div className="page-container__subtitle">
              {t('syncWithMobileDescNewUsers')}
            </div>
          ) : null}
        </div>
        <div className="page-container__content">{this.renderContent()}</div>
        {this.renderFooter()}
      </div>
    );
  }
}
