import React, { Component } from 'react'
import PropTypes from 'prop-types'
import PageContainerContent from '../../page-container/page-container-content.component'
import { CONFIRM_TRANSACTION_ROUTE, DEFAULT_ROUTE } from '../../../routes'
import DepositLayer2AppFromRow from './deposit-layer2-app-from-row/'
import Button from '../../button'





export default class DepositLayer2AppContent extends Component {

  static propTypes = {
  };

  onSubmit () {
    const { history } = this.props
    const script = this.props.selectedLayer2AppScript
    const layer2SolutionContract = script.contract
    const tx = layer2SolutionContract.setup(0,{from: script.owner, value: 1e18, data:"0x"})
    history.push(CONFIRM_TRANSACTION_ROUTE)
  }

  render () {
    console.log("DEBUG DEBUG DEBUG CONTENT: ", this.props)
    const { t } = this.context

     return (
      <PageContainerContent>
        <div className="send-v2__form">
          <DepositLayer2AppFromRow />
        </div>
        <div className="send-v2__form">
        {"to: "+this.props.selectedLayer2AppAddress}
      </div>
	<Button
      type="primary"
      className="layer2App-view__button"
      onClick={() => {this.onSubmit()} }
        >
       Deposit in Layer2 Solution
      </Button>

      </PageContainerContent>
    )
  }

}
