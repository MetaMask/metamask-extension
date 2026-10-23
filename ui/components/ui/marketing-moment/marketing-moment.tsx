import React from 'react';
import {
  Box,
  BoxAlignItems,
  BoxFlexDirection,
  BoxJustifyContent,
  Button,
  ButtonSize,
  ButtonVariant,
  Text,
  TextAlign,
  TextColor,
  TextVariant,
  twMerge,
} from '@metamask/design-system-react';
import { MarketingMomentTitle } from './marketing-moment-title';
import type {
  MarketingMomentAction,
  MarketingMomentProps,
} from './marketing-moment.types';

/**
 * Full-screen marketing moment. Title and description sit at the top, artwork
 * fills the middle, and the actions stay pinned to the bottom.
 *
 * @param props - Copy, artwork, and actions.
 * @param props.title
 * @param props.titleProps
 * @param props.description
 * @param props.descriptionProps
 * @param props.children
 * @param props.artwork
 * @param props.artworkWrapperProps
 * @param props.primaryAction
 * @param props.secondaryAction
 * @param props.background
 * @param props.reserveCloseButtonSpace
 * @param props.className
 * @param props.'data-testid'
 */
export const MarketingMoment = ({
  title,
  titleProps,
  description,
  descriptionProps,
  children,
  artwork,
  artworkWrapperProps,
  primaryAction,
  secondaryAction,
  background,
  reserveCloseButtonSpace = true,
  className,
  'data-testid': dataTestId,
}: MarketingMomentProps) => {
  const { label: primaryLabel, ...primaryButtonProps } =
    primaryAction ?? ({} as Partial<MarketingMomentAction>);
  const { label: secondaryLabel, ...secondaryButtonProps } =
    secondaryAction ?? ({} as Partial<MarketingMomentAction>);
  const {
    className: titleClassName,
    style: titleStyle,
    ...titleTextProps
  } = titleProps ?? {};
  const { className: artworkClassName, ...artworkBoxProps } =
    artworkWrapperProps ?? {};

  const renderTitle = () => {
    if (!title) {
      return null;
    }

    if (typeof title !== 'string') {
      return title;
    }

    return (
      <MarketingMomentTitle
        {...titleTextProps}
        className={twMerge('w-full text-center', titleClassName)}
        style={titleStyle}
      >
        {title}
      </MarketingMomentTitle>
    );
  };

  const renderDescription = () => {
    if (!description) {
      return null;
    }

    if (typeof description !== 'string') {
      return description;
    }

    return (
      <Text
        variant={TextVariant.BodyMd}
        color={TextColor.TextAlternative}
        textAlign={TextAlign.Center}
        {...descriptionProps}
      >
        {description}
      </Text>
    );
  };

  return (
    <Box
      data-testid={dataTestId}
      flexDirection={BoxFlexDirection.Column}
      className={twMerge(
        'relative h-full min-h-0 w-full flex-1 overflow-y-auto',
        background ? 'bg-transparent' : 'bg-default',
        className,
      )}
    >
      {background ? (
        <Box className="pointer-events-none absolute inset-0">{background}</Box>
      ) : null}
      <Box
        flexDirection={BoxFlexDirection.Column}
        gap={4}
        paddingHorizontal={6}
        className={reserveCloseButtonSpace ? 'mt-12 shrink-0' : 'shrink-0'}
      >
        {renderTitle()}
        {renderDescription()}
        {children}
      </Box>

      {artwork ? (
        <Box
          flexDirection={BoxFlexDirection.Column}
          alignItems={BoxAlignItems.Center}
          justifyContent={BoxJustifyContent.Center}
          paddingHorizontal={6}
          {...artworkBoxProps}
          className={twMerge('w-full flex-1 overflow-hidden', artworkClassName)}
        >
          {artwork}
        </Box>
      ) : (
        <Box className="flex-1" />
      )}

      {primaryAction || secondaryAction ? (
        <Box
          flexDirection={BoxFlexDirection.Column}
          gap={2}
          paddingHorizontal={4}
          paddingBottom={4}
          className="shrink-0"
        >
          {primaryAction ? (
            <Button
              variant={ButtonVariant.Primary}
              size={ButtonSize.Lg}
              isFullWidth
              {...primaryButtonProps}
            >
              {primaryLabel}
            </Button>
          ) : null}
          {secondaryAction ? (
            <Button
              variant={ButtonVariant.Tertiary}
              size={ButtonSize.Lg}
              isFullWidth
              {...secondaryButtonProps}
            >
              {secondaryLabel}
            </Button>
          ) : null}
        </Box>
      ) : null}
    </Box>
  );
};
