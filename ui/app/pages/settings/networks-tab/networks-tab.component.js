import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import { REVEAL_SEED_ROUTE } from '../../../helpers/constants/routes'
import Button from '../../../components/ui/button'

export default class SecurityTab extends PureComponent {
  static contextTypes = {
    t: PropTypes.func,
    metricsEvent: PropTypes.func,
  }

  static propTypes = {
  }

  renderSubHeader () {
    return (
      <div className="settings-page__sub-header">
        <span className="settings-page__sub-header-text">Networks</span>
      </div>
    )
  }

  renderContent () {
    const { warning } = this.props

    return (
      <div className="settings-page__body">
        {this.renderSubHeader()}
      </div>
    )
  }

  render () {
    return this.renderContent()
  }
}
