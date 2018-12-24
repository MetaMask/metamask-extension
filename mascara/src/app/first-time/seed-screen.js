import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import classnames from 'classnames'
import { withRouter } from 'react-router-dom'
import { compose } from 'recompose'
import Identicon from '../../../../ui/app/components/identicon'
import {exportAsFile} from '../../../../ui/app/util'
import Breadcrumbs from './breadcrumbs'
import LoadingScreen from './loading-screen'
import { DEFAULT_ROUTE, INITIALIZE_CONFIRM_SEED_ROUTE } from '../../../../ui/app/routes'

const LockIcon = props => (
  <svg
    version="1.1"
    id="Capa_1"
    xmlns="http://www.w3.org/2000/svg"
    xmlnsXlink="http://www.w3.org/1999/xlink"
    x="0px"
    y="0px"
    width="401.998px"
    height="401.998px"
    viewBox="0 0 401.998 401.998"
    style={{enableBackground: 'new 0 0 401.998 401.998'}}
    xmlSpace="preserve"
    {...props}
  >
    <g>
      <path
        d="M357.45,190.721c-5.331-5.33-11.8-7.993-19.417-7.993h-9.131v-54.821c0-35.022-12.559-65.093-37.685-90.218
          C266.093,12.563,236.025,0,200.998,0c-35.026,0-65.1,12.563-90.222,37.688C85.65,62.814,73.091,92.884,73.091,127.907v54.821
          h-9.135c-7.611,0-14.084,2.663-19.414,7.993c-5.33,5.326-7.994,11.799-7.994,19.417V374.59c0,7.611,2.665,14.086,7.994,19.417
          c5.33,5.325,11.803,7.991,19.414,7.991H338.04c7.617,0,14.085-2.663,19.417-7.991c5.325-5.331,7.994-11.806,7.994-19.417V210.135
          C365.455,202.523,362.782,196.051,357.45,190.721z M274.087,182.728H127.909v-54.821c0-20.175,7.139-37.402,21.414-51.675
          c14.277-14.275,31.501-21.411,51.678-21.411c20.179,0,37.399,7.135,51.677,21.411c14.271,14.272,21.409,31.5,21.409,51.675V182.728
          z"
      />
    </g>
  </svg>
)

class BackupPhraseScreen extends Component {
  static contextTypes = {
    t: PropTypes.func,
  }

  static propTypes = {
    isLoading: PropTypes.bool.isRequired,
    address: PropTypes.string.isRequired,
    seedWords: PropTypes.string,
    history: PropTypes.object,
  };

  static defaultProps = {
    seedWords: '',
  }

  constructor (props) {
    super(props)
    this.state = {
      isShowingSecret: false,
    }
  }

  componentWillMount () {
    const { seedWords, history } = this.props

    if (!seedWords) {
      history.push(DEFAULT_ROUTE)
    }
  }

  exportSeedWords = () => {
    const { seedWords } = this.props

    exportAsFile('MetaMask Secret Backup Phrase', seedWords, 'text/plain')
  }

  renderSecretWordsContainer () {
    const { isShowingSecret } = this.state

    return (
      <div className="backup-phrase__secret">
        <div className={classnames('backup-phrase__secret-words', {
          'backup-phrase__secret-words--hidden': !isShowingSecret,
        })}>
          {this.props.seedWords}
        </div>
        {!isShowingSecret && (
          <div
            className="backup-phrase__secret-blocker"
            onClick={() => this.setState({ isShowingSecret: true })}
          >
            <LockIcon width="28px" height="35px" fill="#FFFFFF" />
            <div
              className="backup-phrase__reveal-button"
            >
              {this.context.t('backupPhraseReveal')}
            </div>
          </div>
        )}
      </div>
    )
  }

  renderSecretScreen () {
    const { isShowingSecret } = this.state
    const { history } = this.props

    return (
      <div className="backup-phrase__content-wrapper">
        <div className="backup-phrase__phrase">
          <div className="backup-phrase__title">{this.context.t('backupPhraseTitle')}</div>
          <div className="backup-phrase__body-text">
            {this.context.t('backupPhraseInfo')}
          </div>
          <div className="backup-phrase__body-text">
            {this.context.t('backupPhraseWarning')}
          </div>
          {this.renderSecretWordsContainer()}
        </div>
        <div className="backup-phrase__tips">
          <div className="backup-phrase__tips-text">{this.context.t('tips')}:</div>
          <div className="backup-phrase__tips-text">
            {this.context.t('backupPhraseTip1')}
          </div>
          <div className="backup-phrase__tips-text">
            {this.context.t('backupPhraseTip2')}
          </div>
          <div className="backup-phrase__tips-text">
          {this.context.t('backupPhraseTip3')}
          </div>
          <div className="backup-phrase__tips-text">
            <strong>
              <a className="backup-phrase__tips-text--link backup-phrase__tips-text--strong" onClick={this.exportSeedWords}>
                {this.context.t('backupPhraseDownload')}
              </a>
            </strong> {this.context.t('backupPhraseStore')}
          </div>
        </div>
        <div className="backup-phrase__next-button">
          <button
            className="first-time-flow__button"
            onClick={() => isShowingSecret && history.push(INITIALIZE_CONFIRM_SEED_ROUTE)}
            disabled={!isShowingSecret}
          >
            {this.context.t('next')}
          </button>
          <Breadcrumbs total={3} currentIndex={1} />
        </div>
      </div>
    )
  }

  render () {
    return this.props.isLoading
      ? <LoadingScreen loadingMessage="Creating your new account" />
      : (
        <div className="first-view-main-wrapper">
          <div className="first-view-main">
            <div className="backup-phrase">
              <Identicon address={this.props.address} diameter={70} />
              {this.renderSecretScreen()}
            </div>
          </div>
        </div>
      )
  }
}

export default compose(
  withRouter,
  connect(
    ({ metamask: { selectedAddress, seedWords }, appState: { isLoading } }) => ({
      seedWords,
      isLoading,
      address: selectedAddress,
    })
  )
)(BackupPhraseScreen)
