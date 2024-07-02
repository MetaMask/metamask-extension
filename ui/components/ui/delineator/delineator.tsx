import React, { useState } from 'react';
import classnames from 'classnames';
import {
  BorderRadius,
  AlignItems,
  BackgroundColor,
  IconColor,
  Display,
  JustifyContent,
  FlexDirection,
} from '../../../helpers/constants/design-system';
import {
  AvatarIcon,
  Icon,
  Box,
  IconName,
  IconSize,
} from '../../component-library';
import Preloader from '../icon/preloader/preloader-icon.component';
import { DelineatorProps } from './delineator.types';
import { getIconPropsByType, overrideTextComponentColorByType } from './utils';

/**
 * Renders the icon on the right based on the loading state.
 *
 * @param options - Options bag
 * @param options.isLoading - Whether the delineator is in a loading state.
 * @param options.isExpanded - Whether the delineator is expanded.
 * @returns Either a loading spinner or an arrow icon.
 */
const ExpandableIcon = ({
  isLoading,
  isExpanded,
}: {
  isLoading: boolean;
  isExpanded: boolean;
}) => {
  if (isLoading) {
    return (
      <div role="progressbar">
        <Preloader size={16} />
      </div>
    );
  }
  return (
    <Icon
      name={isExpanded ? IconName.ArrowUp : IconName.ArrowDown}
      size={IconSize.Sm}
      color={IconColor.iconMuted}
    />
  );
};

export const Delineator: React.FC<DelineatorProps> = ({
  children,
  headerComponent,
  iconName,
  isCollapsable = true,
  isExpanded: isExpandedProp,
  isLoading = false,
  onExpandChange,
  type,
  wrapperBoxProps,
}) => {
  const [isExpanded, setIsExpanded] = useState(isExpandedProp || false);
  const iconProps = getIconPropsByType(type);
  const shouldShowContent = !isCollapsable || (isCollapsable && isExpanded);

  const onHeaderClick = () => {
    if (isLoading || !isCollapsable) {
      return;
    }
    const newExpandedState = !isExpanded;
    onExpandChange?.(newExpandedState);
    setIsExpanded(newExpandedState);
  };

  return (
    <Box
      className="delineator__wrapper"
      display={Display.Flex}
      flexDirection={FlexDirection.Column}
      backgroundColor={BackgroundColor.backgroundDefault}
      borderRadius={BorderRadius.LG}
      {...wrapperBoxProps}
    >
      <Box
        className={classnames({
          delineator__header: true,
          'delineator__header--expanded': isExpanded,
          'delineator__header--loading': isLoading,
        })}
        display={Display.Flex}
        alignItems={AlignItems.center}
        justifyContent={JustifyContent.spaceBetween}
        paddingTop={1}
        paddingRight={2}
        paddingBottom={1}
        paddingLeft={2}
        onClick={onHeaderClick}
      >
        <Box display={Display.Flex} alignItems={AlignItems.center}>
          <AvatarIcon iconName={iconName} {...iconProps} />
          {overrideTextComponentColorByType({
            component: headerComponent,
            type,
          })}
        </Box>
        {isCollapsable && (
          <ExpandableIcon isExpanded={isExpanded} isLoading={isLoading} />
        )}
      </Box>

      {shouldShowContent && !isLoading && (
        <Box padding={4} flexDirection={FlexDirection.Column}>
          {children}
        </Box>
      )}
    </Box>
  );
};
