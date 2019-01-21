import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import Media from 'react-media'
import MenuBar from '../menu-bar'
import Button from '../button'
const h = require('react-hyperscript')
import { DEPOSIT_PLUGIN_ROUTE } from '../../routes'

const BN = require('ethereumjs-util').BN

export default class Layer2AppView extends PureComponent {
  static contextTypes = {
    t: PropTypes.func,
    showDepositModal: PropTypes.func,
    history: PropTypes.object,
  }

  renderLayer2Buttons () {
    let elements = []
    const script = this.props.selectedLayer2AppScript

    for (var k = 0; k< script.layer2Interface.actions.length; k++){
      const index = k

      let paramValues = []      
      for (var i = 0; i< script.layer2Interface.actions[index].params.length; i++){
	const subIndex = i
	const param = script.layer2Interface.actions[index].params[subIndex]
	elements.push(h('input', {
	  key: "input"+index+subIndex,
	  className: 'customize-gas-input',
	  value: paramValues[subIndex],
	  placeholder: param.name,
	  type: param.type,
	  onChange: e => {
	    console.log("changed")
	    paramValues[subIndex] = e.target.value
	  },
	}))
	
      }

      elements.push(<Button
		   key={"button"+k}
		   type="primary"
		   className="layer2App-view__button"
		   onClick={() => {
		     console.log(script.layer2Interface)
		     script.layer2Interface.actions[index].call(paramValues)}
			   }
		   >
		   {script.layer2Interface.actions[index].name}
		    </Button>)

    }
    return elements
  }

  render () {
    const { t } = this.context
    const { history } = this.props

    //the deposit layer2app button should probably also be delegated to the script logic
    //for now it is in the depositLayer2 components
    const script = this.props.selectedLayer2AppScript
    if (!script) return (	<div>       </div>)
    let deposit
    let totalReceived
    let received    
    let paid
    console.log(script.layer2State.deposited)
    if (script.layer2State.deposited){
      deposit = new BN(script.layer2State.deposited, 16).toString(10)/1e18
    }
    else {
      deposit = 0
    }
    if (script.layer2State.totalReceived){
      totalReceived = new BN(script.layer2State.totalReceived, 16).toString(10)/1e18
    }
    else {
      totalReceived = 0
    }
    if (script.layer2State.received){
      received = script.layer2State.received
    }
    else {
      received = "No payments received yet"
    }
    if (script.layer2State.paid){
      paid = script.layer2State.paid
    }
    else {
      paid = "No payments made yet"
    }
    return (
	<div className="layer2App-view">
	<Button
      type="primary"
      className="layer2App-view__button"
      onClick={() => history.push(DEPOSIT_PLUGIN_ROUTE)}
        >
        {t("depositLayer2App") }
      </Button>
	{this.renderLayer2Buttons.bind(this)()}

      	<div>
	{"Deposit available: " + deposit + " eth"}
      </div>
      	<div>	
	{"Total value received: " + totalReceived + " eth"}
      </div>
      	<div>	
	{"Payments made: " + JSON.stringify(paid)}
      </div>
      	<div>	
	{"Payments received: " + JSON.stringify(received)}
      </div>
      </div>
    )
  }
}

// const { showDepositModal, history } = this.props
// onClick={() =>{showDepositModal()} }
