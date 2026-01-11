import React from 'react';
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

  // Get the slide title and description, falling back to raw values if translation is not available
  const slideTitle = isContentfulContent
    ? slide.title
    : t(slide.title) || slide.title;

  const slideDescription = isContentfulContent
    ? slide.description
    : t(slide.description) || slide.description;

  const handleCloseClick = (e: React.MouseEvent<HTMLElement>) => {
    e.preventDefault();
    e.stopPropagation();

    if (onTransitionToNextCard) {
      onTransitionToNextCard(slide.id, isLastSlide);
    }
  };

  const handleCardClick = () => {
    if (!isCurrentCard) {
      return;
    }

    const navigation = {
      type: slide.href ? ('external' as const) : ('internal' as const),
      href: slide.href,
    };

    if (slide.href) {
      global.platform.openTab({ url: slide.href });
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
        <img src={slide.image} alt={slideTitle} />
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
            {slideTitle}
          </Text>

          {onTransitionToNextCard && (
            <ButtonIcon
              iconName={IconName.Close}
              size={ButtonIconSize.Md}
              color={IconColor.iconAlternative}
              ariaLabel={t('closeSlide', [slideTitle])}
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
            {slideDescription}
          </Text>
        </div>
      </div>
    </div>
  );
};
