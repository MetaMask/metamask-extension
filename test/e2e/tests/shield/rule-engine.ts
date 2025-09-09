import { CompletedRequest, Mockttp, RulePriority } from 'mockttp';
import sinon from 'sinon';
import { escapeRegExp } from 'lodash';

const SHIELD_RULE_ENGINE_URL =
  'https://shield-rule-engine.dev-api.cx.metamask.io';

export async function registerShieldRuleEngineMock(
  server: Mockttp,
  priority: RulePriority = RulePriority.DEFAULT,
) {
  const handleShieldRuleEngineRequestSpy = sinon.spy(
    handleShieldRuleEngineRequest,
  );
  await server
    .forPost(new RegExp(escapeRegExp(SHIELD_RULE_ENGINE_URL), 'u'))
    .asPriority(priority)
    .thenCallback(handleShieldRuleEngineRequestSpy);
  return handleShieldRuleEngineRequestSpy;
}

export async function handleShieldRuleEngineRequest(request: CompletedRequest) {
  if (request.path === '/api/v1/coverage/init') {
    return {
      statusCode: 200,
      json: {
        coverageId: 'coverageId',
      },
    };
  } else if (request.path === '/api/v1/coverage/result') {
    return {
      statusCode: 200,
      json: {
        status: 'covered',
      },
    };
  }
  throw new Error('Unknown path');
}
