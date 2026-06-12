import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'clsx';

import { Box } from '@metamask/design-system-react';
import { Icon, IconName, IconSize } from '../../component-library';
import { BorderRadius, Color } from '../../../helpers/constants/design-system';

const TabBar = (props) => {
  const { tabs = [], onSelect, isActive } = props;

  return (
    <div className="tab-bar">
      {tabs.map(({ key, content, icon }) => (
        <Box
          asChild
          key={key}
          paddingTop={5}
          paddingBottom={5}
          paddingLeft={4}
          paddingRight={4}
        >
          <button
            type="button"
            className={classnames('tab-bar__tab pointer', {
              'tab-bar__tab--active': isActive(key, content),
            })}
            onClick={() => onSelect(key)}
          >
            {isActive(key, content) && (
              <Box
                className="tab-bar__tab__selected-indicator hidden sm:block"
                borderRadius={BorderRadius.pill}
                backgroundColor={Color.primaryDefault}
              />
            )}
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
        </Box>
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
