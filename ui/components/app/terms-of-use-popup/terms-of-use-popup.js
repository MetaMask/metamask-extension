import React, { useContext, useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { debounce } from 'lodash';
import { I18nContext } from '../../../contexts/i18n';
import Popover from '../../ui/popover';
import {
  AlignItems,
  TextColor,
  FlexDirection,
} from '../../../helpers/constants/design-system';
import {
  Box,
  Button,
  BUTTON_VARIANT,
  Checkbox,
  Text,
} from '../../component-library';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../shared/constants/metametrics';
import { MetaMetricsContext } from '../../../contexts/metametrics';
import { TermsOfUse } from './terms-of-use';

export default function TermsOfUsePopup({ onAccept }) {
  const t = useContext(I18nContext);
  const trackEvent = useContext(MetaMetricsContext);
  const [isTermsOfUseChecked, setIsTermsOfUseChecked] = useState(false);
  const [shouldShowScrollButton, setShouldShowScrollButton] = useState(true);

  const popoverRef = useRef();
  const bottomRef = React.createRef();

  const handleScrollDownClick = (e) => {
    e.stopPropagation();
    bottomRef.current.scrollIntoView({
      behavior: 'smooth',
    });
  };

  const handleDebouncedScroll = debounce((target) => {
    setShouldShowScrollButton(
      target.scrollHeight - target.scrollTop !== target.clientHeight,
    );
  }, 100);

  const handleScroll = (e) => {
    handleDebouncedScroll(e.target);
  };

  useEffect(() => {
    trackEvent({
      category: MetaMetricsEventCategory.Onboarding,
      event: MetaMetricsEventName.TermsOfUseShown,
      properties: {
        location: 'Terms Of Use Popover',
      },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Popover
      className="terms-of-use__popover"
      popoverRef={popoverRef}
      onScroll={handleScroll}
      showScrollDown={shouldShowScrollButton}
      title={t('termsOfUseTitle')}
      onScrollDownButtonClick={handleScrollDownClick}
      footerProps={{
        justifyContent: AlignItems.center,
        flexDirection: FlexDirection.Column,
      }}
      footer={
        <>
          <Button
            variant={BUTTON_VARIANT.PRIMARY}
            className="terms-of-use__button"
            onClick={onAccept}
            disabled={!isTermsOfUseChecked}
            data-testid="terms-of-use-accept-button"
          >
            {t('accept')}
          </Button>
          <Text
            as="p"
            marginTop={4}
            className="terms-of-use__footer-text"
            color={TextColor.textAlternative}
          >
            {t('termsOfUseFooterText')}
          </Text>
        </>
      }
    >
      <>
        <TermsOfUse />
        <Box
          flexDirection={FlexDirection.Row}
          alignItems={AlignItems.flexStart}
          marginLeft={3}
          marginRight={3}
          gap={2}
        >
          <Checkbox
            id="terms-of-use__checkbox"
            className="terms-of-use__checkbox"
            data-testid="terms-of-use-checkbox"
            isChecked={isTermsOfUseChecked}
            onChange={() => {
              setIsTermsOfUseChecked(!isTermsOfUseChecked);
            }}
            label={t('termsOfUseAgreeText')}
            ref={bottomRef}
          />
        </Box>
      </>
    </Popover>
  );
}

TermsOfUsePopup.propTypes = {
  onAccept: PropTypes.func.isRequired,
};
