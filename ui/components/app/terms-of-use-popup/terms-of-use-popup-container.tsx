import React, { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../shared/constants/metametrics';
import { useAnalytics } from '../../../hooks/useAnalytics';
import { selectShowTermsOfUse } from '../../../selectors/home-modals';
import { setTermsOfUseLastAgreed } from '../../../store/actions';
import TermsOfUsePopup from './terms-of-use-popup';

export function TermsOfUsePopupContainer() {
  const dispatch = useDispatch();
  const { trackEvent, createEventBuilder } = useAnalytics();
  const showTermsOfUse = useSelector(selectShowTermsOfUse);

  const onAccept = useCallback(() => {
    dispatch(setTermsOfUseLastAgreed(new Date().getTime()));
    trackEvent(
      createEventBuilder(MetaMetricsEventName.TermsOfUseAccepted)
        .addCategory(MetaMetricsEventCategory.Onboarding)
        .addProperties({
          location: 'Terms Of Use Popover',
        })
        .build(),
    );
  }, [createEventBuilder, dispatch, trackEvent]);

  if (!showTermsOfUse) {
    return null;
  }

  return <TermsOfUsePopup onAccept={onAccept} />;
}
