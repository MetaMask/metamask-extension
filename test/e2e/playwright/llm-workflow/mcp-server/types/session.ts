export type SessionState = {
  sessionId: string;
  extensionId: string;
  startedAt: string;
  ports: {
    anvil: number;
    fixtureServer: number;
  };
  stateMode: 'default' | 'onboarding' | 'custom';
};
