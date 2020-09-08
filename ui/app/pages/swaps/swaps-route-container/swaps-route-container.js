import React, { useContext } from 'react'
import { useLocation, useHistory } from 'react-router-dom'

import { useDispatch } from 'react-redux'
import PropTypes from 'prop-types'
import classnames from 'classnames'
import { I18nContext } from '../../../contexts/i18n'
import { clearSwapsState } from '../../../ducks/swaps/swaps'
import {
  AWAITING_SWAP_ROUTE,
  BUILD_QUOTE_ROUTE,
  VIEW_QUOTE_ROUTE,
  LOADING_QUOTES_ROUTE,
  DEFAULT_ROUTE,
  SWAPS_ERROR_ROUTE,
} from '../../../helpers/constants/routes'
import { QUOTES_EXPIRED_ERROR } from '../../../helpers/constants/swaps'
import PageContainerFooter from '../../../components/ui/page-container/page-container-footer'

export default function SwapsActionFooter ({
  tradeConfirmed,
  tradeError,
  quotesError,
  destinationTokenSymbol,
  children,
}) {
  const t = useContext(I18nContext)
  const dispatch = useDispatch()
  const history = useHistory()

  const { pathname } = useLocation()
  const isBuildQuoteRoute = pathname === BUILD_QUOTE_ROUTE
  const isViewQuoteRoute = pathname === VIEW_QUOTE_ROUTE
  const isLoadingQuoteRoute = pathname === LOADING_QUOTES_ROUTE
  const isAwaitingSwapRoute = pathname === AWAITING_SWAP_ROUTE
  const isSwapsErrorRoute = pathname === SWAPS_ERROR_ROUTE

  let submitText = t('Done')
  if (isBuildQuoteRoute) {
    submitText = t('swapGetQuotes')
  }
  if (isSwapsErrorRoute && (tradeError || quotesError === QUOTES_EXPIRED_ERROR)) {
    submitText = t('tryAgain')
  }
  if (isLoadingQuoteRoute || isSwapsErrorRoute) {
    submitText = t('back')
  }
  if (isViewQuoteRoute) {
    submitText = t('swap')
  }
  if (isAwaitingSwapRoute && tradeConfirmed) {
    submitText = t('swapViewToken', [destinationTokenSymbol])
  }
  if (isAwaitingSwapRoute) {
    submitText = t('close')
  }

  const cancelAll = () => {
    dispatch(clearSwapsState())
    history.push(DEFAULT_ROUTE)
  }

  const isSingleButtonState = isAwaitingSwapRoute || isBuildQuoteRoute || isLoadingQuoteRoute || (isSwapsErrorRoute && quotesError !== QUOTES_EXPIRED_ERROR)

  return (
    <div className={classnames('swaps-route-container', { 'swaps-route-container--scrollable': isViewQuoteRoute })}>
      <div className="swaps-route-container__header">
        <div className="swaps-route-container__title">
          {t('swap')}
        </div>
        {!isAwaitingSwapRoute && (
          <div
            className="swaps-route-container__header-cancel"
            onClick={cancelAll}
          >
            { t('cancel') }
          </div>
        )}
      </div>
      <div className="swaps-route-container__content">
        { children }
      </div>
      <div className="swaps-route-container__footer">
        <div
          className={classnames('swaps-action-footer__buttons', {
            'swaps-action-footer__buttons--border': pathname === VIEW_QUOTE_ROUTE,
          })}
        >
          <PageContainerFooter
            onCancel={() => console.log('Cancel clicked!')}
            hideCancel={!isViewQuoteRoute}
            cancelText={t('back')}
            onSubmit={() => console.log('Submit clicked!')}
            submitText={submitText}
            submitButtonType="confirm"
            footerClassName="swaps-route-container____custom-page-container-footer-class"
            footerButtonClassName={classnames('swaps-route-container__custom-page-container-footer-button-class', {
              'swaps-route-container__custom-page-container-footer-button-class--single': isSingleButtonState,
            })}
          />
        </div>
        {(isViewQuoteRoute) && (
          <div
            className="swaps-action-footer__bottom-text"
            onClick={() => global.platform.openTab({ url: 'https://metamask.io/terms.html' })}
          >
            {t('termsOfService')}
          </div>
        )}
      </div>
    </div>
  )
}

SwapsActionFooter.propTypes = {
  tradeConfirmed: PropTypes.bool,
  tradeError: PropTypes.bool,
  quotesError: PropTypes.string,
  destinationTokenSymbol: PropTypes.string,
  children: PropTypes.any.isRequired,
}
