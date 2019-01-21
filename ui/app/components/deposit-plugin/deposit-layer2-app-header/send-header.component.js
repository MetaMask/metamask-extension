import React, { Component } from 'react'
import PropTypes from 'prop-types'
import PageContainerHeader from '../../page-container/page-container-header'
import { DEFAULT_ROUTE } from '../../../routes'

export default class SendHeader extends Component {

  static propTypes = {
    clearSend: PropTypes.func,
    history: PropTypes.object,
  };

  static contextTypes = {
    t: PropTypes.func,
  };

  onClose () {
    this.props.clearSend()
    this.props.history.push(DEFAULT_ROUTE)
  }

  render () {
    return (
      <PageContainerHeader
        onClose={() => this.onClose()}
        subtitle={this.context.t("depositLayer2AppSubtitle")}
        title={this.context.t("depositLayer2AppTitle")}
      />
    )
  }

}
