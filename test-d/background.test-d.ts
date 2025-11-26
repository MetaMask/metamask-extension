import { FlattenedBackgroundStateProxy } from "../shared/types/background";

declare const backgroundState: FlattenedBackgroundStateProxy;

expectNotType<never>(backgroundState);
