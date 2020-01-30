import React, { Component } from 'react'
const PropTypes = require('prop-types')
const classnames = require('classnames')

class TabBar extends Component {
  render () {
    const { tabs = [], onSelect, isActive } = this.props

    return (
      <div className="tab-bar">
        {tabs.map(({ key, content, description }) => (
          <div
            key={key}
            className={classnames('tab-bar__tab pointer', {
              'tab-bar__tab--active': isActive(key, content),
            })}
            onClick={() => onSelect(key)}
          >
            <div className="tab-bar__tab__content">
              <div className="tab-bar__tab__content__title">{content}</div>
              <div className="tab-bar__tab__content__description">{description}</div>
            </div>
            <div className="tab-bar__tab__caret" />
          </div>
        ))}
      </div>
    )
  }
}

TabBar.propTypes = {
  isActive: PropTypes.func.isRequired,
  tabs: PropTypes.array,
  onSelect: PropTypes.func,
}

module.exports = TabBar
