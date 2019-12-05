import { DateTime } from 'luxon'
import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import HomeNotification from '../home-notification'

export default class DaiV1MigrationNotification extends PureComponent {
  static contextTypes = {
    t: PropTypes.func,
  }

  static defaultProps = {
    mkrMigrationReminderTimestamp: null,
    string: '',
    symbol: '',
  }

  static propTypes = {
    setMkrMigrationReminderTimestamp: PropTypes.func.isRequired,
    mkrMigrationReminderTimestamp: PropTypes.string,
    string: PropTypes.string,
    symbol: PropTypes.string,
  }

  remindMeLater = () => {
    const nextWeek = DateTime.utc().plus({
      days: 7,
    })
    this.props.setMkrMigrationReminderTimestamp(nextWeek.toString())
  }

  render () {
    const { t } = this.context
    const { mkrMigrationReminderTimestamp, string: balanceString, symbol } = this.props

    if (mkrMigrationReminderTimestamp) {
      const reminderDateTime = DateTime.fromISO(mkrMigrationReminderTimestamp, {
        zone: 'UTC',
      })
      if (reminderDateTime > DateTime.utc()) {
        return null
      }
    }

    if (!balanceString || !symbol) {
      return null
    }

    if (balanceString === '0') {
      return null
    }

    return (
      <HomeNotification
        descriptionText={(
          <div>
            {t('migrateSai')}
            &nbsp;
            <a
              href="#"
              onClick={() => {
                window.open('https://blog.makerdao.com/multi-collateral-dai-is-live/', '_blank', 'noopener')
              }}
            >
              {t('learnMore')}.
            </a>
          </div>
        )}
        acceptText={t('migrate')}
        onAccept={() => {
          window.open('https://migrate.makerdao.com', '_blank', 'noopener')
        }}
        ignoreText={t('remindMeLater')}
        onIgnore={this.remindMeLater}
        infoText={t('migrateSaiInfo')}
      />
    )
  }
}
