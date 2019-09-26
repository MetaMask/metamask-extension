import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import Button from '../../../components/ui/button'
import MetaFoxLogo from '../../../components/ui/metafox-logo'
import { DEFAULT_ROUTE } from '../../../helpers/constants/routes'

export default class EndOfFlowScreen extends PureComponent {
  static contextTypes = {
    t: PropTypes.func,
    metricsEvent: PropTypes.func,
  }

  static propTypes = {
    history: PropTypes.object,
    completeOnboarding: PropTypes.func,
    completionMetaMetricsName: PropTypes.string,
  }

  render () {
    const { t } = this.context
    const { history, completeOnboarding, completionMetaMetricsName } = this.props

    return (
      <div className="end-of-flow">
        <MetaFoxLogo />
        <div className="end-of-flow__emoji">🎉</div>
        <div className="first-time-flow__header">
          { t('congratulations') }
        </div>
        <div className="first-time-flow__text-block end-of-flow__text-1">
          { t('endOfFlowMessage1') }
        </div>
        <div className="first-time-flow__text-block end-of-flow__text-2">
          { t('endOfFlowMessage2') }
        </div>
        <div className="end-of-flow__text-3">
          { '• ' + t('endOfFlowMessage3') }
        </div>
        <div className="end-of-flow__text-3">
          { '• ' + t('endOfFlowMessage4') }
        </div>
        <div className="end-of-flow__text-3">
          { '• ' + t('endOfFlowMessage5') }
        </div>
        <div className="end-of-flow__text-3">
          { '• ' + t('endOfFlowMessage6') }
        </div>
        <div className="end-of-flow__text-3">
          { '• ' + t('endOfFlowMessage7') }
        </div>
        <div className="first-time-flow__text-block end-of-flow__text-4">
          { '*' + t('endOfFlowMessage8') } <a
            href="https://metamask.zendesk.com/hc/en-us/articles/360015489591-Basic-Safety-Tips"
            target="_blank"
            rel="noopener noreferrer"
          >
            <span className="first-time-flow__link-text">
              {t('endOfFlowMessage9')}
            </span>
          </a>
        </div>
        <Button
          type="primary"
          className="first-time-flow__button"
          onClick={async () => {
            await completeOnboarding()
            this.context.metricsEvent({
              eventOpts: {
                category: 'Onboarding',
                action: 'Onboarding Complete',
                name: completionMetaMetricsName,
              },
            })
            history.push(DEFAULT_ROUTE)
          }}
        >
          { t('endOfFlowMessage10') }
        </Button>
      </div>
    )
  }
}
