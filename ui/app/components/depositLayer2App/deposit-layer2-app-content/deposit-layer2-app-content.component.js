import React, { Component } from 'react'
import PropTypes from 'prop-types'
import PageContainerContent from '../../page-container/page-container-content.component'

import DepositLayer2AppFromRow from './deposit-layer2-app-from-row/'
import Button from '../../button'





export default class DepositLayer2AppContent extends Component {

  static propTypes = {
  };

  render () {
    console.log("DEBUG DEBUG DEBUG CONTENT: ", this.props)
    return (
      <PageContainerContent>
        <div className="send-v2__form">
          <DepositLayer2AppFromRow />
        </div>
        <div className="send-v2__form">
        {"to: "+this.props.selectedLayer2AppAddress}
        </div>
      </PageContainerContent>
    )
  }

}
