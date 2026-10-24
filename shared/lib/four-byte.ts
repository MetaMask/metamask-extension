import { MethodRegistry } from 'eth-method-registry';
import { Hex } from '@metamask/utils';
import { hasTransactionData } from './transaction.utils';
import { stripHexPrefix } from './hexstring-utils';
import fetchWithCache from './fetch-with-cache';

type FourByteResult = {
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  created_at: string;
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  text_signature: string;
};

type FourByteResponse = {
  results: FourByteResult[];
};

type SourcifySignature = {
  name: string;
  filtered: boolean;
  hasVerifiedContract: boolean;
};

type SourcifyLookupResponse = {
  result?: {
    function?: { [selector: string]: SourcifySignature[] };
  };
};

// Sourcify runs a larger signature database than 4byte.directory and marks junk
// entries, so a selector with collisions resolves without guessing by age.
async function getMethodFromSourcify(
  fourBytePrefix: string,
): Promise<string | undefined> {
  const response = (await fetchWithCache({
    url: `https://api.4byte.sourcify.dev/signature-database/v1/lookup?function=${fourBytePrefix}`,
    fetchOptions: {
      referrerPolicy: 'no-referrer-when-downgrade',
      body: null,
      method: 'GET',
      mode: 'cors',
    },
    functionName: 'getMethodFromSourcify',
  })) as SourcifyLookupResponse;

  const candidates = (response.result?.function?.[fourBytePrefix] ?? []).filter(
    (candidate) => !candidate.filtered,
  );

  const match =
    candidates.find((candidate) => candidate.hasVerifiedContract) ??
    candidates[0];

  return match?.name;
}

async function getMethodFrom4ByteDirectory(
  fourBytePrefix: string,
): Promise<string | undefined> {
  const fourByteResponse = (await fetchWithCache({
    url: `https://www.4byte.directory/api/v1/signatures/?hex_signature=${fourBytePrefix}`,
    fetchOptions: {
      referrerPolicy: 'no-referrer-when-downgrade',
      body: null,
      method: 'GET',
      mode: 'cors',
    },
    functionName: 'getMethodFrom4Byte',
  })) as FourByteResponse;

  if (!fourByteResponse.results?.length) {
    return undefined;
  }

  fourByteResponse.results.sort((a, b) => {
    return new Date(a.created_at).getTime() < new Date(b.created_at).getTime()
      ? -1
      : 1;
  });

  return fourByteResponse.results[0].text_signature;
}

export async function getMethodFrom4Byte(
  fourBytePrefix: string,
): Promise<string | undefined> {
  if (
    !hasTransactionData(fourBytePrefix as Hex) ||
    stripHexPrefix(fourBytePrefix)?.length < 8
  ) {
    return undefined;
  }

  // Both requests go out together. Awaiting Sourcify first would put its
  // 30 second fetch timeout in front of the 4byte.directory one, and the
  // confirmation screen waits on this before it can render.
  const [sourcifySignature, fourByteSignature] = await Promise.all([
    getMethodFromSourcify(fourBytePrefix).catch(() => undefined),
    getMethodFrom4ByteDirectory(fourBytePrefix).catch(() => undefined),
  ]);

  return sourcifySignature ?? fourByteSignature;
}

let registry: MethodRegistry | undefined;

type HttpProvider = {
  host: string;
  timeout: number;
};

type MethodRegistryArgs = {
  network: string;
  provider: HttpProvider;
};

export async function getMethodDataAsync(
  fourBytePrefix: string,
  allow4ByteRequests: boolean,
  provider?: unknown,
) {
  try {
    let fourByteSig = null;
    if (allow4ByteRequests) {
      fourByteSig = await getMethodFrom4Byte(fourBytePrefix).catch((e) => {
        console.error(e);
        return null;
      });
    }

    if (!registry) {
      registry = new MethodRegistry({
        provider: provider ?? global.ethereumProvider,
      } as MethodRegistryArgs);
    }

    if (!fourByteSig) {
      return {};
    }

    const parsedResult = registry.parse(fourByteSig);

    return {
      name: parsedResult.name,
      params: parsedResult.args,
    };
  } catch (error) {
    console.error(error);
    return {};
  }
}
