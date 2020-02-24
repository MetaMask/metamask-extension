const { Component } = require('react')
const PropTypes = require('prop-types')
const h = require('react-hyperscript')

class Alert extends Component {

  constructor (props) {
    super(props)

    this.state = {
      visble: false,
      msg: false,
      className: '',
    }
  }

  UNSAFE_componentWillReceiveProps (nextProps) {
    if (!this.props.visible && nextProps.visible) {
      this.animateIn(nextProps.msg)
    } else if (this.props.visible && !nextProps.visible) {
      this.animateOut()
    }
  }

  animateIn (msg) {
    this.setState({
      msg: msg,
      visible: true,
      className: '.visible',
    })
  }

  animateOut () {
    this.setState({
      msg: null,
      className: '.hidden',
    })

    setTimeout((_) => {
      this.setState({ visible: false })
    }, 500)

  }

  render () {
    if (this.state.visible) {
      return (
        h(`div.global-alert${this.state.className}`, {},
          h('a.msg', {}, this.state.msg)
        )
      )
    }
    return null
  }
}

Alert.propTypes = {
  visible: PropTypes.bool.isRequired,
  msg: PropTypes.string, /* eslint-disable-line react/no-unused-prop-types */
}
export default Alert

