import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import Button from '../../../../components/ui/button'
import { INITIALIZE_END_OF_FLOW_ROUTE } from '../../../../helpers/constants/routes'

export default class UniqueImageScreen extends PureComponent {
  static contextTypes = {
    t: PropTypes.func,
    metricsEvent: PropTypes.func,
  }

  static propTypes = {
    history: PropTypes.object,
  }

  render() {
    const { t } = this.context
    const { history } = this.props

    return (
      <div>
        <img src="/images/sleuth.svg" height={42} width={42} />
        <div className="first-time-flow__header">{t('protectYourKeys')}</div>
        <div className="first-time-flow__text-block">
          {t('protectYourKeysMessage1')}
        </div>
        <div className="first-time-flow__text-block">
          {t('protectYourKeysMessage2')}
        </div>
        <Button
          type="primary"
          className="first-time-flow__button"
          onClick={() => {
            this.context.metricsEvent({
              eventOpts: {
                category: 'Onboarding',
                action: 'Agree to Phishing Warning',
                name: 'Agree to Phishing Warning',
              },
            })
            history.push(INITIALIZE_END_OF_FLOW_ROUTE)
          }}
        >
          {t('next')}
        </Button>
      </div>
    )
  }
}
