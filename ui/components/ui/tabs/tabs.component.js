import React, { useState } from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import { Box } from '../../component-library';
import {
  BackgroundColor,
  Display,
  JustifyContent,
} from '../../../helpers/constants/design-system';

const Tabs = ({
  defaultActiveTabKey,
  onTabClick,
  children,
  tabsClassName = '',
  subHeader = null,
  tabListProps = {},
  tabContentProps = {},
  ...props
}) => {
  // This ignores any 'null' child elements that are a result of a conditional
  // based on a feature flag setting.
  const _getValidChildren = () => {
    return React.Children.toArray(children).filter(Boolean);
  };

  /**
   * Returns the index of the child with the given key
   *
   * @param {string} tabKey - the name to search for
   * @returns {number} the index of the child with the given name
   * @private
   */
  const _findChildByKey = (tabKey) => {
    return _getValidChildren().findIndex((c) => c?.props.tabKey === tabKey);
  };

  const [activeTabIndex, setActiveTabIndex] = useState(() =>
    Math.max(_findChildByKey(defaultActiveTabKey), 0),
  );

  const handleTabClick = (tabIndex, tabKey) => {
    if (tabIndex !== activeTabIndex) {
      setActiveTabIndex(tabIndex);
      onTabClick?.(tabKey);
    }
  };

  const renderTabs = () => {
    const numberOfTabs = React.Children.count(_getValidChildren());

    return React.Children.map(_getValidChildren(), (child, index) => {
      const tabKey = child?.props.tabKey;
      const isSingleTab = numberOfTabs === 1;
      return (
        child &&
        React.cloneElement(child, {
          onClick: (idx) => handleTabClick(idx, tabKey),
          tabIndex: index,
          isActive: numberOfTabs > 1 && index === activeTabIndex,
          isSingleTab,
        })
      );
    });
  };
  const renderActiveTabContent = () => {
    const validChildren = _getValidChildren();

    if (
      (Array.isArray(validChildren) && !validChildren[activeTabIndex]) ||
      (!Array.isArray(validChildren) && activeTabIndex !== 0)
    ) {
      throw new Error(`Tab at index '${activeTabIndex}' does not exist`);
    }

    return validChildren[activeTabIndex]
      ? validChildren[activeTabIndex].props.children
      : validChildren.props.children;
  };

  return (
    <Box className="tabs" {...props}>
      <Box
        as="ul"
        display={Display.Flex}
        justifyContent={JustifyContent.flexStart}
        backgroundColor={BackgroundColor.backgroundDefault}
        gap={0}
        {...tabListProps}
        className={classnames(
          'tabs__list',
          tabsClassName,
          tabListProps.className,
        )}
      >
        {renderTabs()}
      </Box>
      {subHeader}
      <Box
        {...tabContentProps}
        className={classnames('tabs__content', tabContentProps.className)}
      >
        {renderActiveTabContent()}
      </Box>
    </Box>
  );
};

export default Tabs;
Tabs.propTypes = {
  defaultActiveTabKey: PropTypes.string,
  onTabClick: PropTypes.func,
  children: PropTypes.node.isRequired,
  tabsClassName: PropTypes.string,
  subHeader: PropTypes.node,
  tabListProps: PropTypes.object,
  tabContentProps: PropTypes.object,
};
