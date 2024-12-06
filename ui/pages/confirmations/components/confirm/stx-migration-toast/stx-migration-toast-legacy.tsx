import React, { useCallback, useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Box } from '../../../../../components/component-library';
import { Toast } from '../../../../../components/multichain';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import { stxAlertIsOpen, dismissAndDisableAlert } from '../../../../../ducks/alerts/stx-migration';
import ZENDESK_URLS from '../../../../../helpers/constants/zendesk-url';

const STXMigrationToastLegacy = () => {
  const [toastVisible, setToastVisible] = useState(false);
  const shouldShow = useSelector(stxAlertIsOpen);
  const dispatch = useDispatch();
  const t = useI18nContext();

  const hideToast = useCallback(() => {
    setToastVisible(false);
    dispatch(dismissAndDisableAlert());
  }, [dispatch]);

  const handleLearnMore = useCallback(() => {
    window.open(ZENDESK_URLS.SMART_TRANSACTIONS_LEARN_MORE, '_blank');
    hideToast();
  }, [hideToast]);

  useEffect(() => {
    let isMounted = true;

    if (shouldShow && isMounted) {
      setToastVisible(true);
    }

    return () => {
      isMounted = false;
    };
  }, [shouldShow]);

  if (!toastVisible) {
    return null;
  }

  return (
    <Box className="toast_wrapper">
      <Toast
        onClose={hideToast}
        text={t('smartTransactionsEnabledMessage')}
        actionText={t('smartTransactionsLearnMore')}
        onActionClick={handleLearnMore}
        startAdornment={null}
      />
    </Box>
  );
};

export default STXMigrationToastLegacy;
