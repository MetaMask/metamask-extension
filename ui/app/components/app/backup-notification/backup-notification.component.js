import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import Button from '../../ui/button'
import {
  INITIALIZE_SEED_PHRASE_ROUTE,
} from '../../../helpers/constants/routes'

export default class BackupNotification extends PureComponent {
  static propTypes = {
    history: PropTypes.object,
    showSeedPhraseBackupAfterOnboarding: PropTypes.func,
  }

  static contextTypes = {
    t: PropTypes.func,
    metricsEvent: PropTypes.func,
  }

  handleSubmit = () => {
    const { history, showSeedPhraseBackupAfterOnboarding } = this.props
    showSeedPhraseBackupAfterOnboarding()
    history.push(INITIALIZE_SEED_PHRASE_ROUTE)
  }

  handleIgnore () {

  }

  render () {
    const { t } = this.context

    return (
      <div className="backup-notification">
        <div className="backup-notification__header">
          <img
            className="backup-notification__icon"
            src="images/meta-shield.svg"
          />
          <div className="backup-notification__text">Backup your Secret Recovery code to keep your wallet and funds secure.</div>
          <i className="fa fa-info-circle"></i>
        </div>
        <div className="backup-notification__buttons">
          <Button
            type="secondary"
            className="backup-notification__ignore-button"
            onClick={this.handleIgnore}
          >
            { t('remindMeLater') }
          </Button>
          <Button
            type="primary"
            className="backup-notification__submit-button"
            onClick={this.handleSubmit}
          >
            { t('backupNow') }
          </Button>
        </div>
      </div>
    )
  }
}
