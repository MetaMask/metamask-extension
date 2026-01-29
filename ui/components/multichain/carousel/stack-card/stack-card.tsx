import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import {
  ButtonIcon,
  ButtonIconSize,
  IconName,
  Text,
} from '../../../component-library';
import {
  IconColor,
  TextVariant,
  TextColor,
} from '../../../../helpers/constants/design-system';
import { SHIELD_CAROUSEL_ID } from '../../../../../shared/modules/shield/constants';
import { SETTINGS_ROUTE } from '../../../../helpers/constants/routes';
import { SHIELD_QUERY_PARAMS } from '../../../../../shared/lib/deep-links/routes/shield';
import type { StackCardProps } from './stack-card.types';

export const StackCard: React.FC<StackCardProps> = ({
  slide,
  isCurrentCard,
  isLastSlide = false,
  onSlideClick,
  onTransitionToNextCard,
  className = '',
}) => {
  const t = useI18nContext();
  const isContentfulContent = slide.id.startsWith('contentful-');

  const getLocalizedText = (value: string) =>
    isContentfulContent ? value : t(value) ?? value;

  const slideTitleText = getLocalizedText(slide.title);
  const slideDescriptionText = getLocalizedText(slide.description);
  const closeSlideAriaLabel =
    t('closeSlide', [slideTitleText]) ?? slideTitleText;

  const handleCloseClick = (e: React.MouseEvent<HTMLElement>) => {
    e.preventDefault();
    e.stopPropagation();

    if (onTransitionToNextCard) {
      onTransitionToNextCard(slide.id, isLastSlide);
    }
  };

  const navigate = useNavigate();

  const handleCardClick = () => {
    if (!isCurrentCard) {
      return;
    }

    const navigation = {
      type: slide.href ? ('external' as const) : ('internal' as const),
      href: slide.href,
    };

    if (slide.href) {
      const key = slide.id;
      if (key === SHIELD_CAROUSEL_ID) {
        // in app navigation for shield carousel
        // TODO: clean this once we have better control of how deeplink are opened
        try {
          const url = new URL(slide.href);
          const params = url.searchParams.toString();
          navigate(
            `${SETTINGS_ROUTE}?${SHIELD_QUERY_PARAMS.showShieldEntryModal}=true${params ? `&${params}` : ''}`,
          );
        } catch (error) {
          console.error('[StackCard] error parsing slide.href', error);
        }
      } else {
        global.platform.openTab({ url: slide.href });
      }
    }

    onSlideClick?.(slide.id, navigation);
  };

  return (
    <div
      className={`carousel-card ${
        isCurrentCard ? 'carousel-card--current' : 'carousel-card--next'
      } ${className}`}
      onClick={handleCardClick}
      data-testid={`carousel-slide-${slide.id}`}
    >
      {/* Pressed background overlay for next card */}
      {!isCurrentCard && <div className="carousel-card__pressed-overlay" />}

      {/* Image Container */}
      <div className="carousel-card__image">
        <img src={slide.image} alt={slideTitleText} />
      </div>

      {/* Info container */}
      <div className="carousel-card__text">
        {/* Title and close button container */}
        <div className="carousel-card__text-header">
          <Text
            variant={TextVariant.bodyMdMedium}
            color={TextColor.textDefault}
            className="carousel-card__title"
          >
            {slideTitleText}
          </Text>

          {onTransitionToNextCard && (
            <ButtonIcon
              iconName={IconName.Close}
              size={ButtonIconSize.Md}
              color={IconColor.iconAlternative}
              ariaLabel={closeSlideAriaLabel}
              onClick={handleCloseClick}
              data-testid={`carousel-slide-${slide.id}-close-button`}
            />
          )}
        </div>

        {/* Description Text container */}
        <div className="carousel-card__text-body">
          <Text
            variant={TextVariant.bodySmMedium}
            color={TextColor.textAlternative}
            className="carousel-card__description"
          >
            {slideDescriptionText}
          </Text>
        </div>
      </div>
    </div>
  );
};
