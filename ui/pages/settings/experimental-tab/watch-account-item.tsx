///: BEGIN:ONLY_INCLUDE_IF(build-flask,build-experimental)
import React, { useContext } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../shared/constants/metametrics';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { MetaMetricsContext } from '../../../contexts/metametrics';
import { setWatchEthereumAccountEnabled } from '../../../store/actions';
import { getIsWatchEthereumAccountEnabled } from '../../../selectors';
import { ExperimentalTabItem } from './experimental-tab-item';

export type WatchAccountItemProps = {
  sectionRef?: React.RefObject<HTMLDivElement>;
};

export const WatchAccountItem = ({ sectionRef }: WatchAccountItemProps) => {
  const t = useI18nContext();
  const dispatch = useDispatch();
  const { trackEvent } = useContext(MetaMetricsContext);
  const toggleValue = useSelector(getIsWatchEthereumAccountEnabled);

  return (
    <ExperimentalTabItem
      title={t('watchEthereumAccountsToggle')}
      description={t('watchEthereumAccountsDescription', [
        <a
          key="watch-account-feedback-form__link-text"
          href="https://www.getfeedback.com/r/7Je8ckkq"
          target="_blank"
          rel="noopener noreferrer"
        >
          {t('form')}
        </a>,
      ])}
      toggleValue={toggleValue}
      toggleCallback={(value) => {
        trackEvent({
          event: MetaMetricsEventName.WatchEthereumAccountsToggled,
          category: MetaMetricsEventCategory.Settings,
          properties: { enabled: !value },
        });
        dispatch(setWatchEthereumAccountEnabled(!value));
      }}
      toggleContainerDataTestId="watch-account-toggle-div"
      toggleDataTestId="watch-account-toggle"
      sectionRef={sectionRef}
    />
  );
};
///: END:ONLY_INCLUDE_IF
