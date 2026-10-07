import React from 'react';
import {
  Box,
  ButtonIcon,
  ButtonIconSize,
  IconName,
  Text,
  TextVariant,
  TextColor,
  FontWeight,
} from '@metamask/design-system-react';
import { useI18nContext } from '../../../hooks/useI18nContext';

export type BrazeBannerCardProps = {
  title: string | null;
  body: string;
  imageUrl: string | null;
  ctaLabel: string | null;
  onClick?: () => void;
  onDismiss: () => void;
};

/**
 * Native campaign card with separate, keyboard-accessible CTA and close targets.
 *
 * @param options0 - Campaign content and interaction handlers.
 * @param options0.title - Optional heading; hides the separate CTA label.
 * @param options0.body - Required campaign text.
 * @param options0.imageUrl - Optional HTTPS image.
 * @param options0.ctaLabel - Action label for campaigns without a heading.
 * @param options0.onClick - Approved navigation action; absent for passive cards.
 * @param options0.onDismiss - Independent close action.
 */
export function BrazeBannerCard({
  title,
  body,
  imageUrl,
  ctaLabel,
  onClick,
  onDismiss,
}: BrazeBannerCardProps) {
  const t = useI18nContext();
  let safeImageUrl: string | undefined;
  try {
    if (imageUrl && new URL(imageUrl).protocol === 'https:') {
      safeImageUrl = imageUrl;
    }
  } catch {
    // Invalid image properties do not prevent the text campaign from rendering.
  }

  // Static surface for passive campaigns; a disabled button would be grayed
  // out and removed from the accessibility tree.
  const cardClasses =
    'flex w-full items-center gap-3 rounded-xl p-3 pr-10 text-left';
  const cardContent = (
    <>
      {safeImageUrl && (
        <img
          src={safeImageUrl}
          alt=""
          referrerPolicy="no-referrer"
          className="h-16 w-16 shrink-0 rounded-xl object-contain"
        />
      )}
      <Box className="min-w-0 flex-1">
        {title && (
          <Text variant={TextVariant.BodySm} fontWeight={FontWeight.Medium}>
            {title}
          </Text>
        )}
        <Text
          variant={TextVariant.BodySm}
          color={title ? TextColor.TextAlternative : TextColor.TextDefault}
        >
          {body}
        </Text>
        {!title && ctaLabel && onClick && (
          <Text
            variant={TextVariant.BodySm}
            color={TextColor.PrimaryDefault}
            fontWeight={FontWeight.Medium}
          >
            {ctaLabel}
          </Text>
        )}
      </Box>
    </>
  );

  return (
    <Box
      className="relative flex w-full items-center rounded-xl bg-background-muted"
      data-testid="braze-banner"
    >
      {onClick ? (
        <Box asChild>
          <button
            type="button"
            onClick={onClick}
            className={`${cardClasses} cursor-pointer`}
            data-testid="braze-banner-action"
          >
            {cardContent}
          </button>
        </Box>
      ) : (
        <Box className={cardClasses} data-testid="braze-banner-action">
          {cardContent}
        </Box>
      )}
      <ButtonIcon
        iconName={IconName.Close}
        size={ButtonIconSize.Md}
        ariaLabel={t('close')}
        onClick={onDismiss}
        className="absolute right-2 top-2"
        data-testid="braze-banner-dismiss"
      />
    </Box>
  );
}
