import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import { Text } from '../../component-library';
import Box from '../box/box';
import {
  BackgroundColor,
  BlockSize,
  Display,
  FlexDirection,
  FlexWrap,
  JustifyContent,
  TextColor,
} from '../../../helpers/constants/design-system';

export default function ListItem({
  topContent,
  title,
  subtitle,
  onClick,
  children,
  titleIcon,
  icon,
  rightContent,
  midContent,
  className,
  'data-testid': dataTestId,
}) {
  const primaryClassName = classnames(
    'list-item',
    className,
    subtitle || children ? '' : 'list-item--single-content-row',
  );

  return (
    <Box
      width={BlockSize.Full}
      margin={0}
      padding={4}
      backgroundColor={BackgroundColor.backgroundDefault}
      color={TextColor.textDefault}
      className={primaryClassName}
      display={Display.Flex}
      flexDirection={FlexDirection.Row}
      flexWrap={FlexWrap.Wrap}
      gap={4}
      onClick={onClick}
      data-testid={dataTestId}
      role="button"
      tabIndex={0}
      onKeyPress={(event) => {
        if (event.key === 'Enter') {
          onClick();
        }
      }}
    >
      {topContent ? (
        <Box className="list-item__top-content">{topContent}</Box>
      ) : null}
      <Box
        width={BlockSize.Full}
        display={Display.Flex}
        flexDirection={FlexDirection.Row}
        gap={4}
      >
        {icon ? (
          <Box
            width={BlockSize.Max}
            display={Display.InlineFlex}
            className="list-item__icon"
          >
            {icon}
          </Box>
        ) : null}
        <Box
          width={BlockSize.Full}
          display={Display.Flex}
          flexDirection={FlexDirection.Column}
          justifyContent={JustifyContent.spaceBetween}
        >
          <Box className="list-item__heading">
            {React.isValidElement(title) ? (
              title
            ) : (
              <Text ellipsis width={BlockSize.Full}>
                {title}
              </Text>
            )}
            {titleIcon && (
              <Box className="list-item__heading-wrap">{titleIcon}</Box>
            )}
          </Box>
          {subtitle ? (
            <Box className="list-item__subheading">{subtitle}</Box>
          ) : null}

          {children ? (
            <Box className="list-item__actions">{children}</Box>
          ) : null}
        </Box>

        {midContent ? (
          <Box className="list-item__mid-content">{midContent}</Box>
        ) : null}
        {rightContent ? (
          <Box className="list-item__right-content">{rightContent}</Box>
        ) : null}
      </Box>
    </Box>
  );
}

ListItem.propTypes = {
  topContent: PropTypes.node,
  title: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
  titleIcon: PropTypes.node,
  subtitle: PropTypes.node,
  children: PropTypes.node,
  icon: PropTypes.node,
  rightContent: PropTypes.node,
  midContent: PropTypes.node,
  className: PropTypes.string,
  onClick: PropTypes.func,
  'data-testid': PropTypes.string,
};
