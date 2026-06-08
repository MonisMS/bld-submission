# Remote Browser Control - Execution Roadmap

A local "mini TeamViewer for a browser." Open a web UI, click Start, a Docker
container boots headless Chromium, its screen streams back to the UI in real
time, and mouse/keyboard input from the UI happens inside that headless browser.
Everything runs locally and comes up with one command.

This is the build plan. Execute it top to bottom, one micro-step at a time.

---

## A. Execution rules (read first, follow throughout)

These rules are for whoever builds this, human or model.

1. Work one micro-step at a time. Each step is small and has a check. Run the
   check before moving on. Do not batch steps.
2. After every step that creates or changes a file, confirm it exists and is
   correct. After every command, read the output; do not assume success.
3. If a step errors, diagnose and fix it yourself before continuing. Read the
   actual error, form a hypothesis, fix, re-run. Do not skip a failing step or
   paper over it. Only stop and ask if you are truly blocked after a real attempt.
4. Scaffolders (create-next-app, npm init in interactive mode, etc.) must never
   target the repository root. The root already contains files, so a scaffolder
   run there will fail with "directory not empty." Always scaffold into a fresh
   subdirectory (web/). If a scaffolder ever refuses because a target is not
   empty, scaffold into a brand-new temp directory and move the contents in.
5. Use non-interactive flags for every command so nothing hangs waiting on a
   prompt.
6. Commit at the end of each phase with a plain message. Small, honest commits.
7. Follow the code standards in section G at all times, not as a cleanup pass.

---

## B. What we are building

Three parts: the box, the operator, and the remote control.

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
  |  server/  Node orchestrator (the operator)    |
  |   - REST: create / delete / list sessions     |
  |   - dockerode: run + stop browser containers  |
  |   - WS proxy: frontend  <-->  agent           |
  |   - reaps stale containers, cleans on exit    |
  +------------------------+----------------------+
        Docker socket      |  WS over private network (rbc-net)
                           v
  +-----------------------------------------------+
  |  agent/  Browser container (the box)          |
  |   - puppeteer-core drives system Chromium     |
  |     headless, fixed viewport                  |
  |   - CDP Page.startScreencast -> JPEG frames   |
  |   - own WS server on port 8080                |
  |   - input messages -> CDP input dispatch      |
  +-----------------------------------------------+
```

Runtime flow: UI calls POST /api/sessions, server starts a browser container and
returns an id. UI opens a WebSocket to the server. Server connects to that
container's agent by name on the private network and pipes both directions. Agent
streams JPEG frames to the UI; UI sends clicks and keys back. On Stop or
disconnect, the server removes the container.

---

## C. Key decisions and why

1. CDP screencast, not VNC. The task says headless. VNC needs a real display
   (non-headless). Page.startScreencast is built for headless and emits JPEG
   frames directly. Correct tool, lighter, matches the requirement.
2. The control agent lives inside the container, not raw Chrome DevTools exposed
   across the container boundary. Connecting to Chrome's debugger from outside
   trips Chrome's Host-header check and breaks unpredictably. Inside the
   container, puppeteer-core talks to Chromium on localhost with no such check,
   and the container exposes a plain WebSocket we control. This is the single
   most important choice for stable behavior.
3. The server reaches the agent by container name on a private docker network,
   not by mapped host ports. No port juggling, nothing leaks to the host.
4. The server proxies the WebSocket rather than pointing the UI at the container.
   One stable origin, and the server owns the full lifecycle so cleanup is
   guaranteed.
5. puppeteer-core plus Debian's chromium apt package, not the bundled download or
   the heavy Playwright image. Smaller, reproducible.
6. Next.js (App Router) for the UI to match the stack; Express for the backend.
   Realtime goes through the Express WS server, not Next.js API routes, which do
   not handle raw WebSockets cleanly.

---

## D. Repository layout

```
bld-submission/
  agent/
    Dockerfile
    package.json
    src/
      index.js          entrypoint: launch browser, start WS server
      browser.js        puppeteer-core launch + viewport + page handle
      screencast.js     start/stop screencast, emit frames, ack frames
      input.js          map protocol messages -> input dispatch
      server.js         WS server, wires a client to the browser
      config.js         viewport, jpeg quality, port from env
  server/
    Dockerfile
    package.json
    src/
      index.js          express app + http server + ws upgrade
      config.js         ports, image name, network name, timeouts
      docker/manager.js dockerode: ensure network, run/stop/remove, reap
      sessions/store.js in-memory session registry
      routes/sessions.js  POST / DELETE / GET sessions
      ws/proxy.js       frontend ws <-> agent ws relay with retry
  web/                  created by create-next-app, then trimmed
    Dockerfile
    app/page.tsx, app/layout.tsx
    components/Viewport.tsx, components/Toolbar.tsx
    lib/protocol.ts, lib/api.ts, lib/ws.ts, lib/session.ts
  docker-compose.yml
  Makefile
  .env.example
  .gitignore
  .dockerignore
  README.md
  ROADMAP.md
```

---

## E. Wire protocol (mirror on both ends)

One WebSocket per session.

Frames, agent -> UI: binary messages, raw JPEG bytes. Binary vs text is the
discriminator; no per-frame JSON, the hot path stays cheap.

Control, agent -> UI (text JSON):
- `{ "type": "ready", "viewport": { "width": 1280, "height": 720 } }`
- `{ "type": "url", "value": "https://..." }`
- `{ "type": "error", "message": "..." }`

Control, UI -> agent (text JSON):
- `{ "type": "mouse", "action": "move|down|up", "x", "y", "button", "clickCount" }`
- `{ "type": "wheel", "x", "y", "deltaX", "deltaY" }`
- `{ "type": "key", "action": "down|up", "key", "code", "text" }`
- `{ "type": "navigate", "url" }`

Coordinates are always in viewport pixels (the fixed 1280x720 space). The UI
scales screen coordinates into that space; the agent never scales.

---

## F. Phases as micro-steps

Build inside-out. Prove each part with a scratch client before stacking the next.
Do not start a phase until the previous phase passed its final check.

### Phase 0 - Skeleton and images

0.1 In the repo root, create `.gitignore` (node_modules, .env, .next, build
    output, *.log) and `.dockerignore` (node_modules, .next, .git).
    Check: both files exist with sane contents.
0.2 Create `.env.example` with VIEWPORT_WIDTH=1280, VIEWPORT_HEIGHT=720,
    JPEG_QUALITY=70, AGENT_PORT=8080, SERVER_PORT=4000, WEB_PORT=3000,
    AGENT_IMAGE=rbc-browser-agent:latest, NETWORK_NAME=rbc-net.
    Check: file exists.
0.3 Create the `agent/` tree by hand: `agent/package.json` (deps:
    puppeteer-core, ws), and empty `agent/src/*.js` files from section D with a
    one-line export stub each.
    Check: `ls agent/src` shows all six files.
0.4 Create the `server/` tree by hand: `server/package.json` (deps: express,
    cors, ws, dockerode, nanoid), and the empty `server/src` files from section D.
    Check: `ls -R server/src` shows the structure.
0.5 Create `web/` with the scaffolder, into the subdirectory only, never the root:
    `npx --yes create-next-app@latest web --ts --app --eslint --no-src-dir --use-npm --no-import-alias --no-turbopack`.
    If it refuses for any reason, scaffold into `web-tmp`, then move its contents
    into `web/` and delete `web-tmp`.
    Check: `web/app/page.tsx` and `web/package.json` exist.
0.6 Remove create-next-app boilerplate not needed: demo styles, sample assets,
    placeholder content in page.tsx. Leave a minimal layout and an empty page.
    Check: page renders nothing decorative.
0.7 Write `agent/Dockerfile` (node:20-bookworm-slim; apt-get install chromium and
    fonts; PUPPETEER_SKIP_DOWNLOAD=true; copy package files; npm ci; copy src;
    CMD node src/index.js).
    Check: `docker build -t rbc-browser-agent:latest ./agent` succeeds.
0.8 Write `server/Dockerfile` (node:20-bookworm-slim; npm ci; copy src; CMD node
    src/index.js) and `web/Dockerfile` (node:20-bookworm-slim; build Next.js;
    start).
    Check: both images build.
0.9 Write `Makefile` with: `build` (build agent image, then docker compose build),
    `up` (build agent image, then docker compose up), `down` (docker compose
    down), `clean` (down, remove any container labeled rbc.session, remove
    rbc-net if present).
    Check: `make build` builds all three images with no error.
0.10 `git init`, add a `.gitignore`-respecting first commit "scaffold project".
    Check: `git status` is clean, node_modules not tracked.

### Phase 1 - Agent streams frames

1.1 `config.js`: read viewport, jpeg quality, port from env with defaults.
1.2 `browser.js`: export `launch()` that starts puppeteer-core with
    executablePath /usr/bin/chromium, headless new, args --no-sandbox,
    --disable-dev-shm-usage, --disable-gpu, window size = viewport; open one
    page; setViewport; return { browser, page }.
1.3 `screencast.js`: export `start(page, onFrame)` that opens a CDP session, calls
    Page.startScreencast (jpeg, quality, maxWidth/Height = viewport), and on each
    Page.screencastFrame calls onFrame(buffer) then Page.screencastFrameAck with
    the frame sessionId. Export `stop()`. Acking every frame is required or the
    stream stalls.
1.4 `server.js`: a ws server on AGENT_PORT. On first client connect, launch the
    browser, send a `ready` control message, start the screencast and forward
    each frame as a binary message. On client close, stop the screencast and
    close the browser.
1.5 `index.js`: wire config + server, start listening, log the port.
1.6 Build and run the agent container directly with a published port for testing:
    `docker run --rm -p 8080:8080 rbc-browser-agent:latest`.
    Check: it starts without crashing.
1.7 Write a throwaway host script `scratch/frames.js` (node + ws) that connects,
    saves the first 20 binary frames to `scratch/out/*.jpg`, then exits.
    Check: the files open as valid JPEGs of a blank page. Delete scratch/ after.
1.8 Commit "agent: stream screencast frames over websocket".

### Phase 2 - Agent input

2.1 `input.js`: export `dispatch(page, msg)` handling each control type:
    mouse via page.mouse.move/down/up with button and clickCount; wheel via
    page.mouse.wheel; key via page.keyboard.down/up and sendCharacter when text
    is present; navigate via page.goto wrapped in try/catch.
2.2 Map the common special keys (Enter, Backspace, Tab, arrows, Escape) from
    KeyboardEvent.key to puppeteer key names.
2.3 In `server.js`, parse text messages as JSON and route them to dispatch. On
    framenavigated, send a `url` control message. On navigate failure, send an
    `error` control message.
2.4 Extend the scratch script to send a navigate to a search engine, type a
    query, press Enter, scroll, and save frames.
    Check: saved frames show the typed query and results.
2.5 Commit "agent: handle mouse, keyboard, scroll, and navigation".

### Phase 3 - Orchestrator lifecycle

3.1 `config.js`: ports, AGENT_IMAGE, NETWORK_NAME, teardown grace ms.
3.2 `docker/manager.js`: `ensureNetwork()` creates rbc-net if missing (idempotent).
3.3 `manager.create(id)`: createContainer with AGENT_IMAGE, attach to rbc-net,
    name rbc-browser-<id>, label rbc.session=<id>, memory limit set, /dev/shm
    sized via Tmpfs, no host port bindings; start it; return { name }.
3.4 `manager.destroy(id)`: stop with a short timeout then remove force; ignore
    not-found.
3.5 `manager.reap()`: list containers by label rbc.session and remove them.
3.6 `sessions/store.js`: a Map id -> { containerId, name, createdAt } with
    add/get/remove/list.
3.7 `routes/sessions.js`: POST creates (nanoid id, manager.create, store.add,
    return id and agent host name); DELETE destroys and removes from store; GET
    lists.
3.8 `index.js`: express with cors for the web origin; mount routes; on boot call
    reap() then ensureNetwork(); install SIGTERM and SIGINT handlers that destroy
    all stored sessions before exit.
3.9 Run the server locally against host Docker.
    Check: `curl -XPOST localhost:4000/api/sessions` makes a container appear in
    `docker ps`; DELETE removes it; killing the server removes all; restarting
    reaps leftovers.
3.10 Commit "server: container lifecycle via dockerode".

### Phase 4 - Orchestrator WS proxy

4.1 `ws/proxy.js`: on HTTP upgrade for /ws, read the session id from the query;
    reject unknown ids with a clean close.
4.2 Connect to the agent at ws://rbc-browser-<id>:AGENT_PORT with retry and
    backoff, since the container needs a moment to boot.
4.3 Pipe both directions preserving binary vs text; forward close and error both
    ways.
4.4 On UI disconnect, close the agent socket and schedule manager.destroy after
    the grace period; cancel the teardown if a new UI socket attaches to the same
    session first.
4.5 Wire the upgrade handler in `index.js`.
4.6 Extend the scratch client to hit the server (not the agent): create a
    session, open the proxy WS, receive frames, send a navigate.
    Check: frames arrive end to end through the server; after disconnect the
    container is gone past the grace period.
4.7 Commit "server: websocket proxy between ui and agent".

### Phase 5 - Frontend

5.1 `lib/protocol.ts`: the message types from section E.
5.2 `lib/api.ts`: createSession and deleteSession against the backend base URL
    from env (NEXT_PUBLIC_SERVER_URL).
5.3 `lib/ws.ts`: open the session WS; on a binary message build a Blob, decode
    with createImageBitmap, draw to the canvas, and drop a frame if one is still
    decoding so the backlog never grows; on a text message dispatch control
    events; expose send(msg) for input.
5.4 `lib/session.ts`: a hook owning state (idle, starting, live, stopping, error),
    the start flow (POST then connect, stay starting until ready), and
    stop/cleanup.
5.5 `components/Viewport.tsx`: a canvas at viewport size, CSS-scaled to fit.
    Capture mousemove/down/up and map client coords to viewport coords by the
    scale ratio; capture wheel with preventDefault; capture keydown/keyup with
    preventDefault and send key, code, text. Keep focus on the canvas.
5.6 `components/Toolbar.tsx`: Start/Stop reflecting state, a URL bar that sends
    navigate, a status line.
5.7 `app/page.tsx`: compose toolbar and viewport, wire the hook.
5.8 Run web + server + host Docker together.
    Check: open the UI, Start, the page appears; navigate; click, scroll, type
    inside the page; Stop removes the container.
5.9 Commit "web: control panel with live view and input".

### Phase 6 - Compose and hardening

6.1 `docker-compose.yml`: services web and server; define rbc-net; mount
    /var/run/docker.sock into server; pass env; expose only WEB_PORT and
    SERVER_PORT to the host. The agent image is built by the Makefile and spawned
    at runtime, so it is not a compose service.
6.2 Make sure `make up` builds the agent image first, then runs compose.
6.3 Handle and surface each failure: image missing, container fails to boot,
    agent WS never comes up, bad URL, UI closed mid-session, server restart with
    live sessions.
    Check: each case shows a clear status in the UI and never leaves a leak.
6.4 Run the full verification in section I.
    Check: clean start to clean finish, no leftover containers or network.
6.5 Write README.md (section J).
6.6 Commit "compose, hardening, and docs".

---

## G. Code standards

The code must read like one engineer wrote it on purpose, not generated filler.
- No emojis anywhere, including logs, commits, and the README.
- No decorative or narrating comments, no banner comments, no commented-out code.
  At most one or two genuine comments in the entire codebase, only where a real
  non-obvious decision needs justifying (for example, why every screencast frame
  must be acked).
- Names carry the meaning so comments are unnecessary. Functions do one thing.
- One module system per package, consistent imports and quotes, Prettier defaults
  and ESLint run before each commit.
- No dead dependencies, unused exports, or leftover scaffolding.
- Error handling is explicit and surfaced, never an empty catch.
- Logs are plain and useful: session id, action, outcome.
- Commit history is small, honest, and per phase.

---

## H. Robustness checklist

- Ack every screencast frame or the stream freezes after a few.
- --disable-dev-shm-usage or a sized /dev/shm or Chromium crashes under load.
- --no-sandbox is required in-container; note the tradeoff in the README.
- Retry and backoff when the proxy connects to a just-started agent.
- Grace period before teardown on UI disconnect; cancel on reconnect.
- Reap labeled containers on boot; destroy all on exit.
- Memory limit per browser container.
- Drop frames on the client if decode cannot keep up; never queue unboundedly.
- Validate session ids on the WS upgrade; reject unknown.
- preventDefault on wheel and keydown so the host page does not scroll or fire
  shortcuts.

---

## I. End-to-end verification (before recording)

1. `make clean && make up`.
2. Open the UI. State is idle.
3. Click Start. State goes starting, then live; the page renders in a couple of
   seconds. `docker ps` shows one rbc-browser container.
4. Type a URL, press Go. The page navigates; the URL bar updates.
5. Move the mouse, click a link, scroll, type into a field. Each is reflected
   with low latency.
6. Click Stop. State returns to idle; the container is gone.
7. Start again, then kill the server process. No rbc-browser containers remain.
8. `make clean`. No leftover containers or network.

---

## J. Submission

Recording (short, no narration, under about 90 seconds): idle UI, click Start,
the container appearing in a `docker ps` terminal beside the browser, the page
rendering, navigating, clicking and scrolling and typing, then Stop with the
container disappearing. End on an empty `docker ps`. The side-by-side terminal
proves it is a real container.

README contains: what it is and a screenshot, run steps (`make up`, open the URL),
the architecture diagram and data path from section B, the key decisions from
section C, known limitations (single tab, fixed viewport, no audio or clipboard,
--no-sandbox, JPEG quality vs bandwidth), and a brief next step.

Form answers: what you tried (the screencast plus in-container agent design and
why it beats VNC and raw CDP exposure), where you got stuck and how you solved it
(host-header rejection, frame-ack stalls, docker.sock networking are the honest
ones), and one concrete next step.
