import React, { Component } from 'react'
import PropTypes from 'prop-types'
import {connect} from 'react-redux'
import classnames from 'classnames'
import shuffle from 'lodash.shuffle'
import {compose, onlyUpdateForPropTypes} from 'recompose'
import Identicon from '../../../../ui/app/components/identicon'
import {confirmSeedWords} from '../../../../ui/app/actions'
import Breadcrumbs from './breadcrumbs'
import LoadingScreen from './loading-screen'

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
);

class BackupPhraseScreen extends Component {
  static propTypes = {
    isLoading: PropTypes.bool.isRequired,
    address: PropTypes.string.isRequired,
    seedWords: PropTypes.string.isRequired,
    next: PropTypes.func.isRequired,
    confirmSeedWords: PropTypes.func.isRequired,
  };

  static defaultProps = {
    seedWords: ''
  };

  static PAGE = {
    SECRET: 'secret',
    CONFIRM: 'confirm'
  };

  constructor(props) {
    const {seedWords} = props
    super(props)
    this.state = {
      isShowingSecret: false,
      page: BackupPhraseScreen.PAGE.SECRET,
      selectedSeeds: [],
      shuffledSeeds: seedWords && shuffle(seedWords.split(' ')),
    }
  }

  renderSecretWordsContainer () {
    const { isShowingSecret } = this.state

    return (
      <div className="backup-phrase__secret">
        <div className={classnames('backup-phrase__secret-words', {
          'backup-phrase__secret-words--hidden': !isShowingSecret
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
              Click here to reveal secret words
            </div>
          </div>
        )}
      </div>
    )
  }

  renderSecretScreen () {
    const { isShowingSecret } = this.state

    return (
      <div className="backup-phrase__content-wrapper">
        <div className="backup-phrase__phrase">
          <div className="backup-phrase__title">Secret Backup Phrase</div>
          <div className="backup-phrase__body-text">
            Your secret backup phrase makes it easy to back up and restore your account.
          </div>
          <div className="backup-phrase__body-text">
            WARNING: Never disclose your backup phrase. Anyone with this phrase can take your Ether forever.
          </div>
          {this.renderSecretWordsContainer()}
        </div>
        <div className="backup-phrase__tips">
          <div className="backup-phrase__tips-text">Tips:</div>
          <div className="backup-phrase__tips-text">
            Store this phrase in a password manager like 1password.
          </div>
          <div className="backup-phrase__tips-text">
            Write this phrase on a piece of paper and store in a secure location. If you want even more security, write it down on multiple pieces of paper and store each in 2 - 3 different locations.
          </div>
          <div className="backup-phrase__tips-text">
            Memorize this phrase.
          </div>
        </div>
        <div className="backup-phrase__next-button">
          <button
            className="first-time-flow__button"
            onClick={() => isShowingSecret && this.setState({
              isShowingSecret: false,
              page: BackupPhraseScreen.PAGE.CONFIRM,
            })}
            disabled={!isShowingSecret}
          >
            Next
          </button>
          <Breadcrumbs total={3} currentIndex={1} />
        </div>
      </div>
    )
  }

  renderConfirmationScreen() {
    const { seedWords, confirmSeedWords, next } = this.props;
    const { selectedSeeds, shuffledSeeds } = this.state;
    const isValid = seedWords === selectedSeeds.map(([_, seed]) => seed).join(' ')

    return (
      <div className="backup-phrase__content-wrapper">
        <div>
          <div className="backup-phrase__title">Confirm your Secret Backup Phrase</div>
          <div className="backup-phrase__body-text">
            Please select each phrase in order to make sure it is correct.
          </div>
          <div className="backup-phrase__confirm-secret">
            {selectedSeeds.map(([_, word], i) => (
              <button
                key={i}
                className="backup-phrase__confirm-seed-option"
              >
                {word}
              </button>
            ))}
          </div>
          <div className="backup-phrase__confirm-seed-options">
            {shuffledSeeds.map((word, i) => {
              const isSelected = selectedSeeds
                .filter(([index, seed]) => seed === word && index === i)
                .length

              return (
                <button
                  key={i}
                  className={classnames('backup-phrase__confirm-seed-option', {
                    'backup-phrase__confirm-seed-option--selected': isSelected
                  })}
                  onClick={() => {
                    if (!isSelected) {
                      this.setState({
                        selectedSeeds: [...selectedSeeds, [i, word]]
                      })
                    } else {
                      this.setState({
                        selectedSeeds: selectedSeeds
                          .filter(([index, seed]) => !(seed === word && index === i))
                      })
                    }
                  }}
                >
                  {word}
                </button>
              )
            })}
          </div>
          <button
            className="first-time-flow__button"
            onClick={() => isValid && confirmSeedWords().then(next)}
            disabled={!isValid}
          >
            Confirm
          </button>
        </div>
      </div>
    )
  }

  renderBack () {
    return this.state.page === BackupPhraseScreen.PAGE.CONFIRM
      ? (
        <a
          className="backup-phrase__back-button"
          onClick={e => {
            e.preventDefault()
            this.setState({
              page: BackupPhraseScreen.PAGE.SECRET
            })
          }}
          href="#"
        >
          {`< Back`}
        </a>
      )
      : null
  }

  renderContent () {
    switch (this.state.page) {
      case BackupPhraseScreen.PAGE.CONFIRM:
        return this.renderConfirmationScreen()
      case BackupPhraseScreen.PAGE.SECRET:
      default:
        return this.renderSecretScreen()
    }
  }

  render () {
    return this.props.isLoading
      ? <LoadingScreen loadingMessage="Creating your new account" />
      : (
        <div className="first-view-main-wrapper">
          <div className="first-view-main">
            <div className="backup-phrase">
              {this.renderBack()}
              <Identicon address={this.props.address} diameter={70} />
              {this.renderContent()}
            </div>
          </div>
        </div>
      )
  }
}

export default compose(
  onlyUpdateForPropTypes,
  connect(
    ({ metamask: { selectedAddress, seedWords }, appState: { isLoading } }) => ({
      seedWords,
      isLoading,
      address: selectedAddress,
    }),
    dispatch => ({
      confirmSeedWords: () => dispatch(confirmSeedWords()),
    })
  )
)(BackupPhraseScreen)
