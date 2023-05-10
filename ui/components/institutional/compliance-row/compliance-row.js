import React, { useContext, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { useSelector, useDispatch } from 'react-redux';
import classnames from 'classnames';
import { I18nContext } from '../../../contexts/i18n';
import InfoTooltip from '../../ui/info-tooltip';
import {
  fetchHistoricalReports,
  getComplianceHistoricalReportsByAddress,
  getComplianceReportsInProgressByAddress,
} from '../../../ducks/institutional/institutional';
import Box from '../../ui/box/box';
import {
  AlignItems,
  BLOCK_SIZES,
  BorderRadius,
  DISPLAY,
  FLEX_DIRECTION,
  JustifyContent,
  TextAlign,
  TextVariant,
} from '../../../helpers/constants/design-system';
import { Text } from '../../component-library';

export default function ComplianceRow({ address, rowClick, inProgress }) {
  const dispatch = useDispatch();
  const [progressText, setProgressText] = useState('');

  const t = useContext(I18nContext);
  let lastReport;
  let reportOlderThanEightHours;
  let numberOfReportsInProgress = 0;
  let historicalReports = useSelector(
    getComplianceHistoricalReportsByAddress(address),
  );
  const reportsInProgress = useSelector(
    getComplianceReportsInProgressByAddress(address),
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

  numberOfReportsInProgress = reportsInProgress ? reportsInProgress.length : 0;

  useEffect(() => {
    dispatch(fetchHistoricalReports(address));
  }, [address, dispatch, numberOfReportsInProgress]);

  useEffect(() => {
    setTimeout(() => {
      if (historicalReports === undefined) {
        setProgressText(t('historicalReportsLongerThanUsual'));
      }
    }, 5000);
  }, [historicalReports, t]);

  const showInProgress =
    inProgress ||
    historicalReports === undefined ||
    reportsInProgress?.length > 0;

  return showInProgress ? (
    <Box
      width={BLOCK_SIZES.FULL}
      display={DISPLAY.FLEX}
      flexDirection={FLEX_DIRECTION.COLUMN}
    >
      <Box
        className="compliance-row compliance-row__loading"
        borderRadius={BorderRadius.MD}
        data-testid="loading-element"
      />
      {reportsInProgress?.length > 0 && (
        <Text
          as="p"
          variant={TextVariant.bodyXs}
          marginBottom={2}
          textAlign={TextAlign.Center}
        >
          {t('generatingAmlReport')}: {reportsInProgress[0].progress}%
        </Text>
      )}
      {(!reportsInProgress || reportsInProgress.length === 0) &&
        progressText && (
          <Text
            as="p"
            variant={TextVariant.bodyXs}
            marginBottom={2}
            textAlign={TextAlign.Center}
          >
            {progressText}
          </Text>
        )}
    </Box>
  ) : (
    <Box
      className="compliance-row"
      width={BLOCK_SIZES.FULL}
      display={DISPLAY.FLEX}
      paddingTop={1}
      paddingBottom={1}
      paddingRight={2}
      paddingLeft={2}
      marginBottom={2}
      borderRadius={BorderRadius.MD}
      onClick={lastReport ? rowClick : rowClick}
    >
      <Box
        className="compliance-row__column"
        display={DISPLAY.FLEX}
        justifyContent={JustifyContent.center}
        width={BLOCK_SIZES.HALF}
      >
        <Text
          display={DISPLAY.FLEX}
          alignItems={AlignItems.center}
          marginRight={2}
          variant={TextVariant.bodyXs}
        >
          {t('risk')}:
        </Text>
        <Box
          className={classnames('compliance-row__column-risk', {
            'compliance-row__column-risk--green': lastReport?.risk === 'low',
            'compliance-row__column-risk--yellow':
              lastReport?.risk === 'medium',
            'compliance-row__column-risk--orange': lastReport?.risk === 'high',
            'compliance-row__column-risk--red':
              lastReport?.risk === 'unacceptable',
          })}
        >
          {lastReport ? lastReport.risk : t('noReport')}
        </Box>
        {lastReport && (
          <InfoTooltip
            position="top"
            contentText={
              <Text variant={TextVariant.bodyXs} as="p">
                {t('riskOfThisPoolFlaggedAs', [lastReport?.risk])}
              </Text>
            }
          />
        )}
      </Box>
      <Box
        className="compliance-row__column"
        display={DISPLAY.FLEX}
        justifyContent={JustifyContent.center}
        width={BLOCK_SIZES.HALF}
      >
        <Text
          display={DISPLAY.FLEX}
          alignItems={AlignItems.center}
          marginRight={2}
          variant={TextVariant.bodyXs}
        >
          {t('report')}:
        </Text>
        {lastReport ? (
          <Box
            data-testid="report-valid"
            className={classnames('compliance-row__column-report', {
              'compliance-row__column-report--valid':
                !reportOlderThanEightHours,
              'compliance-row__column-report--invalid':
                reportOlderThanEightHours,
            })}
          />
        ) : (
          <Text
            display={DISPLAY.FLEX}
            alignItems={AlignItems.center}
            marginRight={2}
            variant={TextVariant.bodyXs}
          >
            {t('na')}
          </Text>
        )}
        <InfoTooltip
          position="top"
          contentText={
            <Text variant={TextVariant.bodyXs} as="p">
              {lastReport
                ? t('complianceAnalysisRun', [
                    reportOlderThanEightHours ? t('not') : '',
                  ])
                : t('complianceAnalysisNotRun')}
            </Text>
          }
        />
      </Box>
    </Box>
  );
}

ComplianceRow.propTypes = {
  address: PropTypes.string.required,
  rowClick: PropTypes.func,
  inProgress: PropTypes.bool,
};
