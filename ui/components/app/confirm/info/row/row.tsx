import React, { createContext } from 'react';
import Tooltip from '../../../../ui/tooltip/tooltip';
import {
  Box,
  BoxAlignItems,
  BoxBackgroundColor,
  BoxFlexDirection,
  BoxFlexWrap,
  BoxJustifyContent,
} from '@metamask/design-system-react';
import {
  ButtonIcon,
  ButtonIconSize,
  Icon,
  IconName,
  IconSize,
  Text,
} from '../../../../component-library';
import { Skeleton } from '../../../../component-library/skeleton';
import {
  Color,
  IconColor,
  OverflowWrap,
  TextColor,
  TextVariant,
} from '../../../../../helpers/constants/design-system';
import { SizeNumber } from '../../../../ui/box/box';
import { useBoolean } from '../../../../../hooks/useBoolean';
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
  tooltip?: string | React.ReactNode;
  tooltipIcon?: IconName;
  tooltipIconColor?: IconColor;
  variant?: ConfirmInfoRowVariant;
  labelChildrenStyleOverride?: React.CSSProperties;
};

type TooltipDisplayProps = { html?: React.ReactNode; title?: string };

function getConfirmInfoRowTooltipProps(
  tooltip: string | React.ReactNode,
): TooltipDisplayProps {
  if (typeof tooltip !== 'string') {
    return { html: tooltip };
  }
  if (tooltip.includes('\n')) {
    return {
      html: <span style={{ whiteSpace: 'pre-line' }}>{tooltip}</span>,
    };
  }
  return { title: tooltip };
}

const BACKGROUND_COLORS: Record<
  ConfirmInfoRowVariant,
  BoxBackgroundColor | undefined
> = {
  [ConfirmInfoRowVariant.Default]: undefined,
  [ConfirmInfoRowVariant.Critical]: BoxBackgroundColor.ErrorMuted,
  [ConfirmInfoRowVariant.Warning]: BoxBackgroundColor.WarningMuted,
};

const TEXT_COLOR_CLASSES: Record<ConfirmInfoRowVariant, string> = {
  [ConfirmInfoRowVariant.Default]: 'text-default',
  [ConfirmInfoRowVariant.Critical]: 'text-error-alternative',
  [ConfirmInfoRowVariant.Warning]: 'text-warning-default',
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
  const { value: expanded, toggle } = useBoolean(!collapsed);

  const isCollapsible = collapsed !== undefined;

  const contentPaddingRight = ((copyEnabled ? 6 : 0) +
    (isCollapsible ? 6 : 0)) as SizeNumber;

  const isSmall = rowVariant === ConfirmInfoRowSize.Small;

  return (
    <ConfirmInfoRowContext.Provider value={{ variant }}>
      <Box
        data-testid={dataTestId}
        className={`flex confirm-info-row rounded-lg ${TEXT_COLOR_CLASSES[variant]}`}
        flexDirection={
          isCollapsible ? BoxFlexDirection.Column : BoxFlexDirection.Row
        }
        justifyContent={BoxJustifyContent.Between}
        flexWrap={BoxFlexWrap.Wrap}
        alignItems={isSmall ? BoxAlignItems.Center : BoxAlignItems.Start}
        backgroundColor={BACKGROUND_COLORS[variant]}
        marginTop={isSmall ? 0 : 2}
        marginBottom={isSmall ? 0 : 2}
        paddingLeft={isSmall ? 0 : 2}
        paddingRight={isSmall ? 0 : 2}
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
            onClick={toggle}
            data-testid="sectionCollapseButton"
            ariaLabel="collapse-button"
          />
        )}
        <Box
          className={`flex ${color ?? TextColor.textAlternative}${onClick ? ' hoverable' : ''}`}
          flexDirection={BoxFlexDirection.Row}
          justifyContent={BoxJustifyContent.Start}
          alignItems={isSmall ? BoxAlignItems.Center : BoxAlignItems.Start}
          paddingRight={contentPaddingRight || undefined}
          onClick={onClick}
          style={{
            flexShrink: 0,
            flexBasis: 'auto',
            width: 'fit-content',
            maxWidth: '100%',
          }}
        >
          <Box
            className="flex"
            alignItems={BoxAlignItems.Center}
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
            {!labelChildren &&
              tooltip !== undefined &&
              tooltip !== null &&
              (typeof tooltip !== 'string' || tooltip.length > 0) && (
                <Tooltip
                  position="bottom"
                  {...getConfirmInfoRowTooltipProps(tooltip)}
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
  label?: string;
  rowVariant?: ConfirmInfoRowSize;
};

export const ConfirmInfoRowSkeleton: React.FC<ConfirmInfoRowSkeletonProps> = ({
  'data-testid': dataTestId,
  label,
  rowVariant = ConfirmInfoRowSize.Default,
}) => {
  const isSmall = rowVariant === ConfirmInfoRowSize.Small;

  if (isSmall || !label) {
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
  }

  return (
    <ConfirmInfoRow
      data-testid={dataTestId}
      label={label}
      rowVariant={rowVariant}
    >
      <Skeleton height="16px" width="60px" />
    </ConfirmInfoRow>
  );
};
