# Publish Checklist

Use this checklist before pushing public source or publishing to npm.

## 1. Final local validation

```bash
npm ci
npm run release:check
```

`release:check` runs:

- tests (`vitest`)
- library build (`dist` JS + types + CSS)
- `npm pack --dry-run`

## 2. Verify package metadata

Check `package.json` for:

- `name`, `version`, `license`
- `main`, `module`, `types`, `exports`
- `peerDependencies` (`react`, `react-dom`)
- `files` list (must include `dist`)

## 3. Review pack output

Inspect the `npm pack --dry-run` file list and make sure only expected files are included:

- `dist/**`
- `README.md`
- `LICENSE`
- `docs/**` (optional but currently included)

## 4. Version and publish

```bash
npm version patch
npm publish --access public
```

If publishing under a scoped package, use the scope name in `package.json` and keep `publishConfig.access` set to `public`.

## 5. Post-publish smoke test

In a clean sample project:

```bash
npm install <package-name>@<version>
```

Then verify:

- `import { BlockEditor } from '<package-name>'` works
- `import '<package-name>/styles.css'` resolves
- preview + save payloads work in your PHP integration
