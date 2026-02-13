import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { AccountWalletId } from '@metamask/account-api';
import type { MpcCustodian } from '../../../store/controller-actions/mpc-controller';
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
  TextField,
  TextFieldType,
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

  const [custodians, setCustodians] = useState<MpcCustodian[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newPeerId, setNewPeerId] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  // Extract keyring ID from wallet metadata
  const keyringId = (wallet?.metadata as { keyring?: { id?: string } })?.keyring
    ?.id;

  const fetchCustodians = useCallback(async () => {
    if (!keyringId) {
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const result = await dispatch(getMpcCustodians(keyringId));
      setCustodians(result);
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

  const handleAddCustodian = useCallback(async () => {
    if (!keyringId || !newPeerId.trim()) {
      return;
    }
    setIsAdding(true);
    try {
      await dispatch(addMpcCustodian(keyringId, newPeerId.trim()));
      setNewPeerId('');
      await fetchCustodians();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to add custodian',
      );
    } finally {
      setIsAdding(false);
    }
  }, [dispatch, keyringId, newPeerId, fetchCustodians]);

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
        {/* Custodians section */}
        <Box
          display={Display.Flex}
          flexDirection={FlexDirection.Column}
          gap={3}
        >
          <Text variant={TextVariant.headingSm} color={TextColor.textDefault}>
            {t('custodians')}
          </Text>

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
                  key={custodian.id}
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
                      {custodian.id}
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
            <Text
              variant={TextVariant.headingSm}
              color={TextColor.textDefault}
            >
              {t('addCustodian')}
            </Text>
            <TextField
              type={TextFieldType.Text}
              placeholder={t('enterPeerId')}
              value={newPeerId}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setNewPeerId(e.target.value)
              }
              data-testid="add-custodian-input"
            />
            <Button
              size={ButtonSize.Md}
              variant={ButtonVariant.Primary}
              onClick={handleAddCustodian}
              disabled={isAdding || !newPeerId.trim()}
              data-testid="add-custodian-button"
              block
            >
              {isAdding ? t('adding') : t('add')}
            </Button>
          </Box>
        </Box>
      </Content>
    </Page>
  );
};
