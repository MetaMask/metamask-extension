export type RelayStatus = 'connected' | 'disconnected' | 'checking';

export class RelayClient {
  private baseUrl: string;

  private polling = false;

  private onResponseCallback: ((r: string) => void) | null = null;

  constructor(baseUrl = 'http://localhost:3334') {
    this.baseUrl = baseUrl;
  }

  async sendMessage(prompt: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/api/message`, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: prompt,
    });
    if (!response.ok) {
      // e.g. 400 (bad envelope) or 413 (body too large) from the relay —
      // don't start polling for a reply that will never come.
      throw new Error(`relay rejected message (${response.status})`);
    }
    this.startPolling();
  }

  onResponse(cb: ((response: string) => void) | null) {
    this.onResponseCallback = cb;
  }

  /**
   * Long-poll /api/poll one request at a time.
   *
   * Critical: do NOT use setInterval here. /api/poll holds open for up to 30s
   * on the server side. setInterval(2s) would stack 15 pending connections,
   * hit the browser's per-origin cap (~6), and starve concurrent /api/health
   * checks — flipping the UI to "Not connected" while the relay is fine.
   */
  private startPolling() {
    if (this.polling) {
      return;
    }
    this.polling = true;
    this.pollLoop().catch(() => {
      // pollLoop handles its own errors; this guards against unexpected rejections.
      this.polling = false;
    });
  }

  private async pollLoop() {
    while (this.polling) {
      try {
        const r = await fetch(`${this.baseUrl}/api/poll`);
        if (r.status === 200) {
          const text = await r.text();
          if (text && this.onResponseCallback) {
            this.onResponseCallback(text);
            this.polling = false;
            return;
          }
        }
        // 204 No Content = server timeout (30s), loop immediately for next long-poll.
        // 200 with empty body = shouldn't happen but loop anyway.
      } catch {
        // Network error: brief delay before retry so we don't tight-loop on a downed server.
        await new Promise((r) => setTimeout(r, 1000));
      }
    }
  }

  stopPolling() {
    this.polling = false;
  }

  async checkHealth(): Promise<RelayStatus> {
    try {
      const r = await fetch(`${this.baseUrl}/api/health`, {
        signal: AbortSignal.timeout(2000),
      });
      return r.ok ? 'connected' : 'disconnected';
    } catch {
      return 'disconnected';
    }
  }
}
