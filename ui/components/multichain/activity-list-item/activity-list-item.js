import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'clsx';
import {
  AlignItems,
  BackgroundColor,
  BlockSize,
  Display,
  FlexDirection,
  FlexWrap,
  FontWeight,
  JustifyContent,
  TextAlign,
  TextColor,
  TextVariant,
} from '../../../helpers/constants/design-system';
import { Box, Text } from '../../component-library';
import { StatusIcon } from '../../ui/icon/status-icon';

export const ActivityListItem = ({
  topContent,
  icon,
  title,
  titlePendingSpinner,
  subtitle,
  midContent,
  children,
  rightContent,
  onClick,
  className,
  activityListItemStatusKey,
  'data-testid': dataTestId,
}) => {
  const hasFooterActions = Boolean(children);
  const primaryClassName = classnames('activity-list-item', className);

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
      paddingInline={4}
      paddingTop={3}
      paddingBottom={3}
      display={Display.Flex}
      width={BlockSize.Full}
      flexWrap={FlexWrap.Wrap}
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
      <Box
        display={Display.Flex}
        width={BlockSize.Full}
        flexDirection={FlexDirection.Row}
        alignItems={hasFooterActions ? AlignItems.flexStart : AlignItems.center}
        gap={4}
      >
        {icon && (
          <Box
            display={Display.InlineFlex}
            marginTop={hasFooterActions ? 1 : 0}
          >
            {icon}
          </Box>
        )}
        <Box
          display={Display.InlineFlex}
          width={BlockSize.Full}
          justifyContent={JustifyContent.spaceBetween}
          className="activity-list-item__content-container"
        >
          <Box
            display={Display.InlineFlex}
            flexDirection={FlexDirection.Column}
            justifyContent={JustifyContent.center}
            className="activity-list-item__detail-container"
            minWidth="0"
            data-testid={`activity-list-item-status--${activityListItemStatusKey}`}
          >
            <Box
              display={Display.Flex}
              flexDirection={FlexDirection.Row}
              alignItems={AlignItems.center}
              gap={2}
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
              {titlePendingSpinner && (
                <StatusIcon state="loading" className="w-5 h-5" />
              )}
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
   * When true, shows the Rive loading spinner on the title row
   */
  titlePendingSpinner: PropTypes.bool,
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
   * Resolved transaction status key used for tests
   */
  activityListItemStatusKey: PropTypes.string,
  /**
   * Test ID for this component
   */
  'data-testid': PropTypes.string,
};
