import { hexToDecimal } from '../../conversion.utils';
import { Caveat } from '../caveat';
import { DeleGatorEnvironment } from '../environment';
import { encodeBatchExecution } from '../execution';
import { isAddress, isHex, type Hex } from '../utils';

export const exactExecutionBatch = 'exactExecutionBatch';

export function exactExecutionBatchBuilder(
  environment: DeleGatorEnvironment,
  executions: {
    to: string;
    value: string;
    data: string | undefined;
  }[],
): Caveat {
  for (let i = 0; i < executions.length; i++) {
    const { to, value, data } = executions[i];

    if (!isAddress(to, { strict: false })) {
      throw new Error(`Index ${i} - Invalid to: must be a valid address`);
    }

    const valueAsNumber = Number(hexToDecimal(value));
    if (!Number.isInteger(valueAsNumber)) {
      throw new Error(`Index ${i} - Invalid value: must be an integer`);
    }

    if (valueAsNumber < 0) {
      throw new Error(
        `Index ${i} - Invalid value: must be a positive integer or zero`,
      );
    }

    const safeData = normalizeData(data);

    if (safeData !== '0x' && !isHex(safeData, { strict: true })) {
      throw new Error(`Index ${i} - Invalid data: must be a valid hex string`);
    }
  }

  const terms = encodeBatchExecution(
    executions.map(({ to, value, data }) => ({
      target: to as Hex,
      value: BigInt(value),
      callData: normalizeData(data) as Hex,
    })),
  );

  const {
    caveatEnforcers: { ExactExecutionBatchEnforcer },
  } = environment;

  return {
    enforcer: ExactExecutionBatchEnforcer,
    terms,
    args: '0x',
  };
}

function normalizeData(data: string | undefined): string {
  return data !== undefined && data !== '0x' ? data : '0x';
}
