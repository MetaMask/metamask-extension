import React from 'react'
import { Switch, Route } from 'react-router-dom'
import {
  BUILD_QUOTE_ROUTE,
  VIEW_QUOTE_ROUTE,
} from '../../helpers/constants/routes'

export default function Swap () {
  return (
    <div className="token">
      <div className="token__content">
        <Switch>
          <Route
            path={BUILD_QUOTE_ROUTE}
            exact
            render={() => <div>Build quote</div>}
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
