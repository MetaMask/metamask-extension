const Component = require('react').Component
const PropTypes = require('prop-types')
const h = require('react-hyperscript')
const inherits = require('util').inherits
const PluginWrapper = require('metamask-plugin-wrapper')
const PluginCell = require('./plugin-cell.js')
const connect = require('react-redux').connect
const selectors = require('../selectors')
const log = require('loglevel')
const { registerPluginContract } = require('../actions')


function mapDispatchToProps(dispatch) {
  return {
    registerPluginContract: contract => dispatch(registerPluginContract(contract)),
  }
}


function mapStateToProps (state) {
  return {
    network: state.metamask.network,
    plugins: state.metamask.plugins,
    userAddress: selectors.getSelectedAddress(state),
    assetImages: state.metamask.assetImages,
  }
}




class PluginList extends Component {
  static contextTypes = {
    t: PropTypes.func,
  }
  
  constructor (props) {
    super(props)
    this.state = {
      plugins: [],
      isLoading: true,
      network: null,
    }

  }

  render() {
    const { userAddress, assetImages } = this.props
    const state = this.state
    console.log("render list")
    const plugins = this.props.plugins
    console.log(plugins)

    if (!plugins) return this.message(this.context.t('No plugins'))
    
    return h('div', plugins.map((pluginData) => {
      console.log("plugin list element", pluginData)
      return h(PluginCell, pluginData)
    }))

  }

  message(body) {
    return h('div', {
      style: {
	display: 'flex',
	height: '250px',
	alignItems: 'center',
	justifyContent: 'center',
	padding: '30px',
      },
    }, body)
  }

  componentDidMount() {
    //this.props.plugins.map((plugin)=>this.createFreshPluginTracker(plugin.authorAddress))
  }

  createFreshPluginWrapper() {
    // if (this.tracker) {
    //   // Clean up old trackers when refreshing:
    //   this.tracker.stop()
    //   this.tracker.removeListener('update', this.balanceUpdater)
    //   this.tracker.removeListener('error', this.showError)
    // }

    if (!global.ethereumProvider) return
    const { userAddress, registerPluginContract } = this.props


    console.log("PLUGIN TRACKERS", this.props.plugins)
    
    this.tracker = new PluginWrapper({
      userAddress,
      provider: global.ethereumProvider,
      plugins: this.props.plugins,
      pollingInterval: 8000,
      networkId: this.props.network
    })

    // TODO ADAPT HERE
    console.log("REGISTER CALLED IN Plugin LIST", this.tracker.plugins)
    registerPluginContract(this.tracker.plugins.map( (plugin) => {
      return plugin.script
    }))



    // Set up listener instances for cleaning up
    this.balanceUpdater = this.updateBalances.bind(this)
    this.showError = (error) => {
      this.setState({ error, isLoading: false })
    }
    this.tracker.on('update', this.balanceUpdater)
    this.tracker.on('error', this.showError)

    this.tracker.updateBalances()
      .then(() => {
	this.updateBalances(this.tracker.serialize())
      })
      .catch((reason) => {
	log.error(`Problem updating balances`, reason)
	this.setState({ isLoading: false })
      })
	}

  componentDidUpdate(nextProps) {

    //   plugins,
    // } = this.props
    // const {
    //   network: newNet,
    //   userAddress: newAddress,
    //   name: newName,
    //   nodeUrl: newNodeUrl,
    //   plugins: newPlugins,
    // } = nextProps

    // const isLoading = newNet === 'loading'
    // const missingInfo = !oldNet || !newNet || !oldAddress || !newAddress
    // const sameUserAndNetwork = oldAddress === newAddress && oldNet === newNet
    // const shouldUpdateLayer2Apps = isLoading || missingInfo || sameUserAndNetwork

    // const oldLayer2AppsLength = layer2Apps ? layer2Apps.length : 0
    // const pluginAppsLengthUnchanged = oldPluginAppsLength === newPluginApps.length

    // if (pluginAppsLengthUnchanged && shouldUpdatePluginApps) return

    // this.setState({ isLoading: true })
    // this.createFreshPluginAppTracker()
  }

  updateBalances(plugins) {
    console.log("UPDATEBALANCES in plugin list", plugins)
    if (!this.tracker.running) {
      return
    }
    this.setState({ plugins, isLoading: false })
  }

  componentWillUnmount() {
    if (!this.tracker) return
    this.tracker.stop()
    this.tracker.removeListener('update', this.balanceUpdater)
    this.tracker.removeListener('error', this.showError)
  }

}


module.exports = connect(mapStateToProps, mapDispatchToProps)(PluginList)
