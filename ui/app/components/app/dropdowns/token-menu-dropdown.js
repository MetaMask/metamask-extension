import PropTypes from 'prop-types'
import React, { Component } from 'react'
import { connect } from 'react-redux'
import * as actions from '../../../store/actions'
import { createAccountLink as genAccountLink } from '@metamask/etherscan-link'
import { Menu, Item, CloseArea } from './components/menu'

class TokenMenuDropdown extends Component {
  static contextTypes = {
    t: PropTypes.func,
  }

  static propTypes = {
    onClose: PropTypes.func.isRequired,
    showHideTokenConfirmationModal: PropTypes.func.isRequired,
    token: PropTypes.object.isRequired,
    network: PropTypes.number.isRequired,
  }

  onClose = (e) => {
    e.stopPropagation()
    this.props.onClose()
  }

  render () {
    const { showHideTokenConfirmationModal } = this.props

    return (
      <Menu className="token-menu-dropdown" isShowing>
        <CloseArea onClick={this.onClose} />
        <Item
          onClick={(e) => {
            e.stopPropagation()
            showHideTokenConfirmationModal(this.props.token)
            this.props.onClose()
          }}
          text={this.context.t('hideToken')}
        />
        <Item
          onClick={(e) => {
            e.stopPropagation()
            const url = genAccountLink(this.props.token.address, this.props.network)
            global.platform.openWindow({ url })
            this.props.onClose()
          }}
          text={this.context.t('viewOnEtherscan')}
        />
      </Menu>
    )
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(TokenMenuDropdown)

function mapStateToProps (state) {
  return {
    network: state.metamask.network,
  }
}

function mapDispatchToProps (dispatch) {
  return {
    showHideTokenConfirmationModal: (token) => {
      dispatch(actions.showModal({ name: 'HIDE_TOKEN_CONFIRMATION', token }))
    },
  }
}
