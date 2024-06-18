import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import {
  BLOCK_SIZES,
  DISPLAY,
  TextAlign,
  TextColor,
  TextVariant,
} from '../../../../helpers/constants/design-system';
import Box from '../../box';
import { Text } from '../../../component-library';

const Tab = (props) => {
  const {
    buttonClassName,
    activeClassName,
    className,
    'data-testid': dataTestId,
    isActive,
    name,
    onClick,
    tabIndex,
    tabKey,
    // Declared, but we are not rendering it explictly (it's mainly to make JSX
    // happy when being used in .tsx)
    // eslint-disable-next-line no-unused-vars
    children,
  } = props;

  return (
    <Box
      as="li"
      className={classnames('tab', className, {
        'tab--active': isActive,
        [activeClassName]: activeClassName && isActive,
      })}
      data-testid={dataTestId}
      onClick={(event) => {
        event.preventDefault();
        onClick(tabIndex);
      }}
      key={tabKey}
    >
      <Text
        as="button"
        padding={2}
        textAlign={TextAlign.Center}
        display={DISPLAY.BLOCK}
        width={BLOCK_SIZES.FULL}
        className={buttonClassName}
        variant={TextVariant.bodyMd}
        color={TextColor.inherit}
      >
        {name}
      </Text>
    </Box>
  );
};

Tab.propTypes = {
  activeClassName: PropTypes.string,
  buttonClassName: PropTypes.string,
  className: PropTypes.string,
  'data-testid': PropTypes.string,
  isActive: PropTypes.bool, // required, but added using React.cloneElement
  name: PropTypes.node.isRequired,
  tabKey: PropTypes.string.isRequired, // for Tabs selection purpose
  onClick: PropTypes.func,
  tabIndex: PropTypes.number, // required, but added using React.cloneElement
  children: PropTypes.node, // required, but we are not rendering it explictly
};

Tab.defaultProps = {
  activeClassName: undefined,
  buttonClassName: undefined,
  className: undefined,
  onClick: undefined,
  'data-testid': undefined,
};

export default Tab;
