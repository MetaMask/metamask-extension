import React, { useCallback, useContext } from 'react';
import { useSelector } from 'react-redux';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../shared/constants/metametrics';
import { MetaMetricsContext } from '../../../contexts/metametrics';
import { selectShowTermsOfUse } from '../../../selectors/home-modals';
import { setTermsOfUseLastAgreed } from '../../../store/actions';
import { useAppDispatch } from '../../../store/hooks';
import TermsOfUsePopup from './terms-of-use-popup';

export function TermsOfUsePopupContainer() {
  const dispatch = useAppDispatch();
  const { trackEvent } = useContext(MetaMetricsContext);
  const showTermsOfUse = useSelector(selectShowTermsOfUse);

  const onAccept = useCallback(() => {
    dispatch(setTermsOfUseLastAgreed(new Date().getTime()));
    trackEvent({
      category: MetaMetricsEventCategory.Onboarding,
      event: MetaMetricsEventName.TermsOfUseAccepted,
      properties: {
        location: 'Terms Of Use Popover',
      },
    });
  }, [dispatch, trackEvent]);

  if (!showTermsOfUse) {
    return null;
  }

  return <TermsOfUsePopup onAccept={onAccept} />;
}
