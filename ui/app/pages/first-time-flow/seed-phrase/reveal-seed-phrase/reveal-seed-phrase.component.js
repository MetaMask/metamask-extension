import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import classnames from 'classnames'
import LockIcon from '../../../../components/ui/lock-icon'
import Button from '../../../../components/ui/button'
import { INITIALIZE_CONFIRM_SEED_PHRASE_ROUTE, DEFAULT_ROUTE } from '../../../../helpers/constants/routes'
import { exportAsFile } from '../../../../helpers/utils/util'

export default class RevealSeedPhrase extends PureComponent {
  static contextTypes = {
    t: PropTypes.func,
    metricsEvent: PropTypes.func,
  }

  static propTypes = {
    history: PropTypes.object,
    seedPhrase: PropTypes.string,
    setSeedPhraseBackedUp: PropTypes.func,
    setCompletedOnboarding: PropTypes.func,
  }

  state = {
    isShowingSeedPhrase: false,
  }

  handleExport = () => {
    exportAsFile('MetaMask Secret Backup Phrase', this.props.seedPhrase, 'text/plain')
  }

  handleNext = event => {
    event.preventDefault()
    const { isShowingSeedPhrase } = this.state
    const { history } = this.props

    this.context.metricsEvent({
      eventOpts: {
        category: 'Onboarding',
        action: 'Seed Phrase Setup',
        name: 'Advance to Verify',
      },
    })

    if (!isShowingSeedPhrase) {
      return
    }

    history.push(INITIALIZE_CONFIRM_SEED_PHRASE_ROUTE)
  }

  handleSkip = event => {
    event.preventDefault()
    const { history, setSeedPhraseBackedUp, setCompletedOnboarding } = this.props

    this.context.metricsEvent({
      eventOpts: {
        category: 'Onboarding',
        action: 'Seed Phrase Setup',
        name: 'Remind me later',
      },
    })

    Promise.all([setCompletedOnboarding(), setSeedPhraseBackedUp(false)])
      .then(() => {
        history.push(DEFAULT_ROUTE)
      })
  }

  renderSecretWordsContainer () {
    const { t } = this.context
    const { seedPhrase } = this.props
    const { isShowingSeedPhrase } = this.state

    return (
      <div className="reveal-seed-phrase__secret">
        <div className={classnames(
          'reveal-seed-phrase__secret-words notranslate',
          { 'reveal-seed-phrase__secret-words--hidden': !isShowingSeedPhrase }
        )}>
          { seedPhrase }
        </div>
        {
          !isShowingSeedPhrase && (
            <div
              className="reveal-seed-phrase__secret-blocker"
              onClick={() => {
                this.context.metricsEvent({
                  eventOpts: {
                    category: 'Onboarding',
                    action: 'Seed Phrase Setup',
                    name: 'Revealed Words',
                  },
                })
                this.setState({ isShowingSeedPhrase: true })
              }}
            >
              <LockIcon
                width="28px"
                height="35px"
                fill="#FFFFFF"
              />
              <div className="reveal-seed-phrase__reveal-button">
                { t('clickToRevealSeed') }
              </div>
            </div>
          )
        }
      </div>
    )
  }

  render () {
    const { t } = this.context
    const { isShowingSeedPhrase } = this.state

    return (
      <div className="reveal-seed-phrase">
        <div className="seed-phrase__sections">
          <div className="seed-phrase__main">
            <div className="first-time-flow__header">
              { t('secretBackupPhrase') }
            </div>
            <div className="first-time-flow__text-block">
              { t('secretBackupPhraseDescription') }
            </div>
            <div className="first-time-flow__text-block">
              { t('secretBackupPhraseWarning') }
            </div>
            { this.renderSecretWordsContainer() }
          </div>
          <div className="seed-phrase__side">
            <div className="first-time-flow__text-block">
              { `${t('tips')}:` }
            </div>
            <div className="first-time-flow__text-block">
              { t('storePhrase') }
            </div>
            <div className="first-time-flow__text-block">
              { t('writePhrase') }
            </div>
            <div className="first-time-flow__text-block">
              { t('memorizePhrase') }
            </div>
            <div className="first-time-flow__text-block">
              <a
                className="reveal-seed-phrase__export-text"
                onClick={this.handleExport}>
                { t('downloadSecretBackup') }
              </a>
            </div>
          </div>
        </div>
        <div className="reveal-seed-phrase__buttons">
          <Button
            type="secondary"
            className="first-time-flow__button"
            onClick={this.handleSkip}
          >
            { t('remindMeLater') }
          </Button>
          <Button
            type="primary"
            className="first-time-flow__button"
            onClick={this.handleNext}
            disabled={!isShowingSeedPhrase}
          >
            { t('next') }
          </Button>
        </div>
      </div>
    )
  }
}
