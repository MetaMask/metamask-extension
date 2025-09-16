import React from 'react';
import classnames from 'classnames';
import {
  BlockSize,
  Display,
  TextAlign,
  TextColor,
  TextVariant,
} from '../../../../helpers/constants/design-system';
import { Text, Box } from '../../../component-library';
import { TabProps } from '../tabs.types';

const Tab: React.FC<TabProps> = ({
  buttonClassName,
  activeClassName,
  className,
  'data-testid': dataTestId,
  isActive = false,
  isSingleTab = false,
  name,
  onClick,
  tabIndex = 0,
  tabKey,
  // Declared, but we are not rendering it explicitly (it's mainly to make JSX
  // happy when being used in .tsx)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  children,
  textProps,
  disabled = false,
  ...rest
}) => {
  const handleClick = (event: React.MouseEvent<HTMLLIElement>) => {
    event.preventDefault();
    if (!disabled && onClick) {
      onClick(tabIndex);
    }
  };

  return (
    <Box
      as="li"
      data-testid={dataTestId}
      onClick={handleClick}
      key={tabKey}
      {...rest}
      className={classnames(
        'tab',
        className || '',
        {
          'tab--single': isSingleTab,
          'tab--active': isActive,
          'tab--disabled': disabled,
          ...(activeClassName && isActive && { [activeClassName]: true }),
        },
      )}
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
        className={classnames(buttonClassName || '', textProps?.className || '')}
        disabled={disabled}
      >
        {name}
      </Text>
    </Box>
  );
};

export default Tab;