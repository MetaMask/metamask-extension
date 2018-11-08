const Component = require('react').Component
const PropTypes = require('prop-types')
const h = require('react-hyperscript')
const inherits = require('util').inherits
const Layer2AppTracker = require('eth-layer2App-tracker')
const Layer2AppCell = require('./layer2App-cell.js')
const connect = require('react-redux').connect
const selectors = require('../selectors')
const log = require('loglevel')
const { registerLayer2AppContract } = require('../actions')


function mapDispatchToProps(dispatch) {
  return {
    registerLayer2AppContract: contract => dispatch(registerLayer2AppContract(contract)),
  }
}


function mapStateToProps (state) {
  console.log(state)
  return {
    network: state.metamask.network,
    layer2Apps: state.metamask.layer2Apps,
    userAddress: selectors.getSelectedAddress(state),
    assetImages: state.metamask.assetImages,
  }
}




class Layer2AppList extends Component {
  static contextTypes = {
    t: PropTypes.func,
  }
  
  constructor (props) {
    super(props)
    this.state = {
      layer2Apps: [],
      isLoading: true,
      network: null,
    }

  }

  render() {
    const { userAddress, assetImages } = this.props
    const state = this.state


    const { layer2Apps, isLoading, error } = state
    
    if (isLoading) {
      return this.message(this.context.t('loadingLayer2Apps'))
    }
    
    if (error) {
      log.error(error)
      return h('.hotFix', {
	style: {
          padding: '80px',
	},
      }, [
	this.context.t('troubleLayer2AppBalances'),
	h('span.hotFix', {
          style: {
            color: 'rgba(247, 134, 28, 1)',
            cursor: 'pointer',
          },
          onClick: () => {
            global.platform.openWindow({
              url: `https://ethplorer.io/address/${userAddress}`,
            })
          },
	}, this.context.t('here')),
      ])
    }

    return h('div', layer2Apps.map((layer2AppData) => {
      console.log(layer2AppData)
      layer2AppData.image = assetImages[layer2AppData.address]
      return h(Layer2AppCell, layer2AppData)
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
    this.createFreshLayer2AppTracker()
  }

  createFreshLayer2AppTracker() {
    if (this.tracker) {
      // Clean up old trackers when refreshing:
      this.tracker.stop()
      this.tracker.removeListener('update', this.balanceUpdater)
      this.tracker.removeListener('error', this.showError)
    }

    if (!global.ethereumProvider) return
    const { userAddress, registerLayer2AppContract } = this.props


    this.tracker = new Layer2AppTracker({
      userAddress,
      provider: global.ethereumProvider,
      layer2Apps: this.props.layer2Apps,
      pollingInterval: 8000,
    })

    // TODO ADAPT HERE
    console.log("REGISTER CALLED IN LAYER2APP LIST", this.tracker.layer2Apps)
    registerLayer2AppContract(this.tracker.layer2Apps.map( (layer2App) => {
      return layer2App.script
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
    const {
      network: oldNet,
      userAddress: oldAddress,
      name,
      layer2Apps,
    } = this.props
    const {
      network: newNet,
      userAddress: newAddress,
      name,
      layer2Apps: newLayer2Apps,
    } = nextProps

    const isLoading = newNet === 'loading'
    const missingInfo = !oldNet || !newNet || !oldAddress || !newAddress
    const sameUserAndNetwork = oldAddress === newAddress && oldNet === newNet
    const shouldUpdateLayer2Apps = isLoading || missingInfo || sameUserAndNetwork

    const oldLayer2AppsLength = layer2Apps ? layer2Apps.length : 0
    const layer2AppsLengthUnchanged = oldLayer2AppsLength === newLayer2Apps.length

    if (layer2AppsLengthUnchanged && shouldUpdateLayer2Apps) return

    this.setState({ isLoading: true })
    this.createFreshLayer2AppTracker()
  }

  updateBalances(layer2Apps) {
    console.log("UPDATEBALANCES in l2a list", layer2Apps)
    if (!this.tracker.running) {
      return
    }
    this.setState({ layer2Apps, isLoading: false })
  }

  componentWillUnmount() {
    if (!this.tracker) return
    this.tracker.stop()
    this.tracker.removeListener('update', this.balanceUpdater)
    this.tracker.removeListener('error', this.showError)
  }

}


module.exports = connect(mapStateToProps, mapDispatchToProps)(Layer2AppList)
