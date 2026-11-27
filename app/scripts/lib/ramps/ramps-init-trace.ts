import { TraceName } from '../../../../shared/lib/trace';
import { createOwnRoot } from '../own-root-trace';

// `RampsController.init()` reaches `RampsService` only after awaiting, so the
// service's `fetch` rejoins the running `Ramps Init` root.
export const rampsInitTrace = createOwnRoot(TraceName.RampsInit);
