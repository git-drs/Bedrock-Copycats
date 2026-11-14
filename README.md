# Bedrock Copycats

Behavior pack `Bedrock Copycats [BP]` + resource pack `Bedrock Copycats [RP]`.

- Base blocks live in `blocks/copycat/base/`. Textured variants are **generated** by `datagen/` (see `datagen/README.md`).
- Use any vanilla full-cube block item on a copycat to texture it. Wrench: click = rotate/flip (untextured) or reset (textured), sneak-click = pick up.

```
npm run datagen          # generate variants and auto-deploy to games/com.mojang
npm run deploy           # sync BP & RP to development folders without running full datagen
```

Scripts layout (`[BP]/scripts`): `main.js` (entry) · `config.js` (tunables) · `core/` (registry lookups, states, sound, cooldown, API compat) ·
`systems/` (texturing, wrench, transform, connections, trapdoor, version check) · `generated/registry.js` (generated) · `api.js` (public API).
