const config = {
  port: parseInt(process.env.AGENT_PORT ?? '8080', 10),
  viewport: {
    width: parseInt(process.env.VIEWPORT_WIDTH ?? '1280', 10),
    height: parseInt(process.env.VIEWPORT_HEIGHT ?? '720', 10),
  },
  jpegQuality: parseInt(process.env.JPEG_QUALITY ?? '70', 10),
};

export default config;
