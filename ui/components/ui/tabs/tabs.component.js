import React, { Component } from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';

export default class Tabs extends Component {
  static defaultProps = {
    defaultActiveTabKey: null,
    onTabClick: null,
    tabsClassName: undefined,
    subHeader: null,
  };

  static propTypes = {
    defaultActiveTabKey: PropTypes.string,
    onTabClick: PropTypes.func,
    children: PropTypes.node.isRequired,
    tabsClassName: PropTypes.string,
    subHeader: PropTypes.node,
  };

  state = {
    activeTabIndex: Math.max(
      this._findChildByKey(this.props.defaultActiveTabKey),
      0,
    ),
  };

  handleTabClick(tabIndex, tabKey) {
    const { onTabClick } = this.props;
    const { activeTabIndex } = this.state;

    if (tabIndex !== activeTabIndex) {
      this.setState(
        {
          activeTabIndex: tabIndex,
        },
        () => {
          if (onTabClick) {
            onTabClick(tabKey);
          }
        },
      );
    }
  }

  renderTabs() {
    const numberOfTabs = React.Children.count(this._getValidChildren());

    return React.Children.map(this._getValidChildren(), (child, index) => {
      const tabKey = child?.props.tabKey;
      return (
        child &&
        React.cloneElement(child, {
          onClick: (idx) => this.handleTabClick(idx, tabKey),
          tabIndex: index,
          isActive: numberOfTabs > 1 && index === this.state.activeTabIndex,
        })
      );
    });
  }

  renderActiveTabContent() {
    const children = this._getValidChildren();
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
    const { tabsClassName, subHeader } = this.props;
    return (
      <div className="tabs">
        <ul className={classnames('tabs__list', tabsClassName)}>
          {this.renderTabs()}
        </ul>
        {subHeader}
        <div className="tabs__content">{this.renderActiveTabContent()}</div>
      </div>
    );
  }

  /**
   * Returns the index of the child with the given key
   *
   * @param {string} tabKey - the name to search for
   * @returns {number} the index of the child with the given name
   * @private
   */
  _findChildByKey(tabKey) {
    return this._getValidChildren().findIndex(
      (c) => c?.props.tabKey === tabKey,
    );
  }

  // This ignores any 'null' child elements that are a result of a conditional
  // based on a feature flag setting.
  _getValidChildren() {
    return React.Children.toArray(this.props.children).filter(Boolean);
  }
}
