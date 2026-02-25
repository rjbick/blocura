# Local Package Workflow

Use this when you want to test `blocura` inside another codebase before publishing.

## 1. Build and pack this repo

From this repo root:

```bash
npm run pack:local
```

This creates one tarball in `.artifacts/` and prints the absolute install path.

## 2. Install in your other project

From the other project:

```bash
npm install /absolute/path/to/blocura/.artifacts/blocura-<version>.tgz
```

Then import as usual:

```tsx
import { BlockEditor } from 'blocura'
```

For explicit style control in Tailwind-heavy hosts:

```tsx
import { BlockEditor } from 'blocura/unstyled'
import 'blocura/styles.css'
```

The package entry already includes editor styles. If you need explicit control:

```ts
import 'blocura/styles.css'
```

## 3. Refresh after new changes

Repeat:

1. `npm run pack:local` in this repo.
2. Reinstall the new tarball in the other project (`npm install /absolute/path/to/new.tgz`).
