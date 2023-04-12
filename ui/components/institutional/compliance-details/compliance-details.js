import React, { useContext, useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import { I18nContext } from '../../../contexts/i18n';
import InfoTooltip from '../../ui/info-tooltip';
import SwapsFooter from '../../../pages/swaps/swaps-footer';
import {
  fetchHistoricalReports,
  getComplianceHistoricalReportsByAddress,
  getComplianceTenantSubdomain,
} from '../../../ducks/institutional/institutional';
import { formatDate } from '../../../helpers/utils/util';

const ComplianceDetails = ({ address, onClose, onGenerate }) => {
  const t = useContext(I18nContext);
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(fetchHistoricalReports(address));
  }, [address, dispatch]);

  const [lastReport, setLastReport] = useState(null);
  const historicalReports = useSelector(
    getComplianceHistoricalReportsByAddress(address),
  );

  useEffect(() => {
    if (historicalReports && historicalReports.length) {
      setLastReport(
        historicalReports.reduce((prev, cur) =>
          prev.createTime > cur.createTime ? prev : cur,
        ),
      );
    }
  }, [historicalReports]);

  const complianceTenantSubdomain = useSelector(getComplianceTenantSubdomain);

  return (
    <div className="compliance-details">
      <div className="compliance-details__row">
        <div className="compliance-details__detail-header">{t('address')}</div>
        <div className="compliance-details__detail-content--address">
          {address}
        </div>
      </div>
      <div className="compliance-details__row">
        <div className="compliance-details__detail-header">
          {t('riskRating')}
          <InfoTooltip
            position="bottom"
            contentText={<span>{t('riskRatingTooltip')}</span>}
          />
        </div>
        <div
          className={classnames('compliance-row__column-risk', {
            'compliance-row__column-risk--green': lastReport?.risk === 'low',
            'compliance-row__column-risk--yellow':
              lastReport?.risk === 'medium',
            'compliance-row__column-risk--orange': lastReport?.risk === 'high',
            'compliance-row__column-risk--red':
              lastReport?.risk === 'unacceptable',
          })}
        >
          {lastReport ? lastReport.risk : 'No Report'}
        </div>
      </div>
      <div className="compliance-details__row">
        <div className="compliance-details__detail-header">
          {t('reportLastRun')}
          <InfoTooltip
            position="bottom"
            contentText={<span>{t('reportLastRunTooltip')}</span>}
          />
        </div>
        <div className="compliance-details__detail-content">
          {lastReport
            ? formatDate(new Date(lastReport.createTime).getTime())
            : 'N/A'}
        </div>
      </div>
      <div className="compliance-details__footer">
        <SwapsFooter
          onSubmit={() => {
            onGenerate(address);
            onClose();
          }}
          submitText={t('runReport')}
          onCancel={() =>
            global.platform.openTab({
              url: `https://${complianceTenantSubdomain}.compliance.codefi.network/app/kyt/addresses/${lastReport.address}/${lastReport.reportId}`,
            })
          }
          cancelText={t('showReport')}
          hideCancel={!lastReport}
          approveActive={lastReport}
          showTopBorder
        />
      </div>
    </div>
  );
};

ComplianceDetails.propTypes = {
  address: PropTypes.string,
  onClose: PropTypes.func,
  onGenerate: PropTypes.func,
};

export default ComplianceDetails;
