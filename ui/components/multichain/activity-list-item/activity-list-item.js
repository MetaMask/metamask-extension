import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'clsx';
import {
  Display,
  BlockSize,
  FontWeight,
  TextAlign,
  TextColor,
  TextVariant,
} from '../../../helpers/constants/design-system';
import {
  Box,
  BoxAlignItems,
  BoxBackgroundColor,
  BoxFlexDirection,
  BoxFlexWrap,
  BoxJustifyContent,
} from '@metamask/design-system-react';
import { Text } from '../../component-library';

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
      backgroundColor={BoxBackgroundColor.BackgroundDefault}
      className={`${primaryClassName} w-full`}
      onClick={onClick}
      onKeyPress={(event) => {
        if (event.key === 'Enter') {
          onClick();
        }
      }}
      data-testid={dataTestId}
      paddingHorizontal={4}
      paddingTop={3}
      paddingBottom={3}
      flexDirection={BoxFlexDirection.Row}
      flexWrap={BoxFlexWrap.Wrap}
      gap={4}
    >
      {topContent && (
        <Text
          variant={TextVariant.bodyMdMedium}
          color={TextColor.textDefault}
          display={Display.Flex}
          width={BlockSize.Full}
        >
          {topContent}
        </Text>
      )}
      <Box flexDirection={BoxFlexDirection.Row} gap={4} className="w-full">
        {icon && <Box className="inline-flex">{icon}</Box>}
        <Box
          justifyContent={BoxJustifyContent.Between}
          className="activity-list-item__content-container inline-flex w-full"
        >
          <Box
            flexDirection={BoxFlexDirection.Column}
            className="activity-list-item__detail-container inline-flex min-w-0"
          >
            <Box
              flexDirection={BoxFlexDirection.Row}
              alignItems={BoxAlignItems.Center}
            >
              <Text
                ellipsis
                textAlign={TextAlign.Left}
                variant={TextVariant.bodyMdMedium}
                fontWeight={FontWeight.Medium}
                data-testid="activity-list-item-action"
              >
                {title}
              </Text>
            </Box>
            {subtitle && (
              <Text
                as="div"
                ellipsis
                textAlign={TextAlign.Left}
                variant={TextVariant.bodySmMedium}
              >
                {subtitle}
              </Text>
            )}
            {children && (
              <Box className="activity-list-item__children">{children}</Box>
            )}
          </Box>

          {midContent && (
            <Box className="activity-list-item__mid-content inline-flex">
              {midContent}
            </Box>
          )}
          {rightContent && (
            <Box
              flexDirection={BoxFlexDirection.Column}
              alignItems={BoxAlignItems.End}
              className="activity-list-item__right-content inline-flex h-min"
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
  /**
   * Top content for the activity
   */
  topContent: PropTypes.node,
  /**
   * Icon which represents the activity
   */
  icon: PropTypes.node,
  /**
   * Title text
   */
  title: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
  /**
   * Additional text detail
   */
  subtitle: PropTypes.node,
  /**
   * Middle content
   */
  midContent: PropTypes.node,
  /**
   * Additional variable contents
   */
  children: PropTypes.node,
  /**
   * Right-most content
   */
  rightContent: PropTypes.node,
  /**
   * Executes upon click of the activity
   */
  onClick: PropTypes.func,
  /**
   * Additional classname for this component
   */
  className: PropTypes.string,
  /**
   * Test ID for this component
   */
  'data-testid': PropTypes.string,
};
