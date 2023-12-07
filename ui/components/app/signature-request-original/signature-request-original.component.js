import React, { Component } from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import { ObjectInspector } from 'react-inspector';
import { ethErrors, serializeError } from 'eth-rpc-errors';
///: BEGIN:ONLY_INCLUDE_IF(snaps)
import { SubjectType } from '@metamask/permission-controller';
///: END:ONLY_INCLUDE_IF
import LedgerInstructionField from '../ledger-instruction-field';
import { MESSAGE_TYPE } from '../../../../shared/constants/app';
import {
  getURLHostName,
  sanitizeString,
  ///: BEGIN:ONLY_INCLUDE_IF(build-mmi)
  shortenAddress,
  ///: END:ONLY_INCLUDE_IF
} from '../../../helpers/utils/util';
import { stripHexPrefix } from '../../../../shared/modules/hexstring-utils';
import { isSuspiciousResponse } from '../../../../shared/modules/security-provider.utils';
import SiteOrigin from '../../ui/site-origin';
import Typography from '../../ui/typography/typography';
import { PageContainerFooter } from '../../ui/page-container';
import {
  TypographyVariant,
  FontWeight,
  TextAlign,
  TextColor,
  Size,
  ///: BEGIN:ONLY_INCLUDE_IF(build-mmi)
  IconColor,
  Display,
  BlockSize,
  TextVariant,
  BackgroundColor,
  ///: END:ONLY_INCLUDE_IF
} from '../../../helpers/constants/design-system';
import {
  ButtonLink,
  ///: BEGIN:ONLY_INCLUDE_IF(build-mmi)
  Box,
  Icon,
  IconName,
  Text,
  ///: END:ONLY_INCLUDE_IF
} from '../../component-library';
///: BEGIN:ONLY_INCLUDE_IF(blockaid)
import BlockaidBannerAlert from '../security-provider-banner-alert/blockaid-banner-alert/blockaid-banner-alert';
///: END:ONLY_INCLUDE_IF
import ConfirmPageContainerNavigation from '../confirm-page-container/confirm-page-container-navigation';
import SecurityProviderBannerMessage from '../security-provider-banner-message/security-provider-banner-message';

import SignatureRequestHeader from '../signature-request-header';
///: BEGIN:ONLY_INCLUDE_IF(snaps)
import SnapLegacyAuthorshipHeader from '../snaps/snap-legacy-authorship-header';
///: END:ONLY_INCLUDE_IF
import SignatureRequestOriginalWarning from './signature-request-original-warning';

export default class SignatureRequestOriginal extends Component {
  static contextTypes = {
    t: PropTypes.func.isRequired,
    trackEvent: PropTypes.func,
  };

  static propTypes = {
    fromAccount: PropTypes.shape({
      address: PropTypes.string.isRequired,
      name: PropTypes.string,
    }).isRequired,
    txData: PropTypes.object.isRequired,
    subjectMetadata: PropTypes.object,
    hardwareWalletRequiresConnection: PropTypes.bool,
    isLedgerWallet: PropTypes.bool,
    messagesCount: PropTypes.number,
    showRejectTransactionsConfirmationModal: PropTypes.func.isRequired,
    cancelAllApprovals: PropTypes.func.isRequired,
    rejectPendingApproval: PropTypes.func.isRequired,
    clearConfirmTransaction: PropTypes.func.isRequired,
    history: PropTypes.object.isRequired,
    mostRecentOverviewPage: PropTypes.string.isRequired,
    resolvePendingApproval: PropTypes.func.isRequired,
    completedTx: PropTypes.func.isRequired,
    ///: BEGIN:ONLY_INCLUDE_IF(build-mmi)
    // Used to show a warning if the signing account is not the selected account
    // Largely relevant for contract wallet custodians
    selectedAccount: PropTypes.object,
    mmiOnSignCallback: PropTypes.func,
    ///: END:ONLY_INCLUDE_IF
  };

  state = {
    showSignatureRequestWarning: false,
  };

  msgHexToText = (hex) => {
    try {
      const stripped = stripHexPrefix(hex);
      const buff = Buffer.from(stripped, 'hex');
      return buff.length === 32 ? hex : buff.toString('utf8');
    } catch (e) {
      return hex;
    }
  };

  renderTypedData = (data) => {
    const { t } = this.context;
    const { domain, message } = JSON.parse(data);
    return (
      <div className="request-signature__typed-container">
        {domain ? (
          <div>
            <h1>{t('domain')}</h1>
            <ObjectInspector data={domain} expandLevel={1} name="domain" />
          </div>
        ) : (
          ''
        )}
        {message ? (
          <div>
            <h1>{t('message')}</h1>
            <ObjectInspector data={message} expandLevel={1} name="message" />
          </div>
        ) : (
          ''
        )}
      </div>
    );
  };

  renderBody = () => {
    let rows;
    const notice = `${this.context.t('youSign')}:`;

    const { txData, subjectMetadata } = this.props;
    const {
      type,
      msgParams: { data },
    } = txData;

    if (type === MESSAGE_TYPE.PERSONAL_SIGN) {
      rows = [
        { name: this.context.t('message'), value: this.msgHexToText(data) },
      ];
    } else if (type === MESSAGE_TYPE.ETH_SIGN_TYPED_DATA) {
      rows = data;
    } else if (type === MESSAGE_TYPE.ETH_SIGN) {
      rows = [{ name: this.context.t('message'), value: data }];
    }

    const targetSubjectMetadata = txData.msgParams.origin
      ? subjectMetadata?.[txData.msgParams.origin]
      : null;

    return (
      <div className="request-signature__body">
        {
          ///: BEGIN:ONLY_INCLUDE_IF(blockaid)
          <BlockaidBannerAlert
            securityAlertResponse={txData?.securityAlertResponse}
            margin={4}
          />
          ///: END:ONLY_INCLUDE_IF
        }
        {isSuspiciousResponse(txData?.securityProviderResponse) && (
          <SecurityProviderBannerMessage
            securityProviderResponse={txData.securityProviderResponse}
          />
        )}
        {
          ///: BEGIN:ONLY_INCLUDE_IF(build-mmi)
          this.props.selectedAccount.address ===
          this.props.fromAccount.address ? null : (
            <Box
              className="request-signature__mismatch-info"
              Display={Display.Flex}
              width={BlockSize.Full}
              padding={4}
              marginBottom={4}
              backgroundColor={BackgroundColor.primaryMuted}
            >
              <Icon
                name={IconName.Info}
                color={IconColor.infoDefault}
                marginRight={2}
              />
              <Text variant={TextVariant.bodyXs} color={TextColor.textDefault}>
                {this.context.t('mismatchAccount', [
                  shortenAddress(this.props.selectedAccount.address),
                  shortenAddress(this.props.fromAccount.address),
                ])}
              </Text>
            </Box>
          )
          ///: END:ONLY_INCLUDE_IF
        }
        <div className="request-signature__origin">
          {
            // Use legacy authorship header for snaps
            ///: BEGIN:ONLY_INCLUDE_IF(snaps)
            targetSubjectMetadata?.subjectType === SubjectType.Snap ? (
              <SnapLegacyAuthorshipHeader
                snapId={targetSubjectMetadata.origin}
                marginLeft={4}
                marginRight={4}
              />
            ) : (
              ///: END:ONLY_INCLUDE_IF
              <SiteOrigin
                title={txData.msgParams.origin}
                siteOrigin={txData.msgParams.origin}
                iconSrc={targetSubjectMetadata?.iconUrl}
                iconName={
                  getURLHostName(targetSubjectMetadata?.origin) ||
                  targetSubjectMetadata?.origin
                }
                chip
              />
              ///: BEGIN:ONLY_INCLUDE_IF(snaps)
            )
            ///: END:ONLY_INCLUDE_IF
          }
        </div>
        <Typography
          className="request-signature__content__title"
          variant={TypographyVariant.H3}
          fontWeight={FontWeight.Bold}
        >
          {this.context.t('sigRequest')}
        </Typography>
        <Typography
          className="request-signature__content__subtitle"
          variant={TypographyVariant.H7}
          color={TextColor.textAlternative}
          align={TextAlign.Center}
          margin={12}
          marginTop={3}
        >
          {this.context.t('signatureRequestGuidance')}
        </Typography>
        <div className={classnames('request-signature__notice')}>{notice}</div>
        <div className="request-signature__rows">
          {rows.map(({ name, value }, index) => {
            if (typeof value === 'boolean') {
              // eslint-disable-next-line no-param-reassign
              value = value.toString();
            }
            return (
              <div
                className="request-signature__row"
                key={`request-signature-row-${index}`}
              >
                <div className="request-signature__row-title">
                  {sanitizeString(`${name}:`)}
                </div>
                <div className="request-signature__row-value">
                  {sanitizeString(value)}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  onSubmit = async () => {
    const {
      resolvePendingApproval,
      completedTx,
      clearConfirmTransaction,
      history,
      mostRecentOverviewPage,
      txData,
    } = this.props;
    ///: BEGIN:ONLY_INCLUDE_IF(build-mmi)
    if (this.props.mmiOnSignCallback) {
      await this.props.mmiOnSignCallback(txData);
      return;
    }
    ///: END:ONLY_INCLUDE_IF

    await resolvePendingApproval(txData.id);
    completedTx(txData.id);
    clearConfirmTransaction();
    history.push(mostRecentOverviewPage);
  };

  onCancel = async () => {
    const {
      clearConfirmTransaction,
      history,
      mostRecentOverviewPage,
      rejectPendingApproval,
      txData: { id },
    } = this.props;

    await rejectPendingApproval(
      id,
      serializeError(ethErrors.provider.userRejectedRequest()),
    );
    clearConfirmTransaction();
    history.push(mostRecentOverviewPage);
  };

  renderFooter = () => {
    const {
      clearConfirmTransaction,
      history,
      mostRecentOverviewPage,
      txData,
      hardwareWalletRequiresConnection,
      rejectPendingApproval,
      resolvePendingApproval,
    } = this.props;
    const { t } = this.context;

    return (
      <PageContainerFooter
        cancelText={t('reject')}
        submitText={t('sign')}
        onCancel={async () => {
          await rejectPendingApproval(
            txData.id,
            serializeError(ethErrors.provider.userRejectedRequest()),
          );
          clearConfirmTransaction();
          history.push(mostRecentOverviewPage);
        }}
        onSubmit={async () => {
          if (txData.type === MESSAGE_TYPE.ETH_SIGN) {
            this.setState({ showSignatureRequestWarning: true });
          } else {
            ///: BEGIN:ONLY_INCLUDE_IF(build-mmi)
            if (this.props.mmiOnSignCallback) {
              await this.props.mmiOnSignCallback(txData);
              return;
            }
            ///: END:ONLY_INCLUDE_IF

            await resolvePendingApproval(txData.id);
            clearConfirmTransaction();
            history.push(mostRecentOverviewPage);
          }
        }}
        disabled={
          ///: BEGIN:ONLY_INCLUDE_IF(build-mmi)
          Boolean(txData?.custodyId) ||
          ///: END:ONLY_INCLUDE_IF
          hardwareWalletRequiresConnection
        }
      />
    );
  };

  handleCancelAll = () => {
    const {
      clearConfirmTransaction,
      history,
      mostRecentOverviewPage,
      showRejectTransactionsConfirmationModal,
      messagesCount,
      cancelAllApprovals,
    } = this.props;
    const unapprovedTxCount = messagesCount;

    showRejectTransactionsConfirmationModal({
      unapprovedTxCount,
      onSubmit: async () => {
        await cancelAllApprovals();
        clearConfirmTransaction();
        history.push(mostRecentOverviewPage);
      },
    });
  };

  render = () => {
    const {
      messagesCount,
      fromAccount: { address, name },
      txData,
    } = this.props;
    const { showSignatureRequestWarning } = this.state;
    const { t } = this.context;

    const rejectNText = t('rejectRequestsN', [messagesCount]);

    return (
      <div className="request-signature__container">
        <div className="request-signature__navigation">
          <ConfirmPageContainerNavigation />
        </div>
        <div className="request-signature__account">
          <SignatureRequestHeader txData={txData} />
        </div>
        {this.renderBody()}
        {this.props.isLedgerWallet ? (
          <div className="confirm-approve-content__ledger-instruction-wrapper">
            <LedgerInstructionField showDataInstruction />
          </div>
        ) : null}
        {showSignatureRequestWarning && (
          <SignatureRequestOriginalWarning
            senderAddress={address}
            name={name}
            onSubmit={async (event) => await this.onSubmit(event)}
            onCancel={async (event) => await this.onCancel(event)}
          />
        )}
        {this.renderFooter()}
        {messagesCount > 1 ? (
          <ButtonLink
            size={Size.inherit}
            className="request-signature__container__reject"
            onClick={() => this.handleCancelAll()}
          >
            {rejectNText}
          </ButtonLink>
        ) : null}
      </div>
    );
  };
}
