import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import {
  AlignItems,
  BackgroundColor,
  BlockSize,
  Display,
  FlexDirection,
  FlexWrap,
  FontWeight,
  TextAlign,
  TextColor,
  TextVariant,
} from '../../../helpers/constants/design-system';
import { Box, Text } from '../../component-library';

export const ActivityListItem = ({
  topContent,
  icon,
  title,
  subtitle,
  midContent,
  children,
  rightContent,
  onClick,
  className,
  'data-testid': dataTestId,
}) => {
  const primaryClassName = classnames('activity-list-item', className, {
    'activity-list-item--single-content-row': !(subtitle || children),
  });

  return (
    <Box
      tabIndex={0}
      backgroundColor={BackgroundColor.backgroundDefault}
      className={primaryClassName}
      onClick={onClick}
      onKeyPress={(event) => {
        if (event.key === 'Enter') {
          onClick();
        }
      }}
      data-testid={dataTestId}
      padding={4}
      display={Display.Flex}
      width={BlockSize.Full}
      flexWrap={FlexWrap.Wrap}
      gap={4}
    >
      {topContent && (
        <Text
          variant={TextVariant.bodyMd}
          color={TextColor.textDefault}
          display={Display.Flex}
          width={BlockSize.Full}
        >
          {topContent}
        </Text>
      )}
      <Box
        display={Display.Flex}
        width={BlockSize.Full}
        flexDirection={FlexDirection.Row}
        gap={4}
      >
        {icon && <Box display={Display.InlineFlex}>{icon}</Box>}
        <Box
          display={Display.InlineFlex}
          width={BlockSize.Full}
          className="activity-list-item__content-container"
        >
          <Box
            display={Display.InlineFlex}
            width={[BlockSize.OneThird, BlockSize.SevenTwelfths]}
            flexDirection={FlexDirection.Column}
            className="activity-list-item__detail-container"
          >
            <Text
              ellipsis
              textAlign={TextAlign.Left}
              variant={TextVariant.bodyLgMedium}
              fontWeight={FontWeight.Medium}
              data-testid="activity-list-item-action"
            >
              {title}
            </Text>
            {subtitle && (
              <Text
                as="div"
                ellipsis
                textAlign={TextAlign.Left}
                variant={TextVariant.bodyMd}
                fontWeight={FontWeight.Normal}
              >
                {subtitle}
              </Text>
            )}
            {children && (
              <Box className="activity-list-item__children">{children}</Box>
            )}
          </Box>

          {midContent && (
            <Box
              display={Display.InlineFlex}
              className="activity-list-item__mid-content"
            >
              {midContent}
            </Box>
          )}
          {rightContent && (
            <Box
              display={Display.InlineFlex}
              width={BlockSize.Full}
              height={BlockSize.Min}
              flexDirection={FlexDirection.Column}
              alignItems={AlignItems.flexEnd}
              className="activity-list-item__right-content"
            >
              {rightContent}
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  );
};

ActivityListItem.propTypes = {
  topContent: PropTypes.node,
  icon: PropTypes.node,
  title: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
  subtitle: PropTypes.node,
  midContent: PropTypes.node,
  children: PropTypes.node,
  rightContent: PropTypes.node,
  onClick: PropTypes.func,
  className: PropTypes.string,
  'data-testid': PropTypes.string,
};
