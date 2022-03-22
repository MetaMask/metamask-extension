import React from 'react';
import { useHistory } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import PageContainerHeader from '../../../components/ui/page-container/page-container-header';
import { getMostRecentOverviewPage } from '../../../ducks/history/history';
import { useI18nContext } from '../../../hooks/useI18nContext';
import {
  ASSET_TYPES,
  getSendAsset,
  getSendStage,
  resetSendState,
  SEND_STAGES,
} from '../../../ducks/send';

export default function FormHeader() {
  const history = useHistory();
  const mostRecentOverviewPage = useSelector(getMostRecentOverviewPage);
  const dispatch = useDispatch();
  const stage = useSelector(getSendStage);
  const asset = useSelector(getSendAsset);
  const t = useI18nContext();

  const onClose = () => {
    history.push(mostRecentOverviewPage);
  };

  const title = 'Account verify';

  return (
    <PageContainerHeader
      className="form__header"
      onClose={onClose}
      title={title}
      headerCloseText={t('cancel')}
      hideClose
    />
  );
}
