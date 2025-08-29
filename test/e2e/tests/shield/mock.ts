import { Mockttp, RulePriority } from 'mockttp';
import { registerShieldGatewayMock } from './gateway';
import { registerShieldRuleEngineMock } from './rule-engine';

export async function registerShieldServerMocks(
  server: Mockttp,
  priority?: RulePriority,
) {
  const gatewaySpy = await registerShieldGatewayMock(server, priority);
  const ruleEngineSpy = await registerShieldRuleEngineMock(server, priority);
  return {
    gatewaySpy,
    ruleEngineSpy,
  };
}
