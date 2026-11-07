# Dirtycoin Web

Static interface for the project coin: Home, wallet-aware Dashboard, Market and Community.

## Local development

Requires Node.js 20.18 or newer and npm.

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Checks

```bash
npm run lint
npm run test:contracts
npm run build
```

`npm run context -- home` lists the spec, source entry points and checks for an area;
`npm run check:specs` validates documentation links and routing.

## Project map

Start with [AGENTS.md](AGENTS.md) and [docs/CURRENT.md](docs/CURRENT.md). Area specs are in
`docs/specs/`. Static deployment follows the [release spec](docs/specs/release.md).
Future work and research (GameFi, decision history, evidence, prototypes) are in `../research/`;
they are not part of the build.
