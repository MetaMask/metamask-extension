import React, { createContext, useState } from 'react';
import Tooltip from '../../../../ui/tooltip/tooltip';
import {
  Box,
  ButtonIcon,
  ButtonIconSize,
  Icon,
  IconName,
  IconSize,
  Text,
} from '../../../../component-library';
import {
  AlignItems,
  BackgroundColor,
  BorderRadius,
  Color,
  Display,
  FlexDirection,
  FlexWrap,
  IconColor,
  JustifyContent,
  OverflowWrap,
  TextColor,
  TextVariant,
} from '../../../../../helpers/constants/design-system';
import { SizeNumber } from '../../../../ui/box/box';
import { CopyIcon } from './copy-icon';

export enum ConfirmInfoRowVariant {
  Default = 'default',
  Critical = 'critical',
  Warning = 'warning',
}

export type ConfirmInfoRowProps = {
  children?: React.ReactNode | string;
  collapsed?: boolean;
  color?: TextColor;
  copyEnabled?: boolean;
  copyText?: string;
  'data-testid'?: string;
  label: string;
  labelChildren?: React.ReactNode;
  onClick?: () => void;
  style?: React.CSSProperties;
  tooltip?: string;
  tooltipIcon?: IconName;
  tooltipIconColor?: IconColor;
  variant?: ConfirmInfoRowVariant;
};

const BACKGROUND_COLORS = {
  [ConfirmInfoRowVariant.Default]: undefined,
  [ConfirmInfoRowVariant.Critical]: BackgroundColor.errorMuted,
  [ConfirmInfoRowVariant.Warning]: BackgroundColor.warningMuted,
};

const TEXT_COLORS = {
  [ConfirmInfoRowVariant.Default]: TextColor.textDefault,
  [ConfirmInfoRowVariant.Critical]: Color.errorAlternative,
  [ConfirmInfoRowVariant.Warning]: Color.warningDefault,
};

const TOOLTIP_ICONS = {
  [ConfirmInfoRowVariant.Default]: IconName.Question,
  [ConfirmInfoRowVariant.Critical]: IconName.Warning,
  [ConfirmInfoRowVariant.Warning]: IconName.Warning,
};

const TOOLTIP_ICON_COLORS = {
  [ConfirmInfoRowVariant.Default]: Color.iconMuted,
  [ConfirmInfoRowVariant.Critical]: Color.errorAlternative,
  [ConfirmInfoRowVariant.Warning]: Color.warningDefault,
};

export const ConfirmInfoRowContext = createContext({
  variant: ConfirmInfoRowVariant.Default,
});

export const ConfirmInfoRow: React.FC<ConfirmInfoRowProps> = ({
  label,
  children,
  variant = ConfirmInfoRowVariant.Default,
  tooltip,
  style,
  labelChildren,
  color,
  copyEnabled = false,
  copyText,
  'data-testid': dataTestId,
  collapsed,
  tooltipIcon,
  tooltipIconColor,
  onClick,
}) => {
  const [expanded, setExpanded] = useState(!collapsed);

  const isCollapsible = collapsed !== undefined;

  const contentPaddingRight = ((copyEnabled ? 6 : 0) +
    (isCollapsible ? 6 : 0)) as SizeNumber;

  return (
    <ConfirmInfoRowContext.Provider value={{ variant }}>
      <Box
        data-testid={dataTestId}
        className="confirm-info-row"
        display={Display.Flex}
        flexDirection={isCollapsible ? FlexDirection.Column : FlexDirection.Row}
        justifyContent={JustifyContent.spaceBetween}
        flexWrap={FlexWrap.Wrap}
        alignItems={AlignItems.flexStart}
        backgroundColor={BACKGROUND_COLORS[variant]}
        borderRadius={BorderRadius.LG}
        marginTop={2}
        marginBottom={2}
        paddingLeft={2}
        paddingRight={2}
        color={TEXT_COLORS[variant] as TextColor}
        style={{
          overflowWrap: OverflowWrap.Anywhere,
          minHeight: '24px',
          position: 'relative',
          cursor: onClick ? 'pointer' : 'default',
          ...style,
        }}
        onClick={onClick}
      >
        {copyEnabled && (
          <CopyIcon
            copyText={copyText ?? ''}
            style={{ right: isCollapsible ? 32 : 4 }}
            color={IconColor.iconMuted}
          />
        )}
        {isCollapsible && (
          <ButtonIcon
            color={IconColor.iconMuted}
            iconName={expanded ? IconName.Collapse : IconName.Expand}
            size={ButtonIconSize.Sm}
            style={{
              cursor: 'pointer',
              position: 'absolute',
              right: 8,
            }}
            onClick={() => setExpanded(!expanded)}
            data-testid="sectionCollapseButton"
            ariaLabel="collapse-button"
          />
        )}
        <Box
          display={Display.Flex}
          flexDirection={FlexDirection.Row}
          justifyContent={JustifyContent.center}
          alignItems={AlignItems.flexStart}
          color={color}
          paddingRight={contentPaddingRight || null}
        >
          <Box display={Display.Flex} alignItems={AlignItems.center}>
            <Text variant={TextVariant.bodyMdMedium} color={TextColor.inherit}>
              {label}
            </Text>
            {labelChildren}
            {!labelChildren && tooltip?.length && (
              <Tooltip
                position="bottom"
                title={tooltip}
                style={{ display: 'flex' }}
              >
                <Icon
                  name={tooltipIcon ?? TOOLTIP_ICONS[variant]}
                  marginLeft={1}
                  color={
                    tooltipIconColor ??
                    (TOOLTIP_ICON_COLORS[variant] as unknown as IconColor)
                  }
                  size={IconSize.Sm}
                  {...(dataTestId
                    ? { 'data-testid': `${dataTestId}-tooltip` }
                    : {})}
                />
              </Tooltip>
            )}
          </Box>
        </Box>
        {expanded &&
          children &&
          (typeof children === 'string' ? (
            <Text marginRight={copyEnabled ? 3 : 0} color={TextColor.inherit}>
              {children}
            </Text>
          ) : (
            children
          ))}
      </Box>
    </ConfirmInfoRowContext.Provider>
  );
};
