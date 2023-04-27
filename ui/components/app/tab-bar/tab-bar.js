import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';

import { Icon, IconName, IconSize } from '../../component-library';

const TabBar = (props) => {
  const { tabs = [], onSelect, isActive } = props;

  return (
    <div className="tab-bar">
      {tabs.map(({ key, content, icon }) => (
        <button
          key={key}
          className={classnames('tab-bar__tab pointer', {
            'tab-bar__tab--active': isActive(key, content),
          })}
          onClick={() => onSelect(key)}
        >
          <div className="tab-bar__tab__content">
            <div className="tab-bar__tab__content__icon">{icon}</div>
            <div className="tab-bar__tab__content__title">{content}</div>
          </div>
          <Icon
            name={IconName.ArrowRight}
            size={IconSize.Sm}
            className="tab-bar__tab__caret"
          />
        </button>
      ))}
    </div>
  );
};

TabBar.propTypes = {
  isActive: PropTypes.func.isRequired,
  tabs: PropTypes.array,
  onSelect: PropTypes.func,
};

export default TabBar;
