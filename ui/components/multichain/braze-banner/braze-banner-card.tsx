import React from 'react';
import {
  Box,
  ButtonIcon,
  ButtonIconSize,
  FontWeight,
  IconName,
  Text,
  TextColor,
  TextVariant,
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

// `pr-3` matches the close button's `right-3` inset.
const CARD_CLASSES =
  'flex w-full items-center gap-4 rounded-xl bg-muted py-3 pl-4 pr-3 text-left';

/**
 * Campaign card with separate, keyboard-accessible action and close targets.
 * Campaign content is rendered as text, never as HTML.
 *
 * @param props - Campaign content and interaction handlers.
 * @param props.title - Optional heading; hides the separate CTA label.
 * @param props.body - Campaign text.
 * @param props.imageUrl - Optional `https` image.
 * @param props.ctaLabel - Action label for campaigns without a heading.
 * @param props.onClick - Opens the campaign link; absent for passive cards.
 * @param props.onDismiss - Dismisses the campaign.
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

  const cardContent = (
    <>
      {imageUrl && (
        <img
          src={imageUrl}
          alt=""
          referrerPolicy="no-referrer"
          className="h-16 w-16 shrink-0 rounded-lg object-contain"
        />
      )}
      <Box className="flow-root min-w-0 flex-1">
        {/* A noninteractive float reserves the top-right close button area.
            Text beside it wraps; lines below it use the full column width. */}
        <span
          aria-hidden="true"
          className="pointer-events-none float-right h-5 w-8"
          data-testid="braze-banner-dismiss-spacer"
        />
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
      // Centered and capped at 458px, matching the Money account balance
      // and wallet overview action buttons.
      className="relative flex w-full max-w-[458px] self-center wide-layout:max-w-none"
      data-testid="braze-banner"
    >
      {onClick ? (
        <Box asChild>
          <button
            type="button"
            onClick={onClick}
            className={`${CARD_CLASSES} cursor-pointer hover:bg-muted-hover active:bg-muted-pressed`}
            data-testid="braze-banner-action"
          >
            {cardContent}
          </button>
        </Box>
      ) : (
        // A disabled button would be grayed out and hidden from assistive
        // technology, so passive campaigns use a static surface.
        <Box className={CARD_CLASSES} data-testid="braze-banner-action">
          {cardContent}
        </Box>
      )}
      {/* A sibling of the action button, so closing never opens the link. */}
      <ButtonIcon
        iconName={IconName.Close}
        size={ButtonIconSize.Sm}
        ariaLabel={t('close')}
        onClick={onDismiss}
        className="absolute right-3 top-3"
        data-testid="braze-banner-dismiss"
      />
    </Box>
  );
}
