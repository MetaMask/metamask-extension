import PropTypes from 'prop-types'
import React, { PureComponent } from 'react'

export default class AddTokenButton extends PureComponent {
  static contextTypes = {
    t: PropTypes.func.isRequired,
  }

  static defaultProps = {
    onClick: () => {},
  }

  static propTypes = {
    onClick: PropTypes.func,
  }

  render () {
    const { t } = this.context
    const { onClick } = this.props

    return (
      <div className="add-token-button">
        <span className="add-token-button__description">{t('missingYourTokens')}</span>
        <button
          className="add-token-button__button"
          onClick={onClick}
        >
          {t('addToken')}
        </button>
      </div>
    )
  }
}
