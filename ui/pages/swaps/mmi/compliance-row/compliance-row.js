import React, { useContext, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { useSelector, useDispatch } from 'react-redux';
import classnames from 'classnames';
import { I18nContext } from '../../../contexts/i18n';
import InfoTooltip from '../../../components/ui/info-tooltip';
import {
  fetchHistoricalReports,
  getComplianceHistoricalReportsByAddress,
  getComplianceReportsInProgressByAddress,
} from '../../../ducks/institutional/institutional';

export default function ComplianceRow({ address, rowClick, inProgress }) {
  const dispatch = useDispatch();
  const [progressText, setProgressText] = useState('');

  const t = useContext(I18nContext);
  let lastReport;
  let reportOlderThanEightHours;

  // @shane-t this is a hack that I don't really understand
  let numberOfReportsInProgress = 0;
  let historicalReports = useSelector(
    getComplianceHistoricalReportsByAddress(address),
  );
  if (historicalReports?.length) {
    lastReport = historicalReports.reduce((prev, cur) =>
      prev.createTime > cur.createTime ? prev : cur,
    );
    reportOlderThanEightHours =
      Math.abs(new Date() - new Date(lastReport.createTime)) / 3600000 > 8;
  } else {
    historicalReports = [];
  }
  const reportsInProgress = useSelector(
    getComplianceReportsInProgressByAddress(address),
  );
  // @shane-t HACK
  numberOfReportsInProgress = reportsInProgress ? reportsInProgress.length : 0;

  useEffect(() => {
    dispatch(fetchHistoricalReports(address));
  }, [numberOfReportsInProgress]); // @shane-t HACK

  useEffect(() => {
    setTimeout(() => {
      if (historicalReports === undefined) {
        setProgressText(t('historicalReportsLongerThanUsual'));
      }
    }, 5000);
  }, [historicalReports]);

  const showInProgress =
    inProgress ||
    historicalReports === undefined ||
    reportsInProgress?.length > 0;

  return showInProgress ? (
    <div className="compliance-row--container">
      <div
        className="compliance-row compliance-row__loading"
        data-testid="loading-element"
      ></div>
      {reportsInProgress?.length > 0 && (
        <p className="compliance-row__progress">
          Generating AML report: {reportsInProgress[0].progress}%
        </p>
      )}
      {(!reportsInProgress || reportsInProgress.length === 0) &&
        progressText && (
          <p className="compliance-row__progress">{progressText}</p>
        )}
    </div>
  ) : (
    <div className="compliance-row" onClick={lastReport ? rowClick : rowClick}>
      <div className="compliance-row__column">
        <div className="compliance-row__column-text">{t('risk')}:</div>
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
          {lastReport ? lastReport.risk : 'No report'}
        </div>
        {lastReport ? (
          <InfoTooltip
            position="top"
            contentText={
              <>
                <p>{t('riskOfThisPoolFlaggedAs', [lastReport?.risk])}</p>
              </>
            }
          />
        ) : (
          ''
        )}
      </div>
      <div className="compliance-row__column">
        <div className="compliance-row__column-text">{t('report')}:</div>
        {lastReport ? (
          <div
            data-testid="report-valid"
            className={classnames('compliance-row__column-report', {
              'compliance-row__column-report--valid':
                !reportOlderThanEightHours,
              'compliance-row__column-report--invalid':
                reportOlderThanEightHours,
            })}
          />
        ) : (
          <div className="compliance-row__column-text"> N/A </div>
        )}
        <InfoTooltip
          position="top"
          contentText={
            <>
              <p>
                {lastReport
                  ? t('complianceAnalysisRun', [
                      reportOlderThanEightHours ? 'not' : '',
                    ])
                  : t('complianceAnalysisNotRun')}
              </p>
            </>
          }
        />
      </div>
    </div>
  );
}

ComplianceRow.propTypes = {
  address: PropTypes.string.required,
  rowClick: PropTypes.func,
  inProgress: PropTypes.bool,
};
