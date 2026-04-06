# Publish Checklist

Use this checklist before pushing public source or publishing to npm.

## 1. Final local validation

```bash
npm ci
npm run release:check
```

`release:check` runs:

- lint (`eslint`)
- typecheck (`tsc -b`)
- tests with coverage thresholds (`vitest --coverage`)
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

## 4. Configure npm trusted publishing

In npm package settings, add a GitHub Actions trusted publisher for this repository with:

- your GitHub user or organization
- your repository name
- workflow filename `publish.yml`

After the first successful trusted publish, npm recommends enabling "Require two-factor authentication and disallow tokens" for the package.

## 5. Version, tag, and push

```bash
npm version patch
git push origin main --follow-tags
```

Pushing a `v*` tag triggers `.github/workflows/publish.yml`, reruns `npm run release:check`, and publishes to npm when the tag matches the version in `package.json`.

If publishing under a scoped package, use the scope name in `package.json` and keep `publishConfig.access` set to `public`.

## 6. Post-publish smoke test

In a clean sample project:

```bash
npm install <package-name>@<version>
```

Then verify:

- `import { BlockEditor } from '<package-name>'` works
- `import '<package-name>/styles.css'` resolves
- preview + save payloads work in your PHP integration
