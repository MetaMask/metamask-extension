const { Component } = require('react')
const PropTypes = require('prop-types')
const h = require('react-hyperscript')
const { connect } = require('react-redux')
const actions = require('../../actions')

class NotificationModal extends Component {
  render () {
    const {
      header,
      message,
    } = this.props

    return h('div', [
      h('div.notification-modal-wrapper', {
      }, [

        h('div.notification-modal-header', {}, [
          header,
        ]),

        h('div.notification-modal-message-wrapper', {}, [
          h('div.notification-modal-message', {}, [
            message,
          ]),
        ]),

        h('div.modal-close-x', {
          onClick: this.props.hideModal,
        }),

      ]),
    ])
  }
}

NotificationModal.propTypes = {
  hideModal: PropTypes.func,
  header: PropTypes.string,
  message: PropTypes.string,
}

const mapDispatchToProps = dispatch => {
  return {
    hideModal: () => {
      dispatch(actions.hideModal())
    },
  }
}

module.exports = connect(null, mapDispatchToProps)(NotificationModal)
