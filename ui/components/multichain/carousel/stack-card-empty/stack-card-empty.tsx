import React, { useEffect } from 'react';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import { Text } from '../../../component-library';
import {
  TextVariant,
  TextColor,
} from '../../../../helpers/constants/design-system';
import { useTransitionToEmpty } from '../animations/useTransitionToEmpty';
import type {
  StackCardEmptyProps,
  EmptyStateComponentProps,
} from './stack-card-empty.types';

// Background empty card for stacking behind last card
export const StackCardEmpty: React.FC<StackCardEmptyProps> = ({
  isBackground = true,
  className = '',
}) => {
  const t = useI18nContext();

  return (
    <div
      className={`carousel-card ${isBackground ? 'carousel-card--next' : 'carousel-card--current'} ${className}`}
    >
      {/* Only show pressed overlay for background cards */}
      {isBackground && <div className="carousel-card__pressed-overlay" />}

      {/* Empty state content - centered in card */}
      <div className="carousel-empty-state">
        <Text
          variant={TextVariant.bodyMdMedium}
          color={TextColor.textAlternative}
          className="carousel-empty-state__text"
        >
          {t('carouselAllCaughtUp')}
        </Text>
      </div>
    </div>
  );
};

// Main empty state component with fold animation
export const EmptyStateComponent: React.FC<EmptyStateComponentProps> = ({
  onComplete,
  isBackground = false,
}) => {
  const t = useI18nContext();
  const { startEmptyStateSequence, isEmptyStateFolding } = useTransitionToEmpty(
    { onEmptyStateComplete: onComplete },
  );

  useEffect(() => {
    if (!isBackground) {
      startEmptyStateSequence();
    }
  }, [isBackground, startEmptyStateSequence]);

  if (isBackground) {
    return <StackCardEmpty isBackground={true} />;
  }

  // Standalone empty state with fold-up animation
  return (
    <div
      className="carousel-container"
      style={{
        padding: '0 16px',
        height: isEmptyStateFolding ? '0px' : '106px',
        transition: isEmptyStateFolding ? 'height 300ms ease-in-out' : 'none',
        overflow: 'hidden',
      }}
    >
      <div
        className="carousel-cards-wrapper"
        style={{
          height: '100px',
          opacity: isEmptyStateFolding ? '0' : '1',
          transform: isEmptyStateFolding ? 'scaleY(0)' : 'scaleY(1)',
          transformOrigin: 'bottom',
          transition: isEmptyStateFolding
            ? 'opacity 200ms ease-in-out, transform 200ms ease-in-out 50ms'
            : 'none',
        }}
      >
        <div className="carousel-card carousel-card--current">
          <div className="carousel-empty-state">
            <Text
              variant={TextVariant.bodyMdMedium}
              color={TextColor.textAlternative}
              className="carousel-empty-state__text"
            >
              {t('carouselAllCaughtUp')}
            </Text>
          </div>
        </div>
      </div>
    </div>
  );
};
