import React from 'react';
import { Icon, IconName, IconSize } from '../../../component-library';

export interface StartTradeCtaProps {
  /** Callback when the CTA is clicked */
  onPress?: () => void;
}

/**
 * StartTradeCta displays a "Start a new trade" call-to-action button
 */
export const StartTradeCta: React.FC<StartTradeCtaProps> = ({ onPress }) => {
  const handleClick = () => {
    onPress?.();
  };

  return (
    <button
      type="button"
      className="start-trade-cta"
      onClick={handleClick}
      data-testid="start-new-trade-cta"
    >
      <div className="start-trade-cta__content">
        <div className="start-trade-cta__icon-container">
          <Icon
            name={IconName.Add}
            size={IconSize.Sm}
            className="start-trade-cta__icon"
          />
        </div>
        <span className="start-trade-cta__text">Start a new trade</span>
      </div>
    </button>
  );
};

export default StartTradeCta;

