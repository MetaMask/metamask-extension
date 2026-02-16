import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { AccountWalletId, AccountWalletType } from '@metamask/account-api';
import type { Custodian } from '../../../store/controller-actions/mpc-controller';
import {
  Box,
  Button,
  ButtonIcon,
  ButtonIconSize,
  ButtonSize,
  ButtonVariant,
  Icon,
  IconName,
  IconSize,
  Text,
} from '../../../components/component-library';
import {
  Content,
  Header,
  Page,
} from '../../../components/multichain/pages/page';
import {
  AlignItems,
  BackgroundColor,
  BorderRadius,
  Display,
  FlexDirection,
  IconColor,
  TextColor,
  TextVariant,
} from '../../../helpers/constants/design-system';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { getWallet } from '../../../selectors/multichain-accounts/account-tree';
import {
  ACCOUNT_LIST_PAGE_ROUTE,
  PREVIOUS_ROUTE,
} from '../../../helpers/constants/routes';
import {
  getMpcCustodians,
  getMpcCustodianId,
  createMpcJoinData,
  addMpcCustodian,
} from '../../../store/controller-actions/mpc-controller';
import type { MetaMaskReduxDispatch } from '../../../store/store';

export const MpcWalletManagementPage = () => {
  const t = useI18nContext();
  const navigate = useNavigate();
  const dispatch = useDispatch<MetaMaskReduxDispatch>();
  const { id } = useParams();

  const walletId = decodeURIComponent(id ?? '') as AccountWalletId;
  const wallet = useSelector((state) => getWallet(state, walletId));

  const [custodians, setCustodians] = useState<Custodian[]>([]);
  const [selfCustodianId, setSelfCustodianId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Add custodian flow state
  const [joinData, setJoinData] = useState<string | null>(null);
  const [isGeneratingJoinData, setIsGeneratingJoinData] = useState(false);
  const [isAddingCustodian, setIsAddingCustodian] = useState(false);

  const keyringId =
    wallet?.type === AccountWalletType.Keyring
      ? wallet.metadata.keyring.id
      : undefined;

  const fetchCustodians = useCallback(async () => {
    if (!keyringId) {
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const [result, selfId] = await Promise.all([
        dispatch(getMpcCustodians(keyringId)),
        dispatch(getMpcCustodianId(keyringId)),
      ]);
      setCustodians(result);
      setSelfCustodianId(selfId);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to load custodians',
      );
    } finally {
      setLoading(false);
    }
  }, [dispatch, keyringId]);

  useEffect(() => {
    if (!wallet) {
      navigate(ACCOUNT_LIST_PAGE_ROUTE);
      return;
    }
    fetchCustodians();
  }, [wallet, navigate, fetchCustodians]);

  const handleGenerateJoinData = useCallback(async () => {
    if (!keyringId) {
      return;
    }
    setIsGeneratingJoinData(true);
    setError(null);
    try {
      const data = await dispatch(createMpcJoinData(keyringId));
      setJoinData(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to generate join data',
      );
    } finally {
      setIsGeneratingJoinData(false);
    }
  }, [dispatch, keyringId]);

  const handleAddCustodian = useCallback(async () => {
    if (!keyringId || !joinData) {
      return;
    }
    setIsAddingCustodian(true);
    setError(null);
    try {
      await dispatch(addMpcCustodian(keyringId, joinData));
      setJoinData(null);
      await fetchCustodians();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add custodian');
    } finally {
      setIsAddingCustodian(false);
    }
  }, [dispatch, keyringId, joinData, fetchCustodians]);

  const getCustodianIcon = (type: 'cloud' | 'user') => {
    return type === 'cloud' ? IconName.Cloud : IconName.User;
  };

  const getCustodianLabel = (type: 'cloud' | 'user') => {
    return type === 'cloud' ? t('cloud') : t('user');
  };

  return (
    <Page className="mpc-wallet-management-page">
      <Header
        textProps={{
          variant: TextVariant.headingSm,
        }}
        startAccessory={
          <ButtonIcon
            size={ButtonIconSize.Md}
            ariaLabel={t('back')}
            iconName={IconName.ArrowLeft}
            onClick={() => navigate(PREVIOUS_ROUTE)}
            data-testid="back-button"
          />
        }
      >
        {wallet?.metadata.name ?? t('manageMpcWallet')}
      </Header>
      <Content paddingTop={3}>
        <Box
          display={Display.Flex}
          flexDirection={FlexDirection.Column}
          gap={3}
        >
          <Text variant={TextVariant.headingSm} color={TextColor.textDefault}>
            {t('custodians')}
          </Text>

          {selfCustodianId && (
            <Box
              backgroundColor={BackgroundColor.backgroundMuted}
              borderRadius={BorderRadius.LG}
              padding={4}
            >
              <Text
                variant={TextVariant.bodySm}
                color={TextColor.textAlternative}
                marginBottom={1}
              >
                {t('yourCustodianId')}
              </Text>
              <Text
                variant={TextVariant.bodyMdMedium}
                color={TextColor.textDefault}
                style={{ wordBreak: 'break-all' }}
              >
                {selfCustodianId}
              </Text>
            </Box>
          )}

          {loading && (
            <Text
              variant={TextVariant.bodySm}
              color={TextColor.textAlternative}
            >
              {t('loading')}
            </Text>
          )}

          {error && (
            <Text variant={TextVariant.bodySm} color={TextColor.errorDefault}>
              {error}
            </Text>
          )}

          {!loading && custodians.length === 0 && !error && (
            <Text
              variant={TextVariant.bodySm}
              color={TextColor.textAlternative}
            >
              {t('noCustodians')}
            </Text>
          )}

          {!loading && custodians.length > 0 && (
            <Box
              display={Display.Flex}
              flexDirection={FlexDirection.Column}
              backgroundColor={BackgroundColor.backgroundMuted}
              borderRadius={BorderRadius.LG}
            >
              {custodians.map((custodian, index) => (
                <Box
                  key={custodian.partyId}
                  display={Display.Flex}
                  alignItems={AlignItems.center}
                  padding={4}
                  gap={3}
                  style={
                    index < custodians.length - 1
                      ? { borderBottom: '1px solid var(--color-border-muted)' }
                      : undefined
                  }
                >
                  <Icon
                    name={getCustodianIcon(custodian.type)}
                    size={IconSize.Md}
                    color={IconColor.iconAlternative}
                  />
                  <Box
                    display={Display.Flex}
                    flexDirection={FlexDirection.Column}
                    style={{ flex: 1, minWidth: 0 }}
                  >
                    <Text
                      variant={TextVariant.bodyMdMedium}
                      color={TextColor.textDefault}
                      ellipsis
                    >
                      {custodian.partyId}
                    </Text>
                    <Text
                      variant={TextVariant.bodySm}
                      color={TextColor.textAlternative}
                    >
                      {getCustodianLabel(custodian.type)}
                    </Text>
                  </Box>
                </Box>
              ))}
            </Box>
          )}

          {/* Add custodian section */}
          <Box
            display={Display.Flex}
            flexDirection={FlexDirection.Column}
            gap={2}
            marginTop={2}
          >
            <Text variant={TextVariant.headingSm} color={TextColor.textDefault}>
              {t('addCustodian')}
            </Text>

            {joinData ? (
              <>
                <Text
                  variant={TextVariant.bodySm}
                  color={TextColor.textAlternative}
                >
                  {t('joinDataDescription')}
                </Text>
                <Box
                  backgroundColor={BackgroundColor.backgroundMuted}
                  borderRadius={BorderRadius.LG}
                  padding={4}
                >
                  <Text
                    variant={TextVariant.bodySm}
                    color={TextColor.textDefault}
                    style={{ wordBreak: 'break-all' }}
                  >
                    {joinData}
                  </Text>
                </Box>
                <Button
                  size={ButtonSize.Md}
                  variant={ButtonVariant.Primary}
                  onClick={handleAddCustodian}
                  disabled={isAddingCustodian}
                  data-testid="add-custodian-button"
                  block
                >
                  {isAddingCustodian
                    ? t('waitingForCustodian')
                    : t('addCustodian')}
                </Button>
              </>
            ) : (
              <Button
                size={ButtonSize.Md}
                variant={ButtonVariant.Primary}
                onClick={handleGenerateJoinData}
                disabled={isGeneratingJoinData}
                data-testid="generate-join-data-button"
                block
              >
                {isGeneratingJoinData
                  ? t('generatingJoinData')
                  : t('generateJoinData')}
              </Button>
            )}
          </Box>
        </Box>
      </Content>
    </Page>
  );
};
