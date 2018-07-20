const { Component } = require('react')
const PropTypes = require('prop-types')
const h = require('react-hyperscript')

class Alert extends Component {

    render () {
        const className = `.global-alert${this.props.visible ? '.visible' : '.hidden'}`
        return (
            h(`div${className}`, {},
              h('a.msg', {}, this.props.msg)
            )
        )
    }
}

Alert.propTypes = {
    visible: PropTypes.bool.isRequired,
    msg: PropTypes.string,
}
module.exports = Alert

