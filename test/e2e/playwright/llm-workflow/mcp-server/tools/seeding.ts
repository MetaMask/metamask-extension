import type {
  SeedContractInput,
  SeedContractsInput,
  GetContractAddressInput,
  ListDeployedContractsInput,
  SeedContractResult,
  SeedContractsResult,
  GetContractAddressResult,
  ListDeployedContractsResult,
  McpResponse,
  HandlerOptions,
} from '../types';
import {
  createSuccessResponse,
  createErrorResponse,
  ErrorCodes,
} from '../types';
import { sessionManager } from '../session-manager';
import { knowledgeStore, createDefaultObservation } from '../knowledge-store';
import { collectTestIds, collectTrimmedA11ySnapshot } from '../discovery';

export async function handleSeedContract(
  input: SeedContractInput,
  _options?: HandlerOptions,
): Promise<McpResponse<SeedContractResult>> {
  const startTime = Date.now();

  try {
    if (!sessionManager.hasActiveSession()) {
      return createErrorResponse(
        ErrorCodes.MM_NO_ACTIVE_SESSION,
        'No active session. Call mm_launch first.',
        undefined,
        undefined,
        startTime,
      );
    }

    const sessionId = sessionManager.getSessionId() ?? '';
    const seeder = sessionManager.getSeeder();
    const page = sessionManager.getPage();

    const deployed = await seeder.deployContract(input.contractName, {
      hardfork: input.hardfork,
      deployerOptions: input.deployerOptions,
    });

    const result: SeedContractResult = {
      contractName: deployed.name,
      contractAddress: deployed.address,
      deployedAt: deployed.deployedAt,
    };

    const state = await sessionManager.getExtensionState();
    const testIds = await collectTestIds(page, 50);
    const { nodes, refMap } = await collectTrimmedA11ySnapshot(page);
    sessionManager.setRefMap(refMap);

    await knowledgeStore.recordStep({
      sessionId,
      toolName: 'mm_seed_contract',
      input: {
        contractName: input.contractName,
        hardfork: input.hardfork ?? 'prague',
      },
      outcome: { ok: true },
      observation: createDefaultObservation(state, testIds, nodes),
      durationMs: Date.now() - startTime,
    });

    return createSuccessResponse(result, sessionId, startTime);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return createErrorResponse(
      ErrorCodes.MM_SEED_FAILED,
      `Failed to deploy contract '${input.contractName}': ${message}`,
      { contractName: input.contractName },
      sessionManager.getSessionId(),
      startTime,
    );
  }
}

export async function handleSeedContracts(
  input: SeedContractsInput,
  _options?: HandlerOptions,
): Promise<McpResponse<SeedContractsResult>> {
  const startTime = Date.now();

  try {
    if (!sessionManager.hasActiveSession()) {
      return createErrorResponse(
        ErrorCodes.MM_NO_ACTIVE_SESSION,
        'No active session. Call mm_launch first.',
        undefined,
        undefined,
        startTime,
      );
    }

    const sessionId = sessionManager.getSessionId() ?? '';
    const seeder = sessionManager.getSeeder();
    const page = sessionManager.getPage();

    const { deployed, failed } = await seeder.deployContracts(input.contracts, {
      hardfork: input.hardfork,
    });

    const result: SeedContractsResult = {
      deployed: deployed.map((d) => ({
        contractName: d.name,
        contractAddress: d.address,
        deployedAt: d.deployedAt,
      })),
      failed: failed.map((f) => ({
        contractName: f.name,
        error: f.error,
      })),
    };

    const state = await sessionManager.getExtensionState();
    const testIds = await collectTestIds(page, 50);
    const { nodes, refMap } = await collectTrimmedA11ySnapshot(page);
    sessionManager.setRefMap(refMap);

    await knowledgeStore.recordStep({
      sessionId,
      toolName: 'mm_seed_contracts',
      input: {
        contracts: input.contracts,
        hardfork: input.hardfork ?? 'prague',
      },
      outcome: {
        ok: failed.length === 0,
        error:
          failed.length > 0
            ? {
                message: `${failed.length} contract(s) failed to deploy`,
              }
            : undefined,
      },
      observation: createDefaultObservation(state, testIds, nodes),
      durationMs: Date.now() - startTime,
    });

    return createSuccessResponse(result, sessionId, startTime);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return createErrorResponse(
      ErrorCodes.MM_SEED_FAILED,
      `Failed to deploy contracts: ${message}`,
      { contracts: input.contracts },
      sessionManager.getSessionId(),
      startTime,
    );
  }
}

export async function handleGetContractAddress(
  input: GetContractAddressInput,
  _options?: HandlerOptions,
): Promise<McpResponse<GetContractAddressResult>> {
  const startTime = Date.now();

  try {
    if (!sessionManager.hasActiveSession()) {
      return createErrorResponse(
        ErrorCodes.MM_NO_ACTIVE_SESSION,
        'No active session. Call mm_launch first.',
        undefined,
        undefined,
        startTime,
      );
    }

    const sessionId = sessionManager.getSessionId() ?? '';
    const seeder = sessionManager.getSeeder();
    const address = seeder.getContractAddress(input.contractName);

    const result: GetContractAddressResult = {
      contractName: input.contractName,
      contractAddress: address,
    };

    return createSuccessResponse(result, sessionId, startTime);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return createErrorResponse(
      ErrorCodes.MM_CONTRACT_NOT_FOUND,
      `Failed to get contract address: ${message}`,
      { contractName: input.contractName },
      sessionManager.getSessionId(),
      startTime,
    );
  }
}

export async function handleListDeployedContracts(
  _input: ListDeployedContractsInput,
  _options?: HandlerOptions,
): Promise<McpResponse<ListDeployedContractsResult>> {
  const startTime = Date.now();

  try {
    if (!sessionManager.hasActiveSession()) {
      return createErrorResponse(
        ErrorCodes.MM_NO_ACTIVE_SESSION,
        'No active session. Call mm_launch first.',
        undefined,
        undefined,
        startTime,
      );
    }

    const sessionId = sessionManager.getSessionId() ?? '';
    const seeder = sessionManager.getSeeder();
    const deployed = seeder.getDeployedContracts();

    const result: ListDeployedContractsResult = {
      contracts: deployed.map((d) => ({
        contractName: d.name,
        contractAddress: d.address,
        deployedAt: d.deployedAt,
      })),
    };

    return createSuccessResponse(result, sessionId, startTime);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return createErrorResponse(
      ErrorCodes.MM_SEED_FAILED,
      `Failed to list contracts: ${message}`,
      undefined,
      sessionManager.getSessionId(),
      startTime,
    );
  }
}
