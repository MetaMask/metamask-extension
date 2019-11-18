import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import HomeNotification from '../home-notification'

export default class DaiV1MigrationNotification extends PureComponent {
  static contextTypes = {
    t: PropTypes.func,
  }

  static defaultProps = {
    string: '',
    symbol: '',
  }

  static propTypes = {
    string: PropTypes.string,
    symbol: PropTypes.string,
  }

  render () {
    const { t } = this.context
    const { string: balanceString, symbol } = this.props

    if (!balanceString || !symbol) {
      return null
    }

    if (balanceString === '0') {
      return null
    }

    return (
      <HomeNotification
        descriptionText={t('migrateSai')}
        acceptText={t('migrate')}
        onAccept={() => {
          window.open('https://migrate.makerdao.com', '_blank', 'noopener')
        }}
        ignoreText={t('learnMore')}
        onIgnore={() => {
          window.open('https://blog.makerdao.com/multi-collateral-dai-is-live/', '_blank', 'noopener')
        }}
      />
    )
  }
}
