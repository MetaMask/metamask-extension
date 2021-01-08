import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { INITIALIZE_IMPORT_COBO_VAULT_ROUTE } from '../../../helpers/constants/routes'

export default class CreateCoboVaultHint extends Component {
  static contextTypes = {
    t: PropTypes.func,
  }

  static propTypes = {
    history: PropTypes.object.isRequired,
  }

  handleContinue() {
    this.props.history.push(INITIALIZE_IMPORT_COBO_VAULT_ROUTE)
  }

  render() {
    const { t } = this.context
    return (
      <div className="create-cobo-vault-hint">
        <div className="first-time-flow__header">{t('syncCoboTitle')}</div>
        <p>{t('syncStep1')}</p>
        <p>{t('syncStep2')}</p>
        <p>{t('syncStep3')}</p>
        <p>{t('syncStep4')}</p>
        <p style={{ color: 'grey', fontSize: 14 }}>{t('syncSubMessage')}</p>
        <div>
          <a href={t('syncLink')}>{t('syncLinkDescription')}</a>
        </div>
        <button
          className="first-time-flow__button"
          onClick={() => this.handleContinue()}
        >
          {t('syncCobo')}
        </button>
      </div>
    )
  }
}
