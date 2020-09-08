import React, { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Switch, Route } from 'react-router-dom'
import { getSwapsFromToken, clearSwapsState } from '../../ducks/swaps/swaps'
import {
  BUILD_QUOTE_ROUTE,
  VIEW_QUOTE_ROUTE,
  SWAPS_ERROR_ROUTE,
  LOADING_QUOTES_ROUTE,
  AWAITING_SWAP_ROUTE,
} from '../../helpers/constants/routes'
import SwapsRouteContainer from './swaps-route-container'

export default function Swap () {
  const dispatch = useDispatch()

  const fromToken = useSelector(getSwapsFromToken)

  useEffect(() => {
    return () => {
      dispatch(clearSwapsState())
    }
  }, [dispatch])

  return (
    <div className="swaps">
      <SwapsRouteContainer>
        <Switch>
          <Route
            path={BUILD_QUOTE_ROUTE}
            exact
            render={() => (
              <div style={{ width: '100%', overflowWrap: 'break-word' }}>
              Build quote
                <span>{JSON.stringify(fromToken, null, 2)}</span>
              </div>
            )}
          />
          <Route
            path={VIEW_QUOTE_ROUTE}
            exact
            render={() => <div>View quote</div>}
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
      </SwapsRouteContainer>
    </div>
  )
}
