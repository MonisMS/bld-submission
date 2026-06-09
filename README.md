# Remote Browser Control

A local mini-TeamViewer for a browser. One command boots a headless Chromium inside a Docker container, streams its screen to a web UI in real time, and forwards your mouse, keyboard, and scroll events back in. Everything runs locally.

## Run

```
make up
```

Then open http://localhost:3000, click **Start**, and the browser appears. Click **Stop** to tear it down.

Docker must be running and `rbc-browser-agent:latest` is built automatically by `make up`.

## Architecture

```
  Host browser (the user)
  +-----------------------------------------------+
  |  web/  Next.js control panel                  |
  |   - Start / Stop, URL bar, status             |
  |   - <canvas> draws incoming JPEG frames       |
  |   - captures mouse/keyboard, sends as JSON    |
  +------------------------+----------------------+
        REST (start/stop)  |  WebSocket (frames down, input up)
                           v
  +-----------------------------------------------+
  |  server/  Node orchestrator                   |
  |   - REST: create / delete / list sessions     |
  |   - dockerode: run + stop browser containers  |
  |   - WS proxy: frontend  <-->  agent           |
  |   - reaps stale containers, cleans on exit    |
  +------------------------+----------------------+
        Docker socket      |  WS over private network (rbc-net)
                           v
  +-----------------------------------------------+
  |  agent/  Browser container                    |
  |   - puppeteer-core drives system Chromium     |
  |     headless, fixed viewport (1280x720)       |
  |   - CDP Page.startScreencast -> JPEG frames   |
  |   - own WS server on port 8080                |
  |   - input messages -> CDP input dispatch      |
  +-----------------------------------------------+
```

Flow: the UI calls `POST /api/sessions`, the server starts a browser container and returns an id. The UI opens a WebSocket to the server. The server connects to that container's agent by name on the private Docker network and pipes both directions. The agent streams JPEG frames to the UI; the UI sends clicks and keys back. On Stop or disconnect, the server removes the container.

## Key decisions

**CDP screencast, not VNC.** The task requires headless. VNC needs a real display. `Page.startScreencast` is built for headless and emits JPEG frames directly.

**Agent inside the container, not raw Chrome DevTools exposed across the boundary.** Connecting to Chrome's debugger from outside a container trips Chrome's Host-header check. Inside the container, puppeteer-core talks to Chromium on localhost with no such check, and the container exposes a plain WebSocket we control.

**Server reaches the agent by container name on a private Docker network.** No port juggling, nothing leaks to the host.

**Server proxies the WebSocket rather than pointing the UI at the container.** One stable origin, and the server owns the full lifecycle so cleanup is guaranteed.

**puppeteer-core plus Debian's chromium apt package.** Smaller image than the bundled Chromium download or the heavy Playwright image, and fully reproducible.

## Known limitations

- Single tab per session; no multi-tab support.
- Fixed 1280x720 viewport; not configurable without a rebuild.
- No audio or clipboard forwarding.
- `--no-sandbox` is required inside the container. This is safe here because the container is ephemeral and isolated, but it means the browser has no sandbox between renderer and container root.
- JPEG compression at quality 70 keeps bandwidth low at the cost of visible artifacts on high-contrast content. Tune `JPEG_QUALITY` in `.env`.

## Next step

Replace the fixed 1280x720 viewport with dynamic sizing: negotiate the viewport in the `ready` handshake using the canvas element's actual dimensions, and resize the Chromium window when the browser resizes.
