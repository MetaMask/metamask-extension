const { Component } = require('react')
const h = require('react-hyperscript')
const PropTypes = require('prop-types')
const connect = require('react-redux').connect
const NetworkDropdownIcon = require('./dropdowns/components/network-dropdown-icon')

const networkToColorHash = {
  1: '#038789',
  3: '#e91550',
  42: '#690496',
  4: '#ebb33f',
}

class NetworkDisplay extends Component {
  renderNetworkIcon () {
    const { network } = this.props
    const networkColor = networkToColorHash[network]

    return networkColor
      ? h(NetworkDropdownIcon, { backgroundColor: networkColor })
      : h('i.fa.fa-question-circle.fa-med', {
          style: {
            margin: '0 4px',
            color: 'rgb(125, 128, 130)',
          },
        })
  }

  render () {
    const { provider: { type } } = this.props
    return h('.network-display__container', [
      this.renderNetworkIcon(),
      h('.network-name', this.context.t(type)),
    ])
  }
}

NetworkDisplay.propTypes = {
  network: PropTypes.string,
  provider: PropTypes.object,
  t: PropTypes.func,
}

const mapStateToProps = ({ metamask: { network, provider } }) => {
  return {
    network,
    provider,
  }
}

NetworkDisplay.contextTypes = {
  t: PropTypes.func,
}

module.exports = connect(mapStateToProps)(NetworkDisplay)

