import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { Dropdown, DropdownMenuItem } from '../dropdown'
import actions from '../../../../ui/app/actions'
import { connect } from 'react-redux'

class MainMenu extends Component {
  static propTypes = {
    showConfigPage: PropTypes.func.isRequired,
    lockMetamask: PropTypes.func.isRequired,
    showInfoPage: PropTypes.func.isRequired,
    changeState: PropTypes.func.isRequired,
    openMainMenu: PropTypes.func.isRequired,
    isMainMenuOpen: PropTypes.bool,
  }

  render () {
    const isOpen = this.props.isMainMenuOpen
    const isMainMenuOpen = !isOpen

    return (
      <Dropdown
        useCssTransition={true}
        isOpen={isOpen}
        zIndex={11}
        constOverflow={true}
        onClickOutside={(event) => {
          const classList = event.target.classList
          const parentClassList = event.target.parentElement.classList

          const isToggleElement = classList.contains('sandwich-expando') ||
            parentClassList.contains('sandwich-expando')

          if (isOpen && !isToggleElement) {
            this.props.openMainMenu()
          }
        }}
        style={{
          position: 'absolute',
          right: '2px',
          top: '38px',
          width: '126px',
          maxHeight: isOpen ? '186px' : '0px',
          overflow: 'hidden',
        }}
      >
        <DropdownMenuItem
          closeMenu={() => this.props.changeState(isMainMenuOpen)}
          onClick={() => { this.props.showConfigPage() }}
        >Settings</DropdownMenuItem>

        <DropdownMenuItem
          closeMenu={() => this.props.changeState(isMainMenuOpen)}
          onClick={() => { this.props.lockMetamask() }}
        >Log Out</DropdownMenuItem>

        <DropdownMenuItem
          closeMenu={() => this.props.changeState(isMainMenuOpen)}
          onClick={() => { this.props.showInfoPage() }}
        >Info/Help</DropdownMenuItem>
      </Dropdown>
    )
  }
}

const mapDispatchToProps = dispatch => {
  return {
    showConfigPage: () => dispatch(actions.showConfigPage()),
    lockMetamask: () => dispatch(actions.lockMetamask()),
    showInfoPage: () => dispatch(actions.showInfoPage()),
  }
}

export default connect(null, mapDispatchToProps)(MainMenu)
