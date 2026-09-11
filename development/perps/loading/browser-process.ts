export async function browserPid(port: number): Promise<string> {
  const version = await (
    await fetch(`http://127.0.0.1:${port}/json/version`, {
      signal: AbortSignal.timeout(8000),
    })
  ).json();
  const socket = new WebSocket(version.webSocketDebuggerUrl);
  try {
    await new Promise<void>((resolve, reject) => {
      socket.onopen = () => resolve();
      socket.onerror = reject;
    });
    return await new Promise<string>((resolve, reject) => {
      const timer = setTimeout(
        () => reject(Error('Browser process discovery timed out')),
        8000,
      );
      socket.onmessage = ({ data }) => {
        clearTimeout(timer);
        const message = JSON.parse(String(data));
        const browsers = message.result?.processInfo?.filter(
          (entry: { type: string }) => entry.type === 'browser',
        );
        if (browsers?.length === 1) {
          resolve(String(browsers[0].id));
        } else {
          reject(Error('Expected one browser process'));
        }
      };
      socket.send(
        JSON.stringify({ id: 1, method: 'SystemInfo.getProcessInfo' }),
      );
    });
  } finally {
    socket.close();
  }
}
