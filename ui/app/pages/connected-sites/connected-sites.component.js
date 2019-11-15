import PropTypes from 'prop-types'
import React, { Component } from 'react'
import ConnectedSitesList from '../../components/app/connected-sites-list'
import {
  DEFAULT_ROUTE,
} from '../../helpers/constants/routes'

export default class ConnectSites extends Component {
  static propTypes = {
    history: PropTypes.object.isRequired,
  }

  static contextTypes = {
    t: PropTypes.func,
  }

  render () {
    const {
      history,
    } = this.props
    return (
      <div className="connected-sites">
        <div className="connected-sites__header">
          <div className="connected-sites__title">
            { this.context.t('connectedSites') }
          </div>
          <div
            className="settings-page__close-button"
            onClick={() => history.push(DEFAULT_ROUTE)}
          />
        </div>
        <ConnectedSitesList />
      </div>
    )
  }
}
