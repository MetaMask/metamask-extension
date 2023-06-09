import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import {
  BlockSize,
  BorderColor,
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
  const primaryClassName = classnames(
    'activity-list-item',
    className,
    subtitle || children ? '' : 'activity-list-item--single-content-row',
  );

  return (
    <Box
      as="button"
      className={primaryClassName}
      onClick={onClick}
      data-testid={dataTestId}
      tabIndex={0}
      onKeyPress={(event) => {
        if (event.key === 'Enter') {
          onClick();
        }
      }}
      display={Display.Flex}
      width={BlockSize.Full}
      borderColor={BorderColor.warningAlternative}
      flexWrap={FlexWrap.Wrap}
      gap={4}
    >
      {topContent ? (
        <Text
          variant={TextVariant.bodyMd}
          color={TextColor.textDefault}
          display={Display.Flex}
          width={BlockSize.Full}
        >
          {topContent}
        </Text>
      ) : null}
      <Box
        display={Display.Flex}
        width={BlockSize.Full}
        flexDirection={FlexDirection.Row}
        gap={4}
      >
        {icon ? <Box display={Display.InlineFlex}>{icon}</Box> : null}
        <Box
          display={Display.InlineFlex}
          width={BlockSize.Full}
          justifyContent={JustifyContent.spaceBetween}
        >
          <Box
            display={Display.InlineFlex}
            width={[BlockSize.FourTwelfths, BlockSize.SevenTwelfths]}
            flexDirection={FlexDirection.Column}
            className="activity-list-item__detail-container"
          >
            <Text
              ellipsis
              textAlign={TextAlign.Left}
              variant={TextVariant.bodyLgMedium}
              fontWeight={FontWeight.Medium}
            >
              {title}
            </Text>
            {subtitle ? (
              <Text
                ellipsis
                textAlign={TextAlign.Left}
                variant={TextVariant.bodyMd}
                fontWeight={FontWeight.Normal}
              >
                {subtitle}
              </Text>
            ) : null}
            {children ? (
              <Box className="activity-list-item__children" paddingTop={4}>
                {children}
              </Box>
            ) : null}
          </Box>

          {midContent ? (
            <Box
              display={Display.InlineFlex}
              className="activity-list-item__mid-content"
            >
              {midContent}
            </Box>
          ) : null}
          {rightContent ? (
            <Box className="activity-list-item__right-content">
              {rightContent}
            </Box>
          ) : null}
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
