import PropTypes from 'prop-types'
import React, { Component } from 'react'
import ConnectedSitesList from '../../components/app/connected-sites-list'
import {
  DEFAULT_ROUTE,
} from '../../helpers/constants/routes'
import Popover from '../../components/ui/popover/popover.component'

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
      <Popover title={this.context.t('connectedSites')} onClose={() => history.push(DEFAULT_ROUTE)}>
        <ConnectedSitesList />
      </Popover>
    )
  }
}
