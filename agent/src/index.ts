import { createServer } from './server.js';
import config from './config.js';

const wss = createServer();

wss.on('listening', () => {
  console.log(`agent listening on port ${config.port}`);
});
