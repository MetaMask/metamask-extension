import React, { type ReactNode } from 'react';
import {
  Box,
  Icon,
  IconName,
  IconSize,
  Text,
} from '../../../../../components/component-library';
import {
  AlignItems,
  BackgroundColor,
  BorderRadius,
  Display,
  FlexDirection,
  FlexWrap,
  IconColor,
  JustifyContent,
  TextColor,
  TextVariant,
} from '../../../../../helpers/constants/design-system';
import type {
  PayWithRowConfig,
  PayWithRowTagRenderer,
} from './pay-with-modal.types';

const renderFirstTag = (
  tagRenderers: PayWithRowTagRenderer[] | undefined,
): ReactNode =>
  tagRenderers?.reduce<ReactNode>((found, render) => found ?? render(), null) ??
  null;

export function PaymentMethodRow({
  id,
  icon,
  title,
  subtitle,
  isSelected,
  tagRenderers,
  trailingElement = 'none',
  onPress,
  testId,
}: PayWithRowConfig) {
  const resolvedTestId = testId ?? `payment-method-row-${id}`;
  const tag = renderFirstTag(tagRenderers);

  return (
    <Box
      as="button"
      data-testid={resolvedTestId}
      onClick={onPress}
      display={Display.Flex}
      alignItems={AlignItems.center}
      justifyContent={JustifyContent.spaceBetween}
      paddingTop={3}
      paddingBottom={3}
      paddingLeft={4}
      paddingRight={4}
      gap={3}
      backgroundColor={
        isSelected
          ? BackgroundColor.backgroundMuted
          : BackgroundColor.transparent
      }
      style={{
        width: '100%',
        border: 'none',
        cursor: onPress ? 'pointer' : 'default',
        textAlign: 'left',
      }}
    >
      <Box
        display={Display.Flex}
        alignItems={AlignItems.center}
        justifyContent={JustifyContent.center}
        backgroundColor={
          isSelected
            ? BackgroundColor.backgroundMuted
            : BackgroundColor.backgroundSection
        }
        borderRadius={BorderRadius.full}
        style={{
          width: 40,
          height: 40,
          flexShrink: 0,
          // Visible so TokenIcon network badges can overhang the circle.
          overflow: 'visible',
          position: 'relative',
        }}
        data-testid={`${resolvedTestId}-icon-slot`}
      >
        {/* Absolute center: BadgeWrapper sets `align-self: start`, which
            pins TokenIcon to the top of a flex slot and looks broken. */}
        <Box
          display={Display.Flex}
          alignItems={AlignItems.center}
          justifyContent={JustifyContent.center}
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
          }}
        >
          {icon}
        </Box>
      </Box>
      <Box
        display={Display.Flex}
        flexDirection={FlexDirection.Column}
        style={{ flex: 1, minWidth: 0 }}
      >
        <Box
          display={Display.Flex}
          flexDirection={FlexDirection.Row}
          alignItems={AlignItems.center}
          flexWrap={FlexWrap.Wrap}
          gap={2}
        >
          <Text
            variant={TextVariant.bodyMdMedium}
            color={TextColor.textDefault}
            data-testid={`${resolvedTestId}-title`}
          >
            {title}
          </Text>
          {tag}
        </Box>
        {subtitle ? (
          <Text
            variant={TextVariant.bodySm}
            color={TextColor.textAlternative}
            data-testid={`${resolvedTestId}-subtitle`}
          >
            {subtitle}
          </Text>
        ) : null}
      </Box>
      {trailingElement === 'checkmark' ? (
        <Icon
          name={IconName.Check}
          size={IconSize.Md}
          color={IconColor.iconDefault}
          data-testid="payment-method-row-checkmark"
        />
      ) : null}
      {trailingElement === 'chevron' ? (
        <Icon
          name={IconName.ArrowRight}
          size={IconSize.Md}
          color={IconColor.iconAlternative}
          data-testid="payment-method-row-chevron"
        />
      ) : null}
    </Box>
  );
}
