import React, { useContext } from 'react'
import { useDispatch } from 'react-redux'
import { useHistory } from 'react-router-dom'
import PropTypes from 'prop-types'
import { setSwapsFromToken } from '../../../ducks/swaps/swaps'
import { I18nContext } from '../../../contexts/i18n'
import { BUILD_QUOTE_ROUTE } from '../../../helpers/constants/routes'
import { useNewMetricEvent } from '../../../hooks/useMetricEvent'
import { useSwapsEthToken } from '../../../hooks/useSwapsEthToken'
import Button from '../../../components/ui/button'
import Popover from '../../../components/ui/popover'

export default function IntroPopup({ onClose }) {
  const dispatch = useDispatch(useDispatch)
  const history = useHistory()
  const t = useContext(I18nContext)
  const enteredSwapsEvent = useNewMetricEvent({
    event: 'Swaps Opened',
    properties: { source: 'Intro popup', active_currency: 'ETH' },
    category: 'swaps',
  })
  const blogPostVisitedEvent = useNewMetricEvent({
    event: 'Blog Post Visited ',
    category: 'swaps',
  })
  const contractAuditVisitedEvent = useNewMetricEvent({
    event: 'Contract Audit Visited',
    category: 'swaps',
  })
  const productOverviewDismissedEvent = useNewMetricEvent({
    event: 'Product Overview Dismissed',
    category: 'swaps',
  })
  const swapsEthToken = useSwapsEthToken()

  return (
    <div className="intro-popup">
      <Popover
        className="intro-popup__popover"
        title={t('swapIntroPopupTitle')}
        subtitle={t('swapIntroPopupSubTitle')}
        onClose={() => {
          productOverviewDismissedEvent()
          onClose()
        }}
        footerClassName="intro-popup__footer"
        footer={
          <Button
            type="confirm"
            className="intro-popup__button"
            onClick={() => {
              onClose()
              enteredSwapsEvent()
              dispatch(setSwapsFromToken(swapsEthToken))
              history.push(BUILD_QUOTE_ROUTE)
            }}
          >
            {t('swapStartSwapping')}
          </Button>
        }
      >
        <div className="intro-popup__content">
          <div className="intro-popup__liquidity-sources-label">
            {t('swapIntroLiquiditySourcesLabel')}
          </div>
          <div className="intro-popup__source-logo-container">
            <img src="images/source-logos-all.svg" />
          </div>
          <div className="intro-popup__learn-more-header">
            {t('swapIntroLearnMoreHeader')}
          </div>
          <div
            className="intro-popup__learn-more-link"
            onClick={() => {
              global.platform.openTab({
                url:
                  'https://medium.com/metamask/introducing-metamask-swaps-84318c643785',
              })
              blogPostVisitedEvent()
            }}
          >
            {t('swapIntroLearnMoreLink')}
          </div>
          <div
            className="intro-popup__learn-more-link"
            onClick={() => {
              global.platform.openTab({
                url:
                  'https://diligence.consensys.net/audits/private/lsjipyllnw2/',
              })
              contractAuditVisitedEvent()
            }}
          >
            {t('swapLearnMoreContractsAuditReview')}
          </div>
        </div>
      </Popover>
    </div>
  )
}

IntroPopup.propTypes = {
  onClose: PropTypes.func.isRequired,
}
