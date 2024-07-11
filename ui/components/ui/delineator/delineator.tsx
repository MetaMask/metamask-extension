import React, { useCallback, useState } from 'react';
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
import { DelineatorProps, DelineatorType } from './delineator.types';
import { getIconPropsByType, overrideTextComponentColorByType } from './utils';

const Loader = () => (
  <div role="progressbar">
    <Preloader size={16} />
  </div>
);

/**
 * Renders the icon on the right based on the loading state.
 *
 * @param options - Options bag
 * @param options.isExpanded - Whether the delineator is expanded.
 * @returns Either a loading spinner or an arrow icon.
 */
const ExpandableIcon = ({ isExpanded }: { isExpanded: boolean }) => {
  return (
    <Icon
      name={isExpanded ? IconName.ArrowUp : IconName.ArrowDown}
      size={IconSize.Sm}
      color={IconColor.iconMuted}
    />
  );
};

const Header = ({
  headerComponent,
  iconName,
  isCollapsible,
  isExpanded,
  isLoading,
  onHeaderClick,
  type,
}: {
  headerComponent: DelineatorProps['headerComponent'];
  iconName: IconName;
  isCollapsible: boolean;
  isExpanded: boolean;
  isLoading: boolean;
  onHeaderClick: () => void;
  type?: DelineatorType;
}) => {
  const iconProps = getIconPropsByType(type);
  return (
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
      {isCollapsible &&
        (isLoading ? <Loader /> : <ExpandableIcon isExpanded={isExpanded} />)}
    </Box>
  );
};
const Content = ({ children }: { children: React.ReactNode }) => {
  return (
    <Box padding={4} flexDirection={FlexDirection.Column}>
      {children}
    </Box>
  );
};

const Container = ({
  children,
  wrapperBoxProps,
}: {
  children: React.ReactNode;
  wrapperBoxProps: DelineatorProps['wrapperBoxProps'];
}) => {
  return (
    <Box
      className="delineator__wrapper"
      display={Display.Flex}
      flexDirection={FlexDirection.Column}
      backgroundColor={BackgroundColor.backgroundDefault}
      borderRadius={BorderRadius.LG}
      {...wrapperBoxProps}
    >
      {children}
    </Box>
  );
};

export const Delineator: React.FC<DelineatorProps> = ({
  children,
  headerComponent,
  iconName,
  isCollapsible = true,
  isExpanded: isExpandedProp,
  isLoading = false,
  onExpandChange,
  type,
  wrapperBoxProps,
}) => {
  const [isExpanded, setIsExpanded] = useState(isExpandedProp || false);
  const shouldShowContent = !isCollapsible || (isCollapsible && isExpanded);

  const handleHeaderClick = useCallback(() => {
    if (isLoading || !isCollapsible) {
      return;
    }
    const newExpandedState = !isExpanded;
    onExpandChange?.(newExpandedState);
    setIsExpanded(newExpandedState);
  }, [isLoading, isCollapsible, isExpanded, onExpandChange]);

  return (
    <Container wrapperBoxProps={wrapperBoxProps}>
      <Header
        headerComponent={headerComponent}
        iconName={iconName}
        isCollapsible={isCollapsible}
        isExpanded={isExpanded}
        isLoading={isLoading}
        onHeaderClick={handleHeaderClick}
        type={type}
      />
      {shouldShowContent && !isLoading && <Content>{children}</Content>}
    </Container>
  );
};
