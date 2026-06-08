const config = {
  serverPort: parseInt(process.env.SERVER_PORT ?? '4000', 10),
  agentPort: parseInt(process.env.AGENT_PORT ?? '8080', 10),
  agentImage: process.env.AGENT_IMAGE ?? 'rbc-browser-agent:latest',
  networkName: process.env.NETWORK_NAME ?? 'rbc-net',
  webOrigin: process.env.WEB_ORIGIN ?? 'http://localhost:3000',
  teardownGraceMs: parseInt(process.env.TEARDOWN_GRACE_MS ?? '5000', 10),
};

export default config;
