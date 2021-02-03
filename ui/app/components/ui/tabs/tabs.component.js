import React, { Component } from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';

export default class Tabs extends Component {
  static defaultProps = {
    defaultActiveTabName: null,
    onTabClick: null,
    tabsClassName: undefined,
  };

  static propTypes = {
    defaultActiveTabName: PropTypes.string,
    onTabClick: PropTypes.func,
    children: PropTypes.node.isRequired,
    tabsClassName: PropTypes.string,
  };

  state = {
    activeTabIndex: Math.max(
      this._findChildByName(this.props.defaultActiveTabName),
      0,
    ),
  };

  handleTabClick(tabIndex, tabName) {
    const { onTabClick } = this.props;
    const { activeTabIndex } = this.state;

    if (tabIndex !== activeTabIndex) {
      this.setState(
        {
          activeTabIndex: tabIndex,
        },
        () => {
          if (onTabClick) {
            onTabClick(tabName);
          }
        },
      );
    }
  }

  renderTabs() {
    const numberOfTabs = React.Children.count(this.props.children);

    return React.Children.map(this.props.children, (child, index) => {
      const tabName = child?.props.name;
      return (
        child &&
        React.cloneElement(child, {
          onClick: (idx) => this.handleTabClick(idx, tabName),
          tabIndex: index,
          isActive: numberOfTabs > 1 && index === this.state.activeTabIndex,
        })
      );
    });
  }

  renderActiveTabContent() {
    const { children } = this.props;
    const { activeTabIndex } = this.state;

    if (
      (Array.isArray(children) && !children[activeTabIndex]) ||
      (!Array.isArray(children) && activeTabIndex !== 0)
    ) {
      throw new Error(`Tab at index '${activeTabIndex}' does not exist`);
    }

    return children[activeTabIndex]
      ? children[activeTabIndex].props.children
      : children.props.children;
  }

  render() {
    const { tabsClassName } = this.props;
    return (
      <div className="tabs">
        <ul className={classnames('tabs__list', tabsClassName)}>
          {this.renderTabs()}
        </ul>
        <div className="tabs__content">{this.renderActiveTabContent()}</div>
      </div>
    );
  }

  /**
   * Returns the index of the child with the given name
   * @param {string} name - the name to search for
   * @returns {number} the index of the child with the given name
   * @private
   */
  _findChildByName(name) {
    return React.Children.toArray(this.props.children).findIndex(
      (c) => c?.props.name === name,
    );
  }
}
