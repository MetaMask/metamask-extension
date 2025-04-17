import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import {
  BlockSize,
  Display,
  TextAlign,
  TextColor,
  TextVariant,
} from '../../../../helpers/constants/design-system';
import { Text, Box } from '../../../component-library';

const Tab = (props) => {
  const {
    buttonClassName,
    activeClassName,
    className,
    'data-testid': dataTestId,
    isActive,
    isSingleTab,
    name,
    onClick,
    tabIndex,
    tabKey,
    // Declared, but we are not rendering it explictly (it's mainly to make JSX
    // happy when being used in .tsx)
    // eslint-disable-next-line no-unused-vars
    children,
    textProps,
    disabled,
    ...rest
  } = props;

  return (
    <Box
      as="li"
      data-testid={dataTestId}
      onClick={(event) => {
        event.preventDefault();
        if (!disabled) {
          onClick(tabIndex);
        }
      }}
      key={tabKey}
      {...rest}
      className={classnames('tab', className, {
        'tab--single': isSingleTab,
        'tab--active': isActive,
        'tab--disabled': disabled,
        [activeClassName]: activeClassName && isActive,
        ...rest?.className,
      })}
    >
      <Text
        as="button"
        padding={2}
        textAlign={TextAlign.Center}
        display={Display.Block}
        width={BlockSize.Full}
        variant={TextVariant.bodyMd}
        color={TextColor.inherit}
        {...textProps}
        className={classnames(buttonClassName, textProps?.className)}
        disabled={disabled}
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
  isSingleTab: PropTypes.bool, // required, but added using React.cloneElement
  name: PropTypes.node.isRequired,
  tabKey: PropTypes.string.isRequired, // for Tabs selection purpose
  onClick: PropTypes.func,
  tabIndex: PropTypes.number, // required, but added using React.cloneElement
  children: PropTypes.node, // required, but we are not rendering it explicitly
  textProps: PropTypes.object, // props to spread to the Text component
  width: PropTypes.string,
  disabled: PropTypes.bool,
};

Tab.defaultProps = {
  activeClassName: undefined,
  buttonClassName: undefined,
  className: undefined,
  onClick: undefined,
  'data-testid': undefined,
};

export default Tab;
