import fetchWithCache from './fetch-with-cache';

type FourByteResult = {
  created_at: string;
  text_signature: string;
};

type FourByteResponse = {
  results: FourByteResult[];
};

export async function getMethodFrom4Byte(
  fourBytePrefix: string,
): Promise<string> {
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

  fourByteResponse.results.sort((a, b) => {
    return new Date(a.created_at).getTime() < new Date(b.created_at).getTime()
      ? -1
      : 1;
  });

  return fourByteResponse.results[0].text_signature;
}
