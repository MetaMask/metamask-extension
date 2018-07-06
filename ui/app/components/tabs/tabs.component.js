import React, { Component } from 'react'
import PropTypes from 'prop-types'

export default class Tabs extends Component {
  static propTypes = {
    defaultActiveTabIndex: PropTypes.number,
    children: PropTypes.node,
  }

  constructor (props) {
    super(props)

    this.state = {
      activeTabIndex: props.defaultActiveTabIndex || 0,
    }
  }

  handleTabClick (tabIndex) {
    const { activeTabIndex } = this.state

    if (tabIndex !== activeTabIndex) {
      this.setState({
        activeTabIndex: tabIndex,
      })
    }
  }

  renderTabs () {
    const numberOfTabs = React.Children.count(this.props.children)

    return React.Children.map(this.props.children, (child, index) => {
      return child && React.cloneElement(child, {
        onClick: index => this.handleTabClick(index),
        tabIndex: index,
        isActive: numberOfTabs > 1 && index === this.state.activeTabIndex,
        key: index,
      })
    })
  }

  renderActiveTabContent () {
    const { children } = this.props
    const { activeTabIndex } = this.state

    return children[activeTabIndex]
      ? children[activeTabIndex].props.children
      : children.props.children
  }

  render () {
    return (
      <div className="tabs">
        <ul className="tabs__list">
          { this.renderTabs() }
        </ul>
        <div className="tabs__content">
          { this.renderActiveTabContent() }
        </div>
      </div>
    )
  }
}
