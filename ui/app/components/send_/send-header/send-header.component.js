import React, { Component } from 'react'
import PropTypes from 'prop-types'
import PageContainerHeader from '../../page-container/page-container-header.component'

export default class SendHeader extends Component {

  static propTypes = {
    clearSend: PropTypes.func,
    goHome: PropTypes.func,
    isToken: PropTypes.bool,
  };

  render () {
    const { isToken, clearSend, goHome } = this.props

    return (
      <PageContainerHeader
        onClose={() => {
          clearSend()
          goHome()
        }}
        subtitle={this.context.t('onlySendToEtherAddress')}
        title={isToken ? this.context.t('sendTokens') : this.context.t('sendETH')}
      />
    )
  }

}

SendHeader.contextTypes = {
  t: PropTypes.func,
}
