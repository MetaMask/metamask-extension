import React, { useEffect, useContext } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Switch, Route, useLocation, useHistory } from 'react-router-dom'
import { I18nContext } from '../../contexts/i18n'
import { getSwapsFromToken, clearSwapsState } from '../../ducks/swaps/swaps'
import {
  BUILD_QUOTE_ROUTE,
  VIEW_QUOTE_ROUTE,
  SWAPS_ERROR_ROUTE,
  LOADING_QUOTES_ROUTE,
  AWAITING_SWAP_ROUTE,
  DEFAULT_ROUTE,
} from '../../helpers/constants/routes'
import SwapsFooter from './swaps-footer'

export default function Swap () {
  const t = useContext(I18nContext)
  const history = useHistory()
  const dispatch = useDispatch()

  const { pathname } = useLocation()
  const isAwaitingSwapRoute = pathname === AWAITING_SWAP_ROUTE

  const fromToken = useSelector(getSwapsFromToken)

  useEffect(() => {
    return () => {
      dispatch(clearSwapsState())
    }
  }, [dispatch])

  const cancelAll = () => {
    dispatch(clearSwapsState())
    history.push(DEFAULT_ROUTE)
  }

  return (
    <div className="swaps">
      <div className="swaps__container">
        <div className="swaps__header">
          <div className="swaps__title">
            {t('swap')}
          </div>
          {!isAwaitingSwapRoute && (
            <div
              className="swaps__header-cancel"
              onClick={cancelAll}
            >
              { t('cancel') }
            </div>
          )}
        </div>
        <div className="swaps__content">
          <Switch>
            <Route
              path={BUILD_QUOTE_ROUTE}
              exact
              render={() => (
                <div style={{ display: 'flex', flexFlow: 'column', flex: 1, overflowWrap: 'break-word', width: '100%' }}>
                  <div style={{ display: 'flex', flex: 1 }}>
                    Build quote
                    <span>{JSON.stringify(fromToken, null, 2)}</span>
                  </div>
                  <SwapsFooter
                    onSubmit={() => console.log('submit clicked')}
                    submitText={t("swapGetQuotes")}
                    hideCancel
                  />
                </div>
              )}
            />
            <Route
              path={VIEW_QUOTE_ROUTE}
              exact
              render={() => (
                <div style={{ display: 'flex', flexFlow: 'column', flex: 1, overflowWrap: 'break-word', width: '100%' }}>
                  <div style={{ display: 'flex', flex: 1 }}>
                  Build quote
                    <span>{JSON.stringify(fromToken, null, 2)}</span>
                  </div>
                  <SwapsFooter
                    onSubmit={() => console.log('submit clicked')}
                    submitText={t("swap")}
                    onCancel={() => console.log('cancel clicked')}
                    disabled
                    showTermsOfService
                    showTopBorder
                  />
                </div>
              )}
            />
            <Route
              path={SWAPS_ERROR_ROUTE}
              exact
              render={() => <div>Error route</div>}
            />
            <Route
              path={LOADING_QUOTES_ROUTE}
              exact
              render={() => <div>Loading quotes route</div>}
            />
            <Route
              path={AWAITING_SWAP_ROUTE}
              exact
              render={() => <div>Awaiting swaps route</div>}
            />
          </Switch>
        </div>
      </div>
    </div>
  )
}
