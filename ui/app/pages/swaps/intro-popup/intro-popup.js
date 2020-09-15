import React, { useContext } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useHistory } from 'react-router-dom'
import PropTypes from 'prop-types'
import { getValueFromWeiHex } from '../../../helpers/utils/conversions.util'
import { setSwapsFromToken } from '../../../ducks/swaps/swaps'
import { ETH_SWAPS_TOKEN_OBJECT } from '../../../helpers/constants/swaps'
import { I18nContext } from '../../../contexts/i18n'
import { BUILD_QUOTE_ROUTE } from '../../../helpers/constants/routes'
import { useNewMetricEvent } from '../../../hooks/useMetricEvent'
import Button from '../../../components/ui/button'
import Popover from '../../../components/ui/popover'
import { getSelectedAccount } from '../../../selectors/selectors'

export default function IntroPopup ({ onClose }) {
  const dispatch = useDispatch(useDispatch)
  const history = useHistory()
  const t = useContext(I18nContext)
  const selectedAccount = useSelector(getSelectedAccount)
  const { balance } = selectedAccount
  const enteredSwapsEvent = useNewMetricEvent({ event: 'Swaps Opened', properties: { source: 'Intro popup', active_currency: 'ETH' }, category: 'swaps' })
  const blogPostVisitedEvent = useNewMetricEvent({ event: 'Blog Post Visited ', category: 'swaps' })
  const contractAuditVisitedEvent = useNewMetricEvent({ event: 'Contract Audit Visited', category: 'swaps' })
  const productOverviewDismissedEvent = useNewMetricEvent({ event: 'Product Overview Dismissed', category: 'swaps' })

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
        footer={(
          <Button
            type="confirm"
            className="intro-popup__button"
            onClick={() => {
              onClose()
              enteredSwapsEvent()
              dispatch(setSwapsFromToken({
                ...ETH_SWAPS_TOKEN_OBJECT,
                balance,
                string: getValueFromWeiHex({ value: balance, numberOfDecimals: 4, toDenomination: 'ETH' }),
              }))
              history.push(BUILD_QUOTE_ROUTE)
            }}
          >
            { t('swapStartSwapping') }
          </Button>
        )
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
              global.platform.openTab({ url: 'https://medium.com/metamask/introducing-metamask-swaps-84318c643785' })
              blogPostVisitedEvent()
            }}
          >
            {t('swapIntroLearnMoreLink')}
          </div>
          <div
            className="intro-popup__learn-more-link"
            onClick={() => {
              global.platform.openTab({ url: 'https://diligence.consensys.net/audits/private/lsjipyllnw2/' })
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
