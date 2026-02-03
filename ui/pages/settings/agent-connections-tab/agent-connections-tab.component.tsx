import React, { useCallback, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  Box,
  Text,
  Button,
  ButtonVariant,
  Icon,
  IconName,
  IconSize,
  Banner,
  BannerAlert,
  BannerAlertSeverity,
} from '../../../components/component-library';
import {
  Display,
  FlexDirection,
  AlignItems,
  JustifyContent,
  TextVariant,
  TextColor,
  BorderRadius,
  BackgroundColor,
} from '../../../helpers/constants/design-system';
import { useI18nContext } from '../../../hooks/useI18nContext';

// Types
type Agent = {
  id: string;
  name: string;
  publicKey: string;
  permissions: {
    spendLimit: { daily: string; perTx: string };
    allowedChains: number[];
    allowedProtocols: string[];
    requireApproval: { above: string; methods: string[] };
    expiresAt: number | null;
  };
  createdAt: number;
  lastUsed: number;
  active: boolean;
};

type PendingApproval = {
  id: string;
  agentId: string;
  requestId: string;
  txDetails: {
    to: string;
    value: string;
    data: string;
    chainId: number;
    decodedMethod?: string;
    estimatedUsdValue?: string;
  };
  createdAt: number;
  expiresAt: number;
};

// Selectors (would be in selectors file)
const selectAgents = (state: any): Agent[] => 
  Object.values(state.metamask.AgentController?.agents || {});

const selectPendingApprovals = (state: any): PendingApproval[] =>
  Object.values(state.metamask.AgentController?.pendingApprovals || {});

// Helpers
const formatUsd = (value: string): string => {
  const dollars = parseInt(value, 10) / 1e6;
  return `$${dollars.toFixed(2)}`;
};

const formatDate = (ts: number): string => new Date(ts).toLocaleDateString();

const getChainName = (chainId: number): string => {
  const chains: Record<number, string> = {
    1: 'Ethereum',
    137: 'Polygon',
    42161: 'Arbitrum',
    10: 'Optimism',
    8453: 'Base',
  };
  return chains[chainId] || `Chain ${chainId}`;
};

// Components
const AgentCard: React.FC<{
  agent: Agent;
  onRevoke: () => void;
  onDelete: () => void;
}> = ({ agent, onRevoke, onDelete }) => {
  const t = useI18nContext();

  return (
    <Box
      padding={4}
      marginBottom={4}
      borderRadius={BorderRadius.LG}
      backgroundColor={BackgroundColor.backgroundDefault}
      className="agent-card"
    >
      <Box
        display={Display.Flex}
        justifyContent={JustifyContent.spaceBetween}
        alignItems={AlignItems.flexStart}
      >
        <Box>
          <Box display={Display.Flex} alignItems={AlignItems.center} gap={2}>
            <Text variant={TextVariant.headingSm}>{agent.name}</Text>
            {!agent.active && (
              <Text variant={TextVariant.bodySm} color={TextColor.errorDefault}>
                {t('revoked')}
              </Text>
            )}
          </Box>
          <Text variant={TextVariant.bodySm} color={TextColor.textMuted}>
            {t('lastUsed')}: {formatDate(agent.lastUsed)}
          </Text>
        </Box>

        <Box display={Display.Flex} gap={2}>
          {agent.active ? (
            <Button variant={ButtonVariant.Secondary} danger onClick={onRevoke}>
              {t('revoke')}
            </Button>
          ) : (
            <Button variant={ButtonVariant.Secondary} onClick={onDelete}>
              {t('delete')}
            </Button>
          )}
        </Box>
      </Box>

      {/* Permissions Summary */}
      <Box marginTop={4} display={Display.Flex} gap={4} style={{ flexWrap: 'wrap' }}>
        <Box>
          <Text variant={TextVariant.bodyXs} color={TextColor.textMuted}>
            {t('dailyLimit')}
          </Text>
          <Text variant={TextVariant.bodySm}>
            {formatUsd(agent.permissions.spendLimit.daily)}
          </Text>
        </Box>
        <Box>
          <Text variant={TextVariant.bodyXs} color={TextColor.textMuted}>
            {t('perTxLimit')}
          </Text>
          <Text variant={TextVariant.bodySm}>
            {formatUsd(agent.permissions.spendLimit.perTx)}
          </Text>
        </Box>
        <Box>
          <Text variant={TextVariant.bodyXs} color={TextColor.textMuted}>
            {t('chains')}
          </Text>
          <Text variant={TextVariant.bodySm}>
            {agent.permissions.allowedChains.map(getChainName).join(', ') || t('none')}
          </Text>
        </Box>
        <Box>
          <Text variant={TextVariant.bodyXs} color={TextColor.textMuted}>
            {t('protocols')}
          </Text>
          <Text variant={TextVariant.bodySm}>
            {agent.permissions.allowedProtocols.length} {t('allowed')}
          </Text>
        </Box>
      </Box>
    </Box>
  );
};

const PendingApprovalCard: React.FC<{
  approval: PendingApproval;
  agentName: string;
  onApprove: () => void;
  onReject: () => void;
}> = ({ approval, agentName, onApprove, onReject }) => {
  const t = useI18nContext();
  const timeLeft = Math.max(0, Math.floor((approval.expiresAt - Date.now()) / 1000));

  return (
    <Box
      padding={4}
      marginBottom={2}
      borderRadius={BorderRadius.LG}
      backgroundColor={BackgroundColor.warningMuted}
    >
      <Box
        display={Display.Flex}
        justifyContent={JustifyContent.spaceBetween}
        alignItems={AlignItems.flexStart}
      >
        <Box>
          <Text variant={TextVariant.headingSm}>
            {approval.txDetails.decodedMethod || t('transaction')}
          </Text>
          <Text variant={TextVariant.bodySm} color={TextColor.textMuted}>
            {t('from')}: {agentName}
          </Text>
          <Text variant={TextVariant.bodySm} color={TextColor.textMuted}>
            {t('to')}: {approval.txDetails.to.slice(0, 10)}...
          </Text>
          <Text variant={TextVariant.bodySm}>
            {t('value')}: {approval.txDetails.estimatedUsdValue
              ? formatUsd(approval.txDetails.estimatedUsdValue)
              : approval.txDetails.value}
          </Text>
          <Text variant={TextVariant.bodyXs} color={TextColor.textMuted}>
            {t('expiresIn')} {timeLeft}s
          </Text>
        </Box>

        <Box display={Display.Flex} gap={2}>
          <Button variant={ButtonVariant.Primary} onClick={onApprove}>
            {t('approve')}
          </Button>
          <Button variant={ButtonVariant.Secondary} onClick={onReject}>
            {t('reject')}
          </Button>
        </Box>
      </Box>
    </Box>
  );
};

// Main Component
export const AgentConnectionsTab: React.FC = () => {
  const t = useI18nContext();
  const dispatch = useDispatch();
  
  const agents = useSelector(selectAgents);
  const pendingApprovals = useSelector(selectPendingApprovals);

  const agentsById = useMemo(() => {
    const map: Record<string, Agent> = {};
    for (const agent of agents) {
      map[agent.id] = agent;
    }
    return map;
  }, [agents]);

  const handleRevokeAgent = useCallback((agentId: string) => {
    // dispatch(revokeAgent(agentId));
    console.log('Revoke agent:', agentId);
  }, [dispatch]);

  const handleDeleteAgent = useCallback((agentId: string) => {
    // dispatch(deleteAgent(agentId));
    console.log('Delete agent:', agentId);
  }, [dispatch]);

  const handleApprove = useCallback((approvalId: string) => {
    // dispatch(approveTransaction(approvalId));
    console.log('Approve:', approvalId);
  }, [dispatch]);

  const handleReject = useCallback((approvalId: string) => {
    // dispatch(rejectApproval(approvalId));
    console.log('Reject:', approvalId);
  }, [dispatch]);

  return (
    <Box
      className="agent-connections-tab"
      padding={4}
      display={Display.Flex}
      flexDirection={FlexDirection.Column}
    >
      <Text variant={TextVariant.headingLg} marginBottom={4}>
        {t('agentConnections')}
      </Text>

      <Text variant={TextVariant.bodyMd} color={TextColor.textMuted} marginBottom={4}>
        {t('agentConnectionsDescription')}
      </Text>

      {/* Pending Approvals */}
      {pendingApprovals.length > 0 && (
        <Box marginBottom={4}>
          <BannerAlert
            severity={BannerAlertSeverity.Warning}
            title={`${pendingApprovals.length} ${t('pendingApprovals')}`}
          />
          {pendingApprovals.map((approval) => (
            <PendingApprovalCard
              key={approval.id}
              approval={approval}
              agentName={agentsById[approval.agentId]?.name || t('unknownAgent')}
              onApprove={() => handleApprove(approval.id)}
              onReject={() => handleReject(approval.id)}
            />
          ))}
        </Box>
      )}

      {/* Agent List */}
      <Box marginBottom={4}>
        <Box
          display={Display.Flex}
          justifyContent={JustifyContent.spaceBetween}
          alignItems={AlignItems.center}
          marginBottom={4}
        >
          <Text variant={TextVariant.headingSm}>{t('connectedAgents')}</Text>
          <Button variant={ButtonVariant.Primary}>
            <Icon name={IconName.Add} size={IconSize.Sm} marginRight={1} />
            {t('addAgent')}
          </Button>
        </Box>

        {agents.length === 0 ? (
          <Box
            padding={6}
            borderRadius={BorderRadius.LG}
            backgroundColor={BackgroundColor.backgroundAlternative}
            display={Display.Flex}
            justifyContent={JustifyContent.center}
          >
            <Text color={TextColor.textMuted}>{t('noAgentsConnected')}</Text>
          </Box>
        ) : (
          agents.map((agent) => (
            <AgentCard
              key={agent.id}
              agent={agent}
              onRevoke={() => handleRevokeAgent(agent.id)}
              onDelete={() => handleDeleteAgent(agent.id)}
            />
          ))
        )}
      </Box>

      {/* Info Banner */}
      <Banner>
        <Text variant={TextVariant.bodySm}>
          <Icon name={IconName.Info} size={IconSize.Sm} marginRight={1} />
          {t('agentSecurityInfo')}
        </Text>
      </Banner>
    </Box>
  );
};

export default AgentConnectionsTab;
