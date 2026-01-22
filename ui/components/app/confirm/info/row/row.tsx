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
import { Skeleton } from '../../../../component-library/skeleton';
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

export enum ConfirmInfoRowSize {
  Default = 'default',
  Small = 'small',
}

export type ConfirmInfoRowProps = {
  children?: React.ReactNode | string;
  collapsed?: boolean;
  color?: TextColor;
  copyEnabled?: boolean;
  copyText?: string;
  'data-testid'?: string;
  label?: string;
  labelChildren?: React.ReactNode;
  onClick?: () => void;
  rowVariant?: ConfirmInfoRowSize;
  style?: React.CSSProperties;
  tooltip?: string;
  tooltipIcon?: IconName;
  tooltipIconColor?: IconColor;
  variant?: ConfirmInfoRowVariant;
  labelChildrenStyleOverride?: React.CSSProperties;
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
  [ConfirmInfoRowVariant.Default]: Color.iconAlternative,
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
  rowVariant = ConfirmInfoRowSize.Default,
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
  labelChildrenStyleOverride,
}) => {
  const [expanded, setExpanded] = useState(!collapsed);

  const isCollapsible = collapsed !== undefined;

  const contentPaddingRight = ((copyEnabled ? 6 : 0) +
    (isCollapsible ? 6 : 0)) as SizeNumber;

  const isSmall = rowVariant === ConfirmInfoRowSize.Small;

  return (
    <ConfirmInfoRowContext.Provider value={{ variant }}>
      <Box
        data-testid={dataTestId}
        className="confirm-info-row"
        display={Display.Flex}
        flexDirection={isCollapsible ? FlexDirection.Column : FlexDirection.Row}
        justifyContent={JustifyContent.spaceBetween}
        flexWrap={FlexWrap.Wrap}
        alignItems={isSmall ? AlignItems.center : AlignItems.flexStart}
        backgroundColor={BACKGROUND_COLORS[variant]}
        borderRadius={BorderRadius.LG}
        marginTop={isSmall ? 0 : 2}
        marginBottom={isSmall ? 0 : 2}
        paddingLeft={isSmall ? 0 : 2}
        paddingRight={isSmall ? 0 : 2}
        color={TEXT_COLORS[variant] as TextColor}
        style={{
          overflowWrap: OverflowWrap.Anywhere,
          minHeight: isSmall ? undefined : '24px',
          position: 'relative',
          ...style,
        }}
      >
        {copyEnabled && (
          <CopyIcon
            copyText={copyText ?? ''}
            style={{ right: isCollapsible ? 32 : 4 }}
            color={IconColor.iconAlternative}
          />
        )}
        {isCollapsible && (
          <ButtonIcon
            color={IconColor.iconAlternative}
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
          justifyContent={JustifyContent.flexStart}
          alignItems={isSmall ? AlignItems.center : AlignItems.flexStart}
          color={color ?? TextColor.textAlternative}
          paddingRight={contentPaddingRight || null}
          onClick={onClick}
          className={onClick && 'hoverable'}
          style={{
            flexShrink: 0,
            flexBasis: 'auto',
            width: 'fit-content',
            maxWidth: '100%',
          }}
        >
          <Box
            display={Display.Flex}
            alignItems={AlignItems.center}
            style={{
              flexShrink: 0,
              ...labelChildrenStyleOverride,
            }}
          >
            {label && (
              <Text
                variant={
                  isSmall ? TextVariant.bodyMd : TextVariant.bodyMdMedium
                }
                color={TextColor.inherit}
              >
                {label}
              </Text>
            )}
            {labelChildren}
            {!labelChildren && tooltip?.length && (
              <Tooltip
                position="bottom"
                {...(tooltip.includes('\n')
                  ? {
                      html: (
                        <span style={{ whiteSpace: 'pre-line' }}>
                          {tooltip}
                        </span>
                      ),
                    }
                  : { title: tooltip })}
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

export type ConfirmInfoRowSkeletonProps = {
  'data-testid'?: string;
};

export const ConfirmInfoRowSkeleton: React.FC<ConfirmInfoRowSkeletonProps> = ({
  'data-testid': dataTestId,
}) => {
  const skeleton = (
    <Skeleton
      width={80}
      height={18}
      style={{ marginTop: 3, marginBottom: 3 }}
    />
  );

  return (
    <ConfirmInfoRow
      data-testid={dataTestId}
      rowVariant={ConfirmInfoRowSize.Small}
      labelChildren={skeleton}
    >
      {skeleton}
    </ConfirmInfoRow>
  );
};
