import React, { Dispatch, SetStateAction, useContext } from 'react';
import { useDispatch } from 'react-redux';
import {
  Text,
  Box,
  ButtonIcon,
  IconName,
  ButtonIconSize,
  Button,
  ButtonVariant,
  ButtonSize,
} from '../../../components/component-library';

import {
  Display,
  AlignItems,
  FlexDirection,
  BlockSize,
  IconColor,
} from '../../../helpers/constants/design-system';
import { mmiActionsFactory } from '../../../store/institutional/institution-background';
import { useI18nContext } from '../../../hooks/useI18nContext';
import JwtUrlForm from '../../../components/institutional/jwt-url-form';
import PulseLoader from '../../../components/ui/pulse-loader';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../shared/constants/metametrics';
import { MetaMetricsContext } from '../../../contexts/metametrics';
import { Account } from '../custody/custody';

type ManualConnectCustodianProps = {
  cancelConnectCustodianToken: () => void;
  custodianImage: string | null;
  custodianDisplayName: string;
  jwtList: string[];
  token: string;
  setCurrentJwt: (jwt: string) => void;
  loading: boolean;
  setConnectError: (error: string) => void;
  custodianName: string;
  custodianType: string;
  addNewTokenClicked: boolean;
  handleConnectError: (e: Error) => void;
  setAccounts: Dispatch<SetStateAction<Account[] | undefined | null>>;
  removeConnectRequest: () => void;
  connectRequest?: object;
};

const ManualConnectCustodian: React.FC<ManualConnectCustodianProps> = ({
  custodianImage,
  custodianDisplayName,
  jwtList = [],
  token = '',
  loading,
  custodianName,
  custodianType,
  addNewTokenClicked,
  connectRequest,
  setCurrentJwt,
  setConnectError,
  handleConnectError,
  setAccounts,
  removeConnectRequest,
  cancelConnectCustodianToken,
}) => {
  const t = useI18nContext();
  const dispatch = useDispatch();
  const mmiActions = mmiActionsFactory();
  const trackEvent = useContext(MetaMetricsContext);

  const connectCustodian = async () => {
    try {
      setConnectError('');
      let accountsValue: Account[] = [];
      if (token || (jwtList.length > 0 && jwtList[0])) {
        accountsValue = (await dispatch(
          mmiActions.getCustodianAccounts(
            token || jwtList[0],
            custodianName,
            custodianType,
            true,
          ),
        )) as unknown as Account[];
      }

      setAccounts(accountsValue);
      await removeConnectRequest();
      trackEvent({
        category: MetaMetricsEventCategory.MMI,
        event: MetaMetricsEventName.CustodianConnected,
        properties: {
          custodian: custodianName,
          rpc: Boolean(connectRequest),
        },
      });
    } catch (e) {
      handleConnectError(e as Error);
    }
  };

  return (
    <>
      <Box
        padding={4}
        display={Display.Flex}
        flexDirection={FlexDirection.Column}
        className="page-container__content"
        width={BlockSize.Full}
      >
        {window.innerWidth > 400 && (
          <Box
            display={Display.Flex}
            alignItems={AlignItems.center}
            marginBottom={4}
            marginTop={4}
          >
            <ButtonIcon
              data-testid="manual-connect-custodian-back-button"
              ariaLabel={t('back')}
              iconName={IconName.ArrowLeft}
              size={ButtonIconSize.Sm}
              color={IconColor.iconDefault}
              onClick={cancelConnectCustodianToken}
              display={[Display.Flex]}
            />
            <Text>{t('back')}</Text>
          </Box>
        )}
        {custodianImage && (
          <Box display={Display.Flex} alignItems={AlignItems.center}>
            <img
              width={32}
              height={32}
              src={custodianImage}
              alt={custodianDisplayName}
            />
            <Text as="h4" marginLeft={2}>
              {custodianDisplayName}
            </Text>
          </Box>
        )}
        <Text marginTop={4}>
          {t('enterCustodianToken', [custodianDisplayName])}
        </Text>
        <Box paddingBottom={7}>
          <JwtUrlForm
            jwtList={jwtList}
            currentJwt={token}
            onJwtChange={(jwt) => setCurrentJwt(jwt)}
            jwtInputText={t('pasteJWTToken')}
          />
        </Box>
      </Box>
      <Box as="footer" className="page-container__footer" padding={4}>
        {loading ? (
          <PulseLoader />
        ) : (
          <Box display={Display.Flex} gap={4}>
            <Button
              data-testid="custody-cancel-button"
              block
              variant={ButtonVariant.Secondary}
              size={ButtonSize.Lg}
              onClick={cancelConnectCustodianToken}
            >
              {t('cancel')}
            </Button>
            <Button
              block
              data-testid="jwt-form-connect-button"
              size={ButtonSize.Lg}
              onClick={connectCustodian}
              disabled={!custodianName || (addNewTokenClicked && !token)}
            >
              {t('connect')}
            </Button>
          </Box>
        )}
      </Box>
    </>
  );
};

export default ManualConnectCustodian;
