///: BEGIN:ONLY_INCLUDE_IF(build-flask)
import React, { useState, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { useHistory } from 'react-router-dom';
import type { Hex } from '@metamask/utils';
import {
  Box,
  Text,
  Button,
  ButtonVariant,
  ButtonSize,
  BannerAlert,
  BannerAlertSeverity,
  IconName,
  Icon,
  IconSize,
  ButtonIcon,
} from '../../component-library';
import { Textarea } from '../../component-library/textarea';
import Spinner from '../../ui/spinner';
import {
  Display,
  FlexDirection,
  AlignItems,
  JustifyContent,
  TextVariant,
  TextColor,
  TextAlign,
  BackgroundColor,
  BorderRadius,
  BorderColor,
  IconColor,
} from '../../../helpers/constants/design-system';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { getSelectedInternalAccount, getAgentAccountSettings } from '../../../selectors';
import { getCurrentChainId } from '../../../../shared/modules/selectors/networks';
import type {
  AgentAccountSettings,
  CaveatConfig,
  AgentOutputDocument,
} from '../../../../shared/types/agent-account';
import {
  callLLM,
  parseLLMResponseToCaveats,
  generateAgentOutput,
  LLMServiceError,
  CaveatParserError,
  LLM_DEFAULTS,
} from '../../../../shared/lib/agent-account';
import type { DeleGatorEnvironment, Delegation } from '../../../../shared/lib/delegation';
import {
  createDelegation,
  ROOT_AUTHORITY,
} from '../../../../shared/lib/delegation';
import { SETTINGS_ROUTE } from '../../../helpers/constants/routes';

/**
 * Steps in the agent account creation flow
 */
enum CreationStep {
  PROMPT = 'prompt',
  PROCESSING = 'processing',
  PREVIEW = 'preview',
  SIGNING = 'signing',
  OUTPUT = 'output',
  ERROR = 'error',
}

export interface CreateAgentAccountProps {
  /** Callback when the action completes */
  onActionComplete: (confirmed: boolean, result?: unknown) => void;
}

/**
 * Generates a random private key for the agent delegate account
 */
function generateRandomPrivateKey(): Hex {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return `0x${Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')}` as Hex;
}

/**
 * Derives address from private key (simplified - in real implementation use ethers/viem)
 * For now, we generate a random address as placeholder
 */
function deriveAddressFromPrivateKey(_privateKey: Hex): Hex {
  // In real implementation, derive from private key using secp256k1
  // For now, generate a deterministic-looking address
  const bytes = new Uint8Array(20);
  crypto.getRandomValues(bytes);
  return `0x${Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')}` as Hex;
}

/**
 * Generates a random salt for delegation uniqueness
 */
function generateRandomSalt(): Hex {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return `0x${Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')}` as Hex;
}

/**
 * Mock DeleGator environment for development
 * TODO: Get actual deployed addresses from network configuration
 */
const MOCK_DELEGATOR_ENVIRONMENT: DeleGatorEnvironment = {
  DelegationManager: '0x0000000000000000000000000000000000000001' as Hex,
  EIP7702StatelessDeleGatorImpl: '0x0000000000000000000000000000000000000002' as Hex,
  EntryPoint: '0x0000000000000000000000000000000000000003' as Hex,
  SimpleFactory: '0x0000000000000000000000000000000000000004' as Hex,
  implementations: {},
  caveatEnforcers: {
    AllowedMethodsEnforcer: '0x0000000000000000000000000000000000000101' as Hex,
    AllowedTargetsEnforcer: '0x0000000000000000000000000000000000000102' as Hex,
    ERC20BalanceChangeEnforcer: '0x0000000000000000000000000000000000000103' as Hex,
    NativeBalanceChangeEnforcer: '0x0000000000000000000000000000000000000104' as Hex,
    LimitedCallsEnforcer: '0x0000000000000000000000000000000000000105' as Hex,
    RedeemerEnforcer: '0x0000000000000000000000000000000000000106' as Hex,
  },
};

/**
 * Component for creating an agent account with delegated permissions
 */
export function CreateAgentAccount({
  onActionComplete,
}: CreateAgentAccountProps) {
  const t = useI18nContext();
  const dispatch = useDispatch();
  const history = useHistory();

  // Redux state
  const selectedAccount = useSelector(getSelectedInternalAccount);
  const chainId = useSelector(getCurrentChainId) as Hex;
  const storedSettings = useSelector(getAgentAccountSettings);

  // Use stored settings or defaults
  const settings: AgentAccountSettings = storedSettings || {
    llmProvider: 'anthropic',
    apiKey: '',
    model: LLM_DEFAULTS.model,
    customBaseUrl: undefined,
  };

  // Local state
  const [step, setStep] = useState<CreationStep>(CreationStep.PROMPT);
  const [userPrompt, setUserPrompt] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);

  // LLM response data
  const [explanation, setExplanation] = useState('');
  const [caveatConfigs, setCaveatConfigs] = useState<CaveatConfig[]>([]);

  // Delegation data
  const [delegation, setDelegation] = useState<Delegation | null>(null);
  const [delegatePrivateKey, setDelegatePrivateKey] = useState<Hex | null>(null);
  const [delegateAddress, setDelegateAddress] = useState<Hex | null>(null);

  // Output
  const [outputDocument, setOutputDocument] = useState<AgentOutputDocument | null>(null);

  /**
   * Handle prompt submission
   */
  const handleSubmitPrompt = useCallback(async () => {
    if (!userPrompt.trim()) {
      setError(t('agentAccountPromptRequired'));
      return;
    }

    if (!settings.apiKey) {
      setError(t('agentAccountConfigureSettings'));
      return;
    }

    setStep(CreationStep.PROCESSING);
    setError(null);

    try {
      // Call LLM to interpret permissions
      const llmResponse = await callLLM(userPrompt, settings);

      setCaveatConfigs(llmResponse.caveats);
      setExplanation(llmResponse.explanation);
      setWarnings(llmResponse.warnings);

      setStep(CreationStep.PREVIEW);
    } catch (err) {
      const errorMessage =
        err instanceof LLMServiceError
          ? `${t('agentAccountLLMError')}: ${err.message}`
          : t('agentAccountUnexpectedError');
      setError(errorMessage);
      setStep(CreationStep.ERROR);
    }
  }, [userPrompt, settings, t]);

  /**
   * Handle confirmation of parsed permissions
   */
  const handleConfirmPermissions = useCallback(async () => {
    if (!selectedAccount?.address) {
      setError(t('agentAccountNoAccountSelected'));
      return;
    }

    setStep(CreationStep.SIGNING);
    setError(null);

    try {
      // Generate delegate account
      const privateKey = generateRandomPrivateKey();
      const address = deriveAddressFromPrivateKey(privateKey);
      setDelegatePrivateKey(privateKey);
      setDelegateAddress(address);

      // Parse caveat configs into actual caveats
      const caveats = parseLLMResponseToCaveats(
        caveatConfigs,
        MOCK_DELEGATOR_ENVIRONMENT,
      );

      // Create the delegation
      const newDelegation = createDelegation({
        delegate: address,
        delegator: selectedAccount.address as Hex,
        caveats,
        salt: generateRandomSalt(),
        authority: ROOT_AUTHORITY,
      });

      // TODO: Sign the delegation via delegation controller
      // For now, we set a placeholder signature
      const signedDelegation: Delegation = {
        ...newDelegation,
        signature: '0x' as Hex, // Placeholder - will be signed by user
      };

      setDelegation(signedDelegation);

      // Generate output document
      const output = generateAgentOutput({
        delegation: signedDelegation,
        delegateAddress: address,
        delegatePrivateKey: privateKey,
        originalPrompt: userPrompt,
        caveats,
        chainId,
        explanation,
      });

      setOutputDocument(output);
      setStep(CreationStep.OUTPUT);
    } catch (err) {
      const errorMessage =
        err instanceof CaveatParserError
          ? `${t('agentAccountCaveatError')}: ${err.message}`
          : t('agentAccountUnexpectedError');
      setError(errorMessage);
      setStep(CreationStep.ERROR);
    }
  }, [selectedAccount, caveatConfigs, userPrompt, chainId, explanation, t]);

  /**
   * Copy delegation data to clipboard
   */
  const handleCopyDelegation = useCallback(() => {
    if (outputDocument) {
      navigator.clipboard.writeText(outputDocument.delegationData);
    }
  }, [outputDocument]);

  /**
   * Copy full markdown to clipboard
   */
  const handleCopyMarkdown = useCallback(() => {
    if (outputDocument) {
      navigator.clipboard.writeText(outputDocument.markdown);
    }
  }, [outputDocument]);

  /**
   * Download output as markdown file
   */
  const handleDownload = useCallback(() => {
    if (outputDocument) {
      const blob = new Blob([outputDocument.markdown], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `agent-delegation-${Date.now()}.md`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  }, [outputDocument]);

  /**
   * Reset and start over
   */
  const handleReset = useCallback(() => {
    setStep(CreationStep.PROMPT);
    setUserPrompt('');
    setError(null);
    setWarnings([]);
    setCaveatConfigs([]);
    setExplanation('');
    setDelegation(null);
    setDelegatePrivateKey(null);
    setDelegateAddress(null);
    setOutputDocument(null);
  }, []);

  /**
   * Navigate to settings to configure LLM
   */
  const handleGoToSettings = useCallback(() => {
    history.push(SETTINGS_ROUTE);
    onActionComplete(false);
  }, [history, onActionComplete]);

  // Render step: Prompt Input
  if (step === CreationStep.PROMPT) {
    return (
      <Box
        display={Display.Flex}
        flexDirection={FlexDirection.Column}
        gap={4}
      >
        <Text variant={TextVariant.bodyMd}>
          {t('agentAccountPromptDescription')}
        </Text>

        <BannerAlert
          severity={BannerAlertSeverity.Warning}
          marginBottom={2}
        >
          {t('agentAccountAIWarning')}
        </BannerAlert>

        <Textarea
          value={userPrompt}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
            setUserPrompt(e.target.value)
          }
          placeholder={t('agentAccountPromptPlaceholder')}
          rows={4}
          data-testid="agent-account-prompt-input"
        />

        {error && (
          <Text color={TextColor.errorDefault} variant={TextVariant.bodySm}>
            {error}
          </Text>
        )}

        {!settings.apiKey && (
          <BannerAlert
            severity={BannerAlertSeverity.Info}
            actionButtonLabel={t('agentAccountGoToSettings')}
            actionButtonOnClick={handleGoToSettings}
          >
            {t('agentAccountConfigureSettings')}
          </BannerAlert>
        )}

        <Box display={Display.Flex} gap={2}>
          <Button
            variant={ButtonVariant.Secondary}
            size={ButtonSize.Lg}
            onClick={() => onActionComplete(false)}
            block
          >
            {t('cancel')}
          </Button>
          <Button
            variant={ButtonVariant.Primary}
            size={ButtonSize.Lg}
            onClick={handleSubmitPrompt}
            disabled={!userPrompt.trim() || !settings.apiKey}
            block
            data-testid="agent-account-submit-prompt"
          >
            {t('agentAccountGeneratePermissions')}
          </Button>
        </Box>
      </Box>
    );
  }

  // Render step: Processing (LLM call)
  if (step === CreationStep.PROCESSING) {
    return (
      <Box
        display={Display.Flex}
        flexDirection={FlexDirection.Column}
        alignItems={AlignItems.center}
        justifyContent={JustifyContent.center}
        gap={4}
        padding={6}
      >
        <Spinner color="var(--color-primary-default)" />
        <Text
          variant={TextVariant.headingSm}
          textAlign={TextAlign.center}
        >
          {t('agentAccountProcessing')}
        </Text>
        <Text
          variant={TextVariant.bodySm}
          color={TextColor.textAlternative}
          textAlign={TextAlign.center}
        >
          {t('agentAccountProcessingDescription')}
        </Text>
      </Box>
    );
  }

  // Render step: Preview parsed permissions
  if (step === CreationStep.PREVIEW) {
    return (
      <Box
        display={Display.Flex}
        flexDirection={FlexDirection.Column}
        gap={4}
      >
        <Text variant={TextVariant.headingSm}>
          {t('agentAccountPermissionPreview')}
        </Text>

        <Box
          backgroundColor={BackgroundColor.backgroundAlternative}
          borderRadius={BorderRadius.MD}
          padding={3}
        >
          <Text variant={TextVariant.bodySmBold} marginBottom={2}>
            {t('agentAccountExplanation')}
          </Text>
          <Text variant={TextVariant.bodySm}>{explanation}</Text>
        </Box>

        {warnings.length > 0 && (
          <BannerAlert severity={BannerAlertSeverity.Warning}>
            <Text variant={TextVariant.bodySmBold} marginBottom={1}>
              {t('agentAccountWarnings')}
            </Text>
            {warnings.map((warning, index) => (
              <Text key={index} variant={TextVariant.bodySm}>
                {warning}
              </Text>
            ))}
          </BannerAlert>
        )}

        <Box>
          <Text variant={TextVariant.bodySmBold} marginBottom={2}>
            {t('agentAccountCaveats')} ({caveatConfigs.length})
          </Text>
          {caveatConfigs.length === 0 ? (
            <BannerAlert severity={BannerAlertSeverity.Danger}>
              {t('agentAccountNoCaveats')}
            </BannerAlert>
          ) : (
            <Box
              display={Display.Flex}
              flexDirection={FlexDirection.Column}
              gap={2}
            >
              {caveatConfigs.map((caveat, index) => (
                <Box
                  key={index}
                  backgroundColor={BackgroundColor.backgroundDefault}
                  borderColor={BorderColor.borderMuted}
                  borderRadius={BorderRadius.MD}
                  padding={3}
                  style={{ borderWidth: '1px', borderStyle: 'solid' }}
                >
                  <Text variant={TextVariant.bodySmBold}>
                    {caveat.type}
                  </Text>
                  <Text
                    variant={TextVariant.bodySm}
                    color={TextColor.textAlternative}
                  >
                    {JSON.stringify(caveat.params, null, 2)}
                  </Text>
                </Box>
              ))}
            </Box>
          )}
        </Box>

        <Box display={Display.Flex} gap={2}>
          <Button
            variant={ButtonVariant.Secondary}
            size={ButtonSize.Lg}
            onClick={handleReset}
            block
          >
            {t('agentAccountEditPrompt')}
          </Button>
          <Button
            variant={ButtonVariant.Primary}
            size={ButtonSize.Lg}
            onClick={handleConfirmPermissions}
            block
            data-testid="agent-account-confirm-permissions"
          >
            {t('agentAccountConfirmAndSign')}
          </Button>
        </Box>
      </Box>
    );
  }

  // Render step: Signing
  if (step === CreationStep.SIGNING) {
    return (
      <Box
        display={Display.Flex}
        flexDirection={FlexDirection.Column}
        alignItems={AlignItems.center}
        justifyContent={JustifyContent.center}
        gap={4}
        padding={6}
      >
        <Spinner color="var(--color-primary-default)" />
        <Text
          variant={TextVariant.headingSm}
          textAlign={TextAlign.center}
        >
          {t('agentAccountSigning')}
        </Text>
        <Text
          variant={TextVariant.bodySm}
          color={TextColor.textAlternative}
          textAlign={TextAlign.center}
        >
          {t('agentAccountSigningDescription')}
        </Text>
      </Box>
    );
  }

  // Render step: Output
  if (step === CreationStep.OUTPUT && outputDocument) {
    return (
      <Box
        display={Display.Flex}
        flexDirection={FlexDirection.Column}
        gap={4}
      >
        <BannerAlert severity={BannerAlertSeverity.Success}>
          {t('agentAccountCreated')}
        </BannerAlert>

        <Box>
          <Text variant={TextVariant.bodySmBold} marginBottom={2}>
            {t('agentAccountDelegateAddress')}
          </Text>
          <Box
            backgroundColor={BackgroundColor.backgroundAlternative}
            borderRadius={BorderRadius.MD}
            padding={2}
            display={Display.Flex}
            alignItems={AlignItems.center}
            justifyContent={JustifyContent.spaceBetween}
          >
            <Text
              variant={TextVariant.bodySm}
              style={{
                fontFamily: 'monospace',
                wordBreak: 'break-all',
              }}
            >
              {delegateAddress}
            </Text>
            <ButtonIcon
              iconName={IconName.Copy}
              ariaLabel={t('copy')}
              onClick={() =>
                delegateAddress &&
                navigator.clipboard.writeText(delegateAddress)
              }
            />
          </Box>
        </Box>

        <Box display={Display.Flex} gap={2}>
          <Button
            variant={ButtonVariant.Secondary}
            size={ButtonSize.Md}
            onClick={handleCopyDelegation}
            startIconName={IconName.Copy}
            block
          >
            {t('agentAccountCopyDelegation')}
          </Button>
          <Button
            variant={ButtonVariant.Secondary}
            size={ButtonSize.Md}
            onClick={handleCopyMarkdown}
            startIconName={IconName.Copy}
            block
          >
            {t('agentAccountCopyMarkdown')}
          </Button>
        </Box>

        <Button
          variant={ButtonVariant.Primary}
          size={ButtonSize.Lg}
          onClick={handleDownload}
          startIconName={IconName.Download}
          block
          data-testid="agent-account-download"
        >
          {t('agentAccountDownload')}
        </Button>

        <Box
          backgroundColor={BackgroundColor.backgroundAlternative}
          borderRadius={BorderRadius.MD}
          padding={3}
          style={{ maxHeight: '200px', overflow: 'auto' }}
        >
          <Text
            variant={TextVariant.bodySm}
            style={{ fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}
          >
            {outputDocument.markdown.slice(0, 1000)}
            {outputDocument.markdown.length > 1000 && '...'}
          </Text>
        </Box>

        <Button
          variant={ButtonVariant.Primary}
          size={ButtonSize.Lg}
          onClick={() => onActionComplete(true)}
          block
        >
          {t('done')}
        </Button>
      </Box>
    );
  }

  // Render step: Error
  if (step === CreationStep.ERROR) {
    return (
      <Box
        display={Display.Flex}
        flexDirection={FlexDirection.Column}
        alignItems={AlignItems.center}
        gap={4}
        padding={4}
      >
        <Icon
          name={IconName.Danger}
          size={IconSize.Xl}
          color={IconColor.errorDefault}
        />
        <Text
          variant={TextVariant.headingSm}
          textAlign={TextAlign.center}
        >
          {t('agentAccountError')}
        </Text>
        {error && (
          <Text
            variant={TextVariant.bodySm}
            color={TextColor.errorDefault}
            textAlign={TextAlign.center}
          >
            {error}
          </Text>
        )}
        <Button
          variant={ButtonVariant.Primary}
          size={ButtonSize.Lg}
          onClick={handleReset}
          block
        >
          {t('tryAgain')}
        </Button>
      </Box>
    );
  }

  // Fallback
  return null;
}
///: END:ONLY_INCLUDE_IF
