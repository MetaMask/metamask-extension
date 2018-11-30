import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import PersistentForm from '../../../lib/persistent-form'
import { numericBalance } from '../../util'
import SendProfile from './send-profile'
import SendHeader from './send-header'
import SendError from './send-multisig-error'
import Select from 'react-select'
import actions from '../../../../ui/app/actions'
import abiEncoder from 'web3-eth-abi'
import Web3 from 'web3'

class SenTransactionInput extends Component {
	static propTypes = {
		placeholder: PropTypes.string,
		value: PropTypes.string,
		onChange: PropTypes.func,
	}

	render () {
		return (
			<input
				type="text"
				className="input large-input"
				placeholder={this.props.placeholder}
				value={this.props.value}
				onChange={e => this.props.onChange(e)}
				style={{ marginTop: '5px' }}
			/>
			)
	}
}

class SendTransactionScreen extends PersistentForm {
	constructor (props) {
		super(props)
		this.state = {
			options: [],
			abi: [],
			methodSelected: '',
			methodABI: {},
			methodInputs: null,
			methodInputsView: null,
			methodOutput: null,
			isConstantMethod: false,
			inputValues: {},
			output: '',
		}
		PersistentForm.call(this)
	}

	componentWillMount () {
		this.getMultisigMethods()
	}

	render () {
		this.persistentFormParentId = 'send-multisig-tx-form'

		const props = this.props
		const {
			error,
		} = props
		return (
			<div className="send-screen flex-column flex-grow">
				<SendProfile />
				<SendHeader title="Execute Method" />
				<SendError
					error={error}
					onClose={() => {
						this.props.hideWarning()
					}}
				/>
				<div style={{ padding: '0 30px' }}>
				<Select
					clearable={false}
					value={this.state.methodSelected}
					options={this.state.options}
					style={{
						marginBottom: '10px',
					}}
					onChange={(opt) => {
						this.setState({
							methodSelected: opt.value,
							isConstantMethod: opt.metadata.constant,
							methodABI: opt.metadata,
							output: '',
						})
						this.generateMethodInputsView(opt.metadata)
					}}
				/>
				<div style={{ overflow: 'auto', maxHeight: this.state.isConstantMethod ? '130px' : '210px' }}>
					{this.state.methodInputsView}
				</div>
					{this.state.isConstantMethod && this.methodOutput()}
					{this.buttonsSection()}
				</div>
			</div>
			)
	}

	async getMultisigMethods () {
		const multisigProps = await this.props.getMultisig(this.props.address)
		const abi = multisigProps && multisigProps.abi
		const options = abi && abi.reduce((filtered, obj) => {
			if (obj.type === 'function') {
				filtered.push({ label: obj.name, value: obj.name, metadata: obj })
			}
			return filtered
		}, [])
		this.setState({
			options,
			abi,
		})
	}

	generateMethodInput (params, ind) {
		const label = (
			<h3
				key={`method_label_${ind}`}
				style={{
					marginTop: '10px',
				}}
			>
				{params.name || `Input ${ind + 1}`}
			</h3>
		)
		const inputKey = `method_input_${ind}`
		const input = (
			<SenTransactionInput
				key={inputKey}
				ind={ind}
				placeholder={params.type}
				value={this.state.inputValues[ind]}
				onChange={e => this.handleInputChange(e, ind)}
			/>
		)
		const inputObj = (
			<div key={`method_label_container_${ind}`}>
				{label}
				{input}
			</div>
		)
		return inputObj
	}

	handleInputChange (e, ind) {
		const { inputValues } = this.state
		inputValues[ind] = e.target.value
		this.setState({
			inputValues,
		})
	}

	generateMethodInputsView (metadata) {
		const methodInputsView = []
		const methodInputs = metadata && metadata.inputs
		methodInputs.forEach((input, ind) => {
			methodInputsView.push(this.generateMethodInput(input, ind))
		})
		this.setState({
			methodInputs: methodInputs,
			methodInputsView: methodInputsView,
		})
	}

	methodOutput () {
		const label = (
			<h2
				key="method_output_label"
				style={{
					marginTop: '10px',
				}}
				>
				Output
			</h2>
		)
		const output = (
			<textarea
				key="method_output_value"
				className="input large-input"
				disabled={true}
				value={this.state.output}
				style={{
					marginTop: '5px',
					width: '100%',
					height: '50px',
				}}
			/>
		)
		const outputObj = (
			<div>
				{label}
				{output}
			</div>
		)
		return outputObj
	}

	buttonsSection () {
		const callButton = (
			<button onClick={() => this.callData() }>Call data</button>
			)
		const nextButton = (
			<button onClick={() => this.onSubmit() }>Next</button>
			)
		let executeButton
		if (this.state.isConstantMethod) {
			executeButton = callButton
		} else {
			executeButton = nextButton
		}

		const buttonContainer = (
			<div
				className="section flex-row flex-right"
				style={{ margin: '20px 0' }}
			>
				{ executeButton }
			</div>
		)

		return buttonContainer
	}

	callData = () => {
		const { abi, methodSelected } = this.state
		const { address } = this.props
		const web3 = new Web3(global.ethereumProvider)
		const args = []
		try {
			web3.eth.contract(abi).at(address)[methodSelected].call(...args, (err, output) => {
				if (err) {
					return this.props.displayWarning(err)
				}
				if (output) {
					this.setState({
						output,
					})
				}
			})
		} catch (e) {
			return this.props.displayWarning(e)
		}
	}

	onSubmit = () => {
		const { inputValues, methodABI } = this.state
		const { address } = this.props
		const inputValuesArray = Object.keys(inputValues).map(key => inputValues[key])
		let txData
		try {
			txData = abiEncoder.encodeFunctionCall(methodABI, inputValuesArray)
		} catch (e) {
			return this.props.displayWarning(e)
		}
		console.log(txData)

		this.props.hideWarning()

		const txParams = {
			from: address,
			value: '0x',
			to: address,
		}

		this.props.signTx(txParams)
	}
}

function mapStateToProps (state) {
	const result = {
		address: state.metamask.selectedAddress,
		accounts: state.metamask.accounts,
		keyrings: state.metamask.keyrings,
		identities: state.metamask.identities,
		warning: state.appState.warning,
		network: state.metamask.network,
		addressBook: state.metamask.addressBook,
		conversionRate: state.metamask.conversionRate,
		currentCurrency: state.metamask.currentCurrency,
		provider: state.metamask.provider,
	}

	result.error = result.warning && result.warning.message

	result.account = result.accounts[result.address]
	result.identity = result.identities[result.address]
	result.balance = result.account ? numericBalance(result.account.balance) : null

	return result
}

function mapDispatchToProps (dispatch) {
	return {
		getMultisig: (addr) => dispatch(actions.getMultisig(addr)),
		displayWarning: (msg) => dispatch(actions.displayWarning(msg)),
		hideWarning: () => dispatch(actions.hideWarning()),
		signTx: (txParams) => dispatch(actions.signTx(txParams)),
	}
}

module.exports = connect(mapStateToProps, mapDispatchToProps)(SendTransactionScreen)
