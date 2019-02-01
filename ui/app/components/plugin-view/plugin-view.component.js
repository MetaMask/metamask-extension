import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import Media from 'react-media'
import MenuBar from '../menu-bar'
import Button from '../button'
const h = require('react-hyperscript')
import { DEPOSIT_PLUGIN_ROUTE } from '../../routes'

const BN = require('ethereumjs-util').BN

export default class PluginView extends PureComponent {
  static contextTypes = {
    t: PropTypes.func,
    showDepositModal: PropTypes.func,
    history: PropTypes.object,
  }

  renderPluginButtons () {
    if (!this.props.selectedPluginScript){ return }
    let elements = []
    const script = this.props.selectedPluginScript

    for (var k = 0; k< script.pluginInterface.actions.length; k++){
      const index = k

      let paramValues = []      
      for (var i = 0; i< script.pluginInterface.actions[index].params.length; i++){
	const subIndex = i
	const param = script.pluginInterface.actions[index].params[subIndex]
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
		   className="plugin-view__button"
		   onClick={() => {
		     console.log(script.pluginInterface)
		     script.pluginInterface.actions[index].call(paramValues)}
			   }
		   >
		   {script.pluginInterface.actions[index].name}
		    </Button>)

    }
    return elements
  }

  renderDelegatedUI(){
    if (this.props.selectedPluginScript){    
      return this.props.selectedPluginScript.renderUI.bind(this)()
    }
  }

  render () {
    console.log("PROPS in plugin view", this.props)
    if (this.props.selectedPluginScript){
      console.log(this.props.selectedPluginScript.pluginInterface)
    }
    return (
	<div>
	<div> ------------------------------------------------------------------------------   Plugin view  ---------------------------------------------------------------------------------  </div>
	<div>   {this.props.selectedPluginAddress}    </div>
	<div>   {this.props.selectedPluginScript.balance}    </div>	
	<div> { this.renderPluginButtons.bind(this)()} </div>
	<div> { this.renderDelegatedUI.bind(this)()} </div>	
	</div>	
    )    
  //   const { t } = this.context
  //   const { history } = this.props

  //   //the deposit plugin button should probably also be delegated to the script logic
  //   //for now it is in the depositPlugin components
  //   const script = this.props.selectedPluginScript
  //   if (!script) return (	<div>       </div>)
  //   let deposit
  //   let totalReceived
  //   let received    
  //   let paid
  //   console.log(script.pluginState.deposited)
  //   if (script.pluginState.deposited){
  //     deposit = new BN(script.pluginState.deposited, 16).toString(10)/1e18
  //   }
  //   else {
  //     deposit = 0
  //   }
  //   if (script.pluginState.totalReceived){
  //     totalReceived = new BN(script.pluginState.totalReceived, 16).toString(10)/1e18
  //   }
  //   else {
  //     totalReceived = 0
  //   }
  //   if (script.pluginState.received){
  //     received = script.pluginState.received
  //   }
  //   else {
  //     received = "No payments received yet"
  //   }
  //   if (script.pluginState.paid){
  //     paid = script.pluginState.paid
  //   }
  //   else {
  //     paid = "No payments made yet"
  //   }
  //   return (
  // 	<div className="pluginApp-view">
  // 	<Button
  //     type="primary"
  //     className="pluginApp-view__button"
  //     onClick={() => history.push(DEPOSIT_PLUGIN_ROUTE)}
  //       >
  //       {t("depositPluginApp") }
  //     </Button>
  // 	

  //     	<div>
  // 	{"Deposit available: " + deposit + " eth"}
  //     </div>
  //     	<div>	
  // 	{"Total value received: " + totalReceived + " eth"}
  //     </div>
  //     	<div>	
  // 	{"Payments made: " + JSON.stringify(paid)}
  //     </div>
  //     	<div>	
  // 	{"Payments received: " + JSON.stringify(received)}
  //     </div>
  //     </div>
  //   )
  }
}

// const { showDepositModal, history } = this.props
// onClick={() =>{showDepositModal()} }
