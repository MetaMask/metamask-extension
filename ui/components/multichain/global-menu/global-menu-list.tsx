import React, { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  TextVariant,
  FontWeight,
  BoxFlexDirection,
  BoxAlignItems,
  BoxJustifyContent,
  Icon,
  IconName,
  IconSize,
  IconColor,
} from '@metamask/design-system-react';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { MenuItem } from '../../ui/menu';
import { transitionForward } from '../../ui/transition';
import { preserveDrawerOpen } from '../global-menu-drawer/global-menu-drawer';
import { GlobalMenuListProps, isRouteItem } from './global-menu-list.types';

const getRouteState = (state?: object) => ({
  ...state,
  globalMenuTransition: 'forward',
});

/**
 * Renders menu item content with badge and chevron
 *
 * @param label
 * @param badge
 * @param showChevron
 */
const renderMenuItemContent = (
  label: string | ReactNode,
  badge?: ReactNode,
  showChevron?: boolean,
): ReactNode => {
  const hasBadge = Boolean(badge);
  const needsWrapper = hasBadge || showChevron;

  if (!needsWrapper) {
    return label;
  }

  return (
    <Box
      flexDirection={BoxFlexDirection.Row}
      alignItems={BoxAlignItems.Center}
      justifyContent={BoxJustifyContent.Between}
      className="w-full"
    >
      <Box className="flex-1 min-w-0">{label}</Box>
      <Box
        flexDirection={BoxFlexDirection.Row}
        alignItems={BoxAlignItems.Center}
        marginLeft={2}
        className="flex-shrink-0"
      >
        {hasBadge && badge}
        {showChevron && (
          <Icon
            name={IconName.ArrowRight}
            size={IconSize.Sm}
            color={IconColor.IconAlternative}
          />
        )}
      </Box>
    </Box>
  );
};

export const GlobalMenuList = ({
  sections,
  className = '',
}: GlobalMenuListProps) => {
  const navigate = useNavigate();
  const t = useI18nContext();

  return (
    <Box
      asChild
      className={`global-menu-list ${className}`}
      flexDirection={BoxFlexDirection.Column}
    >
      <nav aria-label={t('accountOptions')}>
        {sections.map((section, sectionIndex) => (
          <Box key={section.id} flexDirection={BoxFlexDirection.Column}>
            {sectionIndex > 0 && !section.hideDividerAbove && (
              <Box className="w-full px-2 py-2">
                <hr className="m-0 w-full border-0 border-t border-muted" />
              </Box>
            )}

            {/* Section Header */}
            {section.title && (
              <Box
                className="mx-4"
                paddingTop={sectionIndex > 0 ? 4 : 2}
                paddingBottom={2}
              >
                <h2 className="text-s-body-md leading-s-body-md tracking-s-body-md md:text-l-body-md md:leading-l-body-md md:tracking-l-body-md font-medium text-alternative">
                  {section.title}
                </h2>
              </Box>
            )}

            {/* Section Items */}
            {section.items.map((item) => {
              // Show chevron for route items or when explicitly requested (e.g. notifications)
              const showChevron =
                isRouteItem(item) || item.showChevron === true;
              const routeState = isRouteItem(item)
                ? getRouteState(item.state)
                : undefined;

              return (
                <MenuItem
                  key={item.id}
                  iconName={item.iconName}
                  iconSize={item.iconSize ?? IconSize.Lg}
                  iconColor={item.iconColor ?? IconColor.IconAlternative}
                  textVariant={TextVariant.BodyMd}
                  fontWeight={FontWeight.Medium}
                  textColor={item.textColor}
                  to={isRouteItem(item) ? item.to : undefined}
                  state={routeState}
                  onClick={(event) => {
                    if (!isRouteItem(item)) {
                      item.onClick();
                      return;
                    }

                    event.preventDefault();
                    item.onClick?.();
                    preserveDrawerOpen();
                    transitionForward(() =>
                      navigate(item.to, {
                        state: routeState,
                      }),
                    );
                  }}
                  disabled={item.disabled}
                  showInfoDot={item.showInfoDot}
                  subtitle={item.subtitle}
                  className={`first:rounded-t-none last:rounded-b-none ${
                    item.className ?? ''
                  }`}
                  data-testid={item.id}
                >
                  {renderMenuItemContent(item.label, item.badge, showChevron)}
                </MenuItem>
              );
            })}
          </Box>
        ))}
      </nav>
    </Box>
  );
};
