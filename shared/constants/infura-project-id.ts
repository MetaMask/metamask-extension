import { getManifestFlags } from '../lib/manifestFlags';

const INFURA_PROJECT_ID_FROM_MANIFEST_FLAGS =
  getManifestFlags().testing?.infuraProjectId;

globalThis.INFURA_PROJECT_ID =
  INFURA_PROJECT_ID_FROM_MANIFEST_FLAGS ?? process.env.INFURA_PROJECT_ID;
