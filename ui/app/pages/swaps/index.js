import React, { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Switch, Route } from 'react-router-dom'
import { getSwapsFromToken, clearSwapsState } from '../../ducks/swaps/swaps'
import {
  BUILD_QUOTE_ROUTE,
  VIEW_QUOTE_ROUTE,
} from '../../helpers/constants/routes'

export default function Swap () {
  const dispatch = useDispatch()

  const fromToken = useSelector(getSwapsFromToken)

  useEffect(() => {
    return () => {
      dispatch(clearSwapsState())
    }
  }, [dispatch])

  return (
    <div className="token">
      <div className="token__content">
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
        </Switch>
      </div>
    </div>
  )
}
