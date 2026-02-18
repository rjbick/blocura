# Gutenberg 22.5 — Standalone React Block Editor (99% Fidelity Target)

You are an expert React/TypeScript engineer and pixel-perfect UI replicator. Your goal is a
**standalone, framework-agnostic, drop-in React block editor** that is visually and behaviorally
indistinguishable from WordPress Gutenberg 22.5 (February 4, 2026).

Zero `@wordpress/*` package dependencies. Fully self-contained.

---

## Stack

| Layer | Choice | Rationale |
|---|---|---|
| Framework | React 19 + TypeScript (strict) | — |
| Styling | Tailwind CSS v4 + CSS custom properties | Token system matches WP |
| Components | shadcn/ui (Radix primitives) + lucide-react | Accessibility base |
| **Rich Text** | **ProseMirror** (direct, no Tiptap) | Gutenberg's actual engine. Tiptap adds an abstraction layer that prevents exact split/merge/caret-between-blocks behavior replication |
| State | Zustand 5 (slices) + Immer | |
| Code editor | CodeMirror 6 | Code mode + HTML block |
| Drag & Drop | `@dnd-kit/core` + `@dnd-kit/sortable` | |
| Animations | Framer Motion | Popover springs, panel slides, zoom-out |

### Why ProseMirror over Tiptap

Gutenberg's `@wordpress/rich-text` is itself a thin React wrapper over ProseMirror. Using ProseMirror
directly means:

- **Split/merge** uses native `splitBlock` / `joinBackward` / `joinForward` ProseMirror commands —
  identical behavior to WP, no workarounds.
- **Caret-between-blocks** uses `endOfTextBlock` / `startOfTextBlock` queries wired to cross-block
  navigation. Tiptap's event model blocks this without patching internals.
- **Mark overlap** (simultaneous text color + highlight + link on same range) uses PM's native Mark
  model. Tiptap's extension system has known edge cases here.
- **Cross-block selection** (click paragraph, shift-click heading, delete) requires PM's `Selection`
  type system — CellSelection, TextSelection, NodeSelection — not available cleanly through Tiptap.

---

## Design Tokens — Exact Gutenberg 22.5 Values

```css
:root {
  /* Core WP admin theme */
  --wp-admin-theme-color:           #2271b1;
  --wp-admin-theme-color-darker-10: #135e96;
  --wp-admin-theme-color-darker-20: #0a4b78;

  /* Components accent (used for selection, focus) */
  --wp-components-color-accent:          #3858e9;
  --wp-components-color-accent-darker-10: #2145e6;
  --wp-components-color-accent-inverted: #fff;

  /* Editor chrome */
  --wp-editor-bg:           #f0f0f0;   /* outer canvas area */
  --wp-canvas-bg:           #fff;      /* white writing surface */
  --wp-canvas-shadow:       0 0 0 1px rgba(0,0,0,.1);
  --wp-toolbar-bg:          #fff;
  --wp-toolbar-height:      56px;
  --wp-toolbar-border:      1px solid #ddd;
  --wp-sidebar-width:       280px;
  --wp-sidebar-bg:          #fff;
  --wp-sidebar-border:      #e0e0e0;

  /* Block selection */
  --wp-block-selected-outline: 2px solid var(--wp-components-color-accent);
  --wp-block-hover-outline:    1px solid var(--wp-admin-theme-color);
  --wp-block-label-bg:         var(--wp-components-color-accent);
  --wp-block-label-color:      #fff;
  --wp-block-label-font-size:  10px;
  --wp-block-label-height:     20px;
  --wp-block-label-border-radius: 2px;

  /* Inline inserter */
  --wp-inserter-inline-size:      24px;
  --wp-inserter-appender-size:    36px;
  --wp-inserter-line-color:       var(--wp-components-color-accent);
  --wp-inserter-line-height:      2px;

  /* Typography */
  --wp-font-size-small:  11px;
  --wp-font-size-body:   13px;
  --wp-font-size-label:  11px;
  --wp-font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
                    Oxygen-Sans, Ubuntu, Cantarell, "Helvetica Neue", sans-serif;

  /* Popovers — exact 3-layer shadow */
  --wp-popover-shadow:        0 2px 6px rgba(0,0,0,.05),
                               0 1px 2px rgba(0,0,0,.07),
                               0 0 0 1px rgba(0,0,0,.1);
  --wp-popover-bg:            #fff;
  --wp-popover-border-radius: 4px;

  /* Focus rings */
  --wp-focus-ring:        2px solid var(--wp-components-color-accent);
  --wp-focus-ring-offset: 2px;

  /* Transitions */
  --wp-transition-fast:   0.05s ease;
  --wp-transition-panel:  0.3s ease;

  /* Snackbar */
  --wp-snackbar-bg:           #1e1e1e;
  --wp-snackbar-color:        #fff;
  --wp-snackbar-border-radius: 2px;

  /* Breadcrumb */
  --wp-breadcrumb-bg:         rgba(255,255,255,0.9);
  --wp-breadcrumb-height:     28px;
  --wp-breadcrumb-font-size:  11px;

  /* Spacing scale */
  --wp-space-1: 4px;  --wp-space-2: 8px;  --wp-space-3: 12px;
  --wp-space-4: 16px; --wp-space-6: 24px; --wp-space-8: 32px;
}
```

---

## Core Types & Interfaces

```ts
// ─── Block Model ──────────────────────────────────────────────────────────────

interface Block<A = Record<string, any>> {
  clientId: string;           // UUID v4
  name: string;               // "core/paragraph"
  attributes: A;
  innerBlocks: Block[];
  isValid?: boolean;          // false = validation error → show error card
  originalContent?: string;   // stored innerHTML for validation comparison
}

// ─── Block Definition (Registry entry) ───────────────────────────────────────

interface BlockDefinition {
  name: string;
  title: string;
  description?: string;
  category: BlockCategory;
  icon: string | React.ReactNode;
  keywords?: string[];
  supports: BlockSupports;
  attributes: Record<string, BlockAttributeSchema>;
  variations?: BlockVariation[];
  styles?: BlockStyle[];
  transforms?: BlockTransforms;
  providesContext?: Record<string, string>;   // { 'core/column-count': 'columns' }
  usesContext?: string[];                     // ['core/column-count']
  edit: React.ComponentType<BlockEditProps<any>>;
  save: (props: { attributes: any; innerBlocks?: Block[] }) => string;
  deprecated?: DeprecatedBlock[];
  merge?: (baseAttrs: any, mergeAttrs: any) => any; // for joinBackward support
  split?: (value: any) => [any, any];               // for splitBlock support
}

type BlockCategory =
  | 'text' | 'media' | 'design' | 'widgets'
  | 'theme' | 'embed' | '_unstable';

// ─── Block Supports ───────────────────────────────────────────────────────────

interface BlockSupports {
  anchor?: boolean;
  align?: boolean | AlignValue[];
  alignWide?: boolean;
  defaultStylePicker?: boolean;
  className?: boolean;
  customClassName?: boolean;
  html?: boolean;
  inserter?: boolean;
  multiple?: boolean;
  reusable?: boolean;
  lock?: boolean;
  splitting?: boolean;
  color?: {
    text?: boolean;
    background?: boolean;
    link?: boolean;
    gradients?: boolean;
    customColors?: boolean;
    customGradients?: boolean;
    duotone?: boolean;
  };
  typography?: {
    fontSize?: boolean;
    lineHeight?: boolean;
    fontFamily?: boolean;
    fontWeight?: boolean;
    fontStyle?: boolean;
    textTransform?: boolean;
    textDecoration?: boolean;
    letterSpacing?: boolean;
    textColumns?: boolean;
    writingMode?: boolean;
  };
  spacing?: {
    padding?: boolean | SpacingAxis[];
    margin?: boolean | SpacingAxis[];
    blockGap?: boolean;
  };
  border?: {
    color?: boolean;
    radius?: boolean;
    style?: boolean;
    width?: boolean;
    __experimentalDefaultControls?: {
      color?: boolean; radius?: boolean; style?: boolean; width?: boolean;
    };
  };
  dimensions?: {
    minHeight?: boolean;
    aspectRatio?: boolean;
  };
  position?: { sticky?: boolean };
  layout?: boolean | { default?: LayoutConfig };
  interactivity?: boolean;
  renaming?: boolean;
  __experimentalBorder?: boolean;
}

type AlignValue   = 'left' | 'center' | 'right' | 'wide' | 'full';
type SpacingAxis  = 'top' | 'right' | 'bottom' | 'left' | 'vertical' | 'horizontal';

interface LayoutConfig {
  type: 'default' | 'flex' | 'grid' | 'constrained';
  contentSize?: string;
  wideSize?: string;
  justifyContent?: string;
  orientation?: 'horizontal' | 'vertical';
}

// ─── Editor State ─────────────────────────────────────────────────────────────

interface EditorState {
  blocks: Block[];
  title: string;

  // Selection
  selectedClientIds: string[];
  hoveredClientId: string | null;
  insertionPoint: InsertionPoint | null;
  focusedClientId: string | null;
  selectionStart: BlockSelectionPoint | null;  // for cross-block text selection
  selectionEnd: BlockSelectionPoint | null;

  // Panels
  sidebarOpen: boolean;
  sidebarTab: 'document' | 'block';
  listViewOpen: boolean;

  // Modes
  isCodeMode: boolean;
  previewDevice: 'desktop' | 'tablet' | 'mobile' | null;
  isFullscreen: boolean;
  isDistractionFree: boolean;
  isSpotlightMode: boolean;
  isZoomOut: boolean;           // overview mode Ctrl+Shift+−
  zoomLevel: number;            // 1.0 = normal, 0.5 = zoom out

  // Drag
  isDragging: boolean;
  dragClientId: string | null;

  // Command Palette
  commandPaletteOpen: boolean;

  // Preferences
  preferences: EditorPreferences;

  // History (undo/redo)
  history: HistoryStack;

  // Notices
  notices: Notice[];

  // Synced Patterns
  syncedPatterns: SyncedPattern[];

  // Post settings (Document sidebar state)
  postSettings: PostSettings;
}

interface BlockSelectionPoint {
  clientId: string;
  attributeKey: string;
  offset: number;
}

interface InsertionPoint {
  rootClientId: string | null;
  index: number;
}

interface EditorPreferences {
  showBlockBreadcrumb: boolean;
  showListViewByDefault: boolean;
  showIconLabels: boolean;
  focusMode: boolean;
  fixedToolbar: boolean;
  keepCaretInsideBlock: boolean;
  enableCustomFields: boolean;
  allowRightClickMenu: boolean;
  distractionFreeHiddenNotice: boolean;
}

interface PostSettings {
  status: 'draft' | 'publish' | 'private' | 'pending' | 'future';
  visibility: 'public' | 'private' | 'password';
  password?: string;
  scheduledDate?: string;    // ISO string
  slug: string;
  permalink?: string;        // full URL preview
  categories: Term[];
  tags: Term[];
  featuredImageId?: number;
  featuredImageUrl?: string;
  excerpt: string;
  allowComments: boolean;
  allowPingbacks: boolean;
  template?: string;
  order?: number;
  revisionsCount?: number;
}

interface Term {
  id: number;
  name: string;
  slug: string;
}

interface HistoryStack {
  past: HistoryEntry[];
  present: HistoryEntry;
  future: HistoryEntry[];
}

interface HistoryEntry {
  blocks: Block[];
  selection: { clientIds: string[] };
  lastModifiedClientId: string | null;
}

interface Notice {
  id: string;
  status: 'success' | 'error' | 'warning' | 'info';
  content: string;
  isDismissible: boolean;
  actions?: NoticeAction[];
  type: 'snackbar' | 'default';
  icon?: React.ReactNode;
  spokenMessage?: string;
  __unstableHTML?: boolean;
}

interface NoticeAction {
  label: string;
  onClick?: () => void;
  url?: string;
  className?: string;
}

// ─── Rich Text (ProseMirror) ──────────────────────────────────────────────────

// The RichText component manages its own ProseMirror EditorView instance.
// Each block that uses RichText owns one or more PM instances.

interface RichTextProps {
  tagName?: string;                       // 'p', 'h1'–'h6', 'li', etc.
  value: string;                          // serialized HTML
  onChange: (html: string) => void;
  onSplit?: (before: string, after: string) => void;    // Enter key
  onMerge?: (forward: boolean) => void;                  // Backspace/Delete at boundary
  onReplace?: (blocks: Block[]) => void;                 // paste as blocks
  onRemove?: (forward: boolean) => void;                 // delete when empty
  placeholder?: string;
  allowedFormats?: string[];             // ['bold','italic','link'] — restrict formats
  disableLineBreaks?: boolean;           // suppress shift+enter
  preserveWhiteSpace?: boolean;
  isSelected?: boolean;
  identifier?: string;                   // for multi-attribute blocks (image caption)
  readOnly?: boolean;
  className?: string;
  style?: React.CSSProperties;
  // ProseMirror schema extensions
  __unstableAllowPrefixTransforms?: boolean;
}

// ProseMirror schema marks used across all blocks:
// - bold          → <strong>
// - italic        → <em>
// - link          → <a href style>
// - code          → <code>
// - strikethrough → <s>
// - subscript     → <sub>
// - superscript   → <sup>
// - underline     → <u> (inline style)
// - textColor     → <mark style="color:X" class="has-X-color">
// - highlight     → <mark style="background-color:X" class="has-X-background-color">
// - language      → <span lang="X">
// - keyboard      → <kbd>
// - imageInline   → <img> (inline void node)

// ─── Patterns ─────────────────────────────────────────────────────────────────

interface Pattern {
  name: string;
  title: string;
  description?: string;
  categories?: string[];
  keywords?: string[];
  viewportWidth?: number;
  blockTypes?: string[];
  content: Block[] | string;
  source?: 'theme' | 'plugin' | 'core' | 'user';
  templateTypes?: string[];
  postTypes?: string[];
}

interface SyncedPattern {
  id: string;
  clientId: string;        // root block clientId
  title: string;
  blocks: Block[];         // source of truth — all instances reference this
  modified: boolean;
}

// ─── Save / Output ────────────────────────────────────────────────────────────

interface SavePayload {
  blocks: Block[];
  title: string;
  content: string;    // <!-- wp:name {...} -->…<!-- /wp:name -->
  rawHtml: string;    // no comments
  postSettings: PostSettings;
}

// ─── Component Props ──────────────────────────────────────────────────────────

interface BlockEditorProps {
  initialBlocks?: Block[];
  initialTitle?: string;
  initialPostSettings?: Partial<PostSettings>;
  onChange?: (blocks: Block[]) => void;
  onSave?: (payload: SavePayload) => void | Promise<void>;
  onAutoSave?: (payload: SavePayload) => void;
  onImageUpload?: (file: File) => Promise<{
    url: string; id?: string; alt?: string;
    width?: number; height?: number;
    sizes?: Record<string, { url: string; width: number; height: number }>;
  }>;
  onSearchTerms?: (query: string) => Promise<Term[]>;
  onSearchCategories?: (query: string) => Promise<Term[]>;
  patterns?: Pattern[];
  customBlocks?: BlockDefinition[];
  settings?: Partial<EditorSettings>;
  className?: string;
  contentRef?: React.RefObject<HTMLDivElement>;
}

interface EditorSettings {
  title: string;
  hasFixedToolbar: boolean;
  imageEditing: boolean;
  maxWidth: number;
  wideWidth: number;
  bodyPlaceholder: string;
  titlePlaceholder: string;
  allowedBlockTypes: string[] | true;
  templateLock: false | 'all' | 'insert' | 'contentOnly';
  template?: [string, Record<string, any>, any[]?][];   // block template
  supportsLayout: boolean;
  supportsTemplateMode: boolean;
  colors: WPColor[];
  gradients: WPGradient[];
  fontSizes: WPFontSize[];
  fontFamilies?: WPFontFamily[];
  defaultEditorStyles?: string;
  locale: string;
  isRTL: boolean;
  canLockBlocks: boolean;
  canEditBlocks: boolean;
  generateAnchors: boolean;
  __experimentalFeatures?: {
    color?: { defaultPalette?: boolean; defaultGradients?: boolean };
    typography?: { defaultFontSizes?: boolean; fluid?: boolean };
    layout?: { definitions?: Record<string, any> };
  };
  postType?: string;
  logo?: string;
}

interface WPColor      { name: string; slug: string; color: string; }
interface WPGradient   { name: string; slug: string; gradient: string; }
interface WPFontSize   { name: string; slug: string; size: string | number; fluid?: { min: string; max: string; }; }
interface WPFontFamily { name: string; slug: string; fontFamily: string; fontFace?: any[]; }
```

---

## Folder Structure

```
src/
└── BlockEditor/
    ├── index.tsx                         # <BlockEditor /> root
    │
    ├── store/
    │   ├── index.ts                      # createEditorStore() factory
    │   ├── slices/
    │   │   ├── blocks.slice.ts           # CRUD + undo/redo (Immer)
    │   │   ├── selection.slice.ts
    │   │   ├── ui.slice.ts               # panels, modes, zoom
    │   │   ├── notices.slice.ts
    │   │   ├── postSettings.slice.ts     # document tab state
    │   │   └── preferences.slice.ts
    │   └── selectors.ts                  # memoized derivations
    │
    ├── registry/
    │   ├── BlockRegistry.ts              # Map<name, BlockDefinition>
    │   ├── CommandRegistry.ts            # Map<id, Command> for Cmd+K
    │   └── blocks/
    │       ├── paragraph/    ├── heading/     ├── image/
    │       ├── button/       ├── buttons/     ├── list/
    │       ├── list-item/    ├── quote/       ├── pullquote/
    │       ├── columns/      ├── column/      ├── group/
    │       ├── cover/        ├── media-text/  ├── embed/
    │       ├── spacer/       ├── separator/   ├── html/
    │       ├── code/         ├── preformatted/├── table/
    │       ├── verse/        ├── navigation/  ├── navigation-link/
    │       ├── shortcode/    └── classic/
    │
    ├── components/
    │   ├── layout/
    │   │   ├── EditorLayout.tsx          # full-page flex shell
    │   │   ├── EditorCanvas.tsx          # scrollable writing area
    │   │   ├── ZoomOutView.tsx           # overview mode
    │   │   └── PreviewFrame.tsx          # device frame overlay
    │   │
    │   ├── toolbar/
    │   │   ├── TopToolbar.tsx            # 56px header, exact 22.5 layout
    │   │   ├── ToolbarButton.tsx         # 36×36 icon button + tooltip
    │   │   ├── ToolbarGroup.tsx          # gap-1 flex group + divider
    │   │   ├── DocumentTitle.tsx         # editable title in toolbar
    │   │   ├── ViewModeToggle.tsx        # Visual/Code segmented control
    │   │   ├── PreviewDropdown.tsx
    │   │   ├── SaveButton.tsx
    │   │   └── MoreMenu.tsx              # ellipsis menu
    │   │
    │   ├── inserter/
    │   │   ├── Inserter.tsx              # slide-in left panel
    │   │   ├── InserterTabs.tsx          # Blocks / Patterns tabs
    │   │   ├── BlocksTab.tsx             # search + category + grid
    │   │   ├── PatternsTab.tsx           # category chips + scaled previews
    │   │   ├── SlashInserter.tsx         # / command mid-block
    │   │   ├── InlineInserter.tsx        # + between blocks (24px)
    │   │   └── BlockAppender.tsx         # + at document end (36px)
    │   │
    │   ├── block/
    │   │   ├── BlockWrapper.tsx          # outline, label, interaction chrome
    │   │   ├── BlockEdit.tsx             # dispatch to registry
    │   │   ├── BlockList.tsx             # renders root or inner block list
    │   │   ├── BlockFloatingToolbar.tsx  # positioned above selected block
    │   │   ├── BlockToolbarFixed.tsx     # when fixedToolbar preference = true
    │   │   ├── BlockSwitcher.tsx         # transform popover
    │   │   ├── BlockMover.tsx            # ↑↓ buttons
    │   │   ├── BlockDragHandle.tsx       # ⠿ grip
    │   │   ├── BlockMultiControls.tsx    # multi-select toolbar
    │   │   ├── BlockContextMenu.tsx      # right-click menu
    │   │   ├── BlockValidationError.tsx  # error card + resolve options
    │   │   └── InnerBlocksAppender.tsx
    │   │
    │   ├── richtext/
    │   │   ├── RichText.tsx              # ProseMirror React wrapper
    │   │   ├── RichTextContext.tsx       # EditorView context per block
    │   │   ├── FormatToolbar.tsx         # bubble menu (PM plugin)
    │   │   ├── SlashSuggestions.tsx      # / inline command popover (PM plugin)
    │   │   ├── schema.ts                 # ProseMirror schema definition
    │   │   ├── keymaps.ts                # PM keymap plugin (Enter/Backspace/Delete)
    │   │   ├── inputRules.ts             # markdown shortcuts (## → heading etc.)
    │   │   ├── plugins/
    │   │   │   ├── formatToolbarPlugin.ts
    │   │   │   ├── linkPlugin.ts
    │   │   │   └── pastePlugin.ts        # detect block markup on paste
    │   │   └── formats/
    │   │       ├── bold.ts  ├── italic.ts   ├── link.ts
    │   │       ├── code.ts  ├── highlight.ts ├── textColor.ts
    │   │       └── language.ts
    │   │
    │   ├── sidebar/
    │   │   ├── Sidebar.tsx
    │   │   ├── SidebarTabs.tsx           # Document / Block tabs
    │   │   ├── DocumentSidebar.tsx       # full post settings
    │   │   ├── BlockSidebar.tsx          # dynamic panels from supports
    │   │   ├── PanelRenderer.tsx         # getSidebarPanels(def) → JSX
    │   │   └── panels/
    │   │       ├── ColorPanel.tsx
    │   │       ├── TypographyPanel.tsx
    │   │       ├── DimensionsPanel.tsx
    │   │       ├── BorderPanel.tsx
    │   │       ├── PositionPanel.tsx
    │   │       ├── VisibilityPanel.tsx
    │   │       ├── AdvancedPanel.tsx
    │   │       ├── BlockStylesPanel.tsx  # style variations
    │   │       └── document/
    │   │           ├── StatusVisibilityPanel.tsx
    │   │           ├── PermalinkPanel.tsx
    │   │           ├── CategoriesPanel.tsx
    │   │           ├── TagsPanel.tsx
    │   │           ├── FeaturedImagePanel.tsx
    │   │           ├── ExcerptPanel.tsx
    │   │           ├── DiscussionPanel.tsx
    │   │           ├── PageAttributesPanel.tsx
    │   │           └── RevisionPanel.tsx
    │   │
    │   ├── listview/
    │   │   ├── ListView.tsx
    │   │   ├── ListViewItem.tsx          # icon + title + content preview
    │   │   ├── ListViewDropZone.tsx
    │   │   └── ListViewBranch.tsx        # recursive subtree
    │   │
    │   ├── commandpalette/
    │   │   ├── CommandPalette.tsx
    │   │   └── CommandItem.tsx
    │   │
    │   ├── preferences/
    │   │   └── PreferencesModal.tsx      # Ctrl+, modal
    │   │
    │   ├── keyboard/
    │   │   └── KeyboardShortcutsModal.tsx
    │   │
    │   └── ui/
    │       ├── Panel.tsx                 # collapsible sidebar section
    │       ├── PanelBody.tsx
    │       ├── PanelRow.tsx
    │       ├── Popover.tsx               # Framer Motion spring popover
    │       ├── Tooltip.tsx               # 200ms delay, 11px text
    │       ├── Modal.tsx
    │       ├── Snackbar.tsx
    │       ├── SnackbarList.tsx          # bottom-left queue
    │       ├── Spinner.tsx
    │       ├── RangeControl.tsx
    │       ├── SelectControl.tsx
    │       ├── ToggleControl.tsx
    │       ├── TextControl.tsx
    │       ├── TextareaControl.tsx
    │       ├── ColorPicker.tsx           # full HSL picker + hex input
    │       ├── ColorPalette.tsx          # swatch grid
    │       ├── GradientPicker.tsx
    │       ├── UnitControl.tsx           # value + unit selector (px/%/em/rem/vw/vh)
    │       ├── BoxControl.tsx            # 4-side spacing with link toggle
    │       ├── BorderControl.tsx
    │       ├── FontSizePicker.tsx        # preset pills + custom unit
    │       ├── AlignmentControl.tsx
    │       ├── BlockAlignmentControl.tsx
    │       ├── FocalPointPicker.tsx
    │       ├── DropZone.tsx
    │       ├── DropdownMenu.tsx
    │       └── TokenInput.tsx            # for tags/categories
    │
    ├── hooks/
    │   ├── useBlockSelection.ts
    │   ├── useBlockDrop.ts
    │   ├── useInserter.ts
    │   ├── useHistory.ts
    │   ├── useKeyboardShortcuts.ts
    │   ├── useBlockAttributes.ts
    │   ├── useBlockContext.ts
    │   ├── useProseMirrorSync.ts         # keep PM state ↔ Zustand in sync
    │   ├── useBlockValidation.ts         # run save() vs originalContent on load
    │   └── useZoomOut.ts
    │
    ├── helpers/
    │   ├── blocksToBlockMarkup.ts
    │   ├── blocksToRawHtml.ts
    │   ├── parseBlockMarkup.ts
    │   ├── parseBlockAttributes.ts       # JSON in HTML comment → object
    │   ├── serializeBlockAttributes.ts   # object → minimal JSON (skip defaults)
    │   ├── generateClientId.ts           # crypto.randomUUID()
    │   ├── cloneBlock.ts                 # deep clone + new clientIds
    │   ├── getBlockType.ts
    │   ├── applyBlockSupports.ts         # generate className/style from attrs+supports
    │   └── validateBlock.ts
    │
    └── styles/
        ├── editor.css
        ├── blocks.css
        └── theme-compat.css
```

---

## Zustand Store — All Actions

Use `createEditorStore()` factory (not a global singleton) so multiple editors can coexist.

```ts
// ─── blocks.slice.ts ──────────────────────────────────────────────────────────

interface BlocksSlice {
  // CRUD — all push a HistoryEntry
  insertBlock(block: Block, rootClientId: string | null, index: number): void;
  insertBlocks(blocks: Block[], rootClientId: string | null, index: number): void;
  updateBlockAttributes(clientId: string, attrs: Record<string, any>): void;
  updateBlockAttributesBatch(updates: {clientId:string; attrs:Record<string,any>}[]): void;
  removeBlock(clientId: string, selectPrevious?: boolean): void;
  removeBlocks(clientIds: string[]): void;
  moveBlockToPosition(clientId: string, fromRoot: string|null, toRoot: string|null, index: number): void;
  moveBlockUp(clientId: string): void;
  moveBlockDown(clientId: string): void;
  duplicateBlock(clientId: string): void;
  replaceBlock(clientId: string, replacement: Block | Block[]): void;
  replaceBlocks(clientIds: string[], blocks: Block[]): void;
  mergeBlocks(firstClientId: string, secondClientId: string): void;
  lockBlock(clientId: string, lock: { move?: boolean; remove?: boolean }): void;
  unlockBlock(clientId: string): void;
  resetBlocks(blocks: Block[]): void;   // bulk replace (load from API)
  setTemplateValidity(isValid: boolean): void;

  // Undo / Redo
  undo(): void;
  redo(): void;
  canUndo: boolean;
  canRedo: boolean;
  undoCount: number;
  redoCount: number;
}

// ─── selection.slice.ts ───────────────────────────────────────────────────────

interface SelectionSlice {
  selectBlock(clientId: string, initialPosition?: -1 | 0 | 1 | null): void;
  multiSelectBlocks(startId: string, endId: string): void;
  addToSelection(clientId: string): void;
  removeFromSelection(clientId: string): void;
  selectAll(): void;
  clearSelection(): void;
  setHoveredBlock(clientId: string | null): void;
  setInsertionPoint(point: InsertionPoint | null): void;
  setSelectionStart(point: BlockSelectionPoint | null): void;
  setSelectionEnd(point: BlockSelectionPoint | null): void;

  // Derived (computed in selectors.ts, not raw state)
  selectedBlock: Block | null;
  selectedBlockDefinition: BlockDefinition | null;
  selectedBlockParent: Block | null;
  selectionAncestors: Block[];         // ordered root → parent
  firstSelectedBlock: Block | null;
  lastSelectedBlock: Block | null;
  isMultiSelection: boolean;
}
```

---

## TopToolbar — Pixel-Perfect 22.5

```tsx
// Exactly 56px tall. position: sticky; top: 0; z-index: 100.
// background: #fff; border-bottom: var(--wp-toolbar-border).
// All icon buttons: 36×36px, border-radius: 2px.
// Icon size: 24×24, color: #1e1e1e. Disabled: rgba(30,30,30,0.3).
// Active bg: rgba(var(--wp-components-color-accent-rgb), 0.1).
// Active icon: var(--wp-components-color-accent).

// ─── LEFT GROUP ──────────────────────────────────────────────────────────────
// pl: 8px, gap: 4px

// 1. Site logo button (36×36)
//    - settings.logo ? <img src={logo} 36×36 /> : <WPLogoIcon />
//    - Omit in standalone mode (no settings.logo, no WP admin)

// 2. Inserter toggle (+)
//    - Icon: Plus (24px)
//    - Active (isOpen): bg rgba(accent, 0.1), icon accent color
//    - Tooltip: "Toggle block inserter (⇧⌘K)" with shortcut chip
//    - Animation: panel slides in from left, 280px wide, Framer Motion
//      spring { stiffness: 300, damping: 30 }

// 3. Undo (Undo2 icon)
//    - Disabled state: opacity 0.3, cursor: default
//    - Tooltip: "Undo" + "Ctrl+Z" shortcut chip

// 4. Redo (Redo2 icon)
//    - Tooltip: "Redo" + "Ctrl+Shift+Z"

// ─── SEPARATOR: 1px × 24px rgba(0,0,0,0.1), mx: 4px ─────────────────────────

// 5. View mode toggle (segmented control)
//    - Two buttons: "Visual" | "Code"
//    - Container: border 1px solid #ddd, border-radius: 2px, overflow: hidden
//    - Active: bg #fff, box-shadow: 0 0 0 1px rgba(0,0,0,0.1)
//    - Inactive: bg #f0f0f0
//    - Sliding white pill indicator, transition: 200ms ease

// 6. List View toggle (List icon)
//    - Active: bg rgba(accent, 0.1), icon accent
//    - Tooltip: "List View (Ctrl+Shift+J)"

// ─── CENTER (flex: 1) ─────────────────────────────────────────────────────────
// justify-content: center

// Document title input
//    - font: 600 var(--wp-font-size-body) var(--wp-font-family)
//    - color: #1e1e1e; background: transparent; border: none
//    - Hover: show thin underline (border-bottom: 1px solid #949494)
//    - Focus: border-bottom: 1px solid var(--wp-components-color-accent)
//    - Placeholder: "Add title" in #949494
//    - Max-width: 400px

// ─── RIGHT GROUP ──────────────────────────────────────────────────────────────
// pr: 8px, gap: 4px

// 1. Preview dropdown
//    - Button: Eye icon + "Preview" label + ChevronDown
//    - Dropdown items (each 200px wide popover):
//      □ Desktop (Monitor icon) + "Open in new tab" link
//      □ Tablet  (Tablet icon)  + "Open in new tab" link
//      □ Mobile  (Smartphone icon) + "Open in new tab" link
//    Clicking Desktop/Tablet/Mobile opens PreviewFrame overlay

// 2. Save / Publish button (primary)
//    - bg: #2271b1; color: #fff; border-radius: 2px; height: 36px; px: 12px
//    - Hover: bg #135e96; Active: bg #0a4b78
//    - Label:
//      if postSettings.status === 'draft'   → "Save draft"
//      if postSettings.status === 'publish' → "Update"  (already published)
//      if first publish                     → "Publish"
//    - Loading state: spinner + disabled
//    - On success: snackbar "Post updated."

// ─── SEPARATOR ────────────────────────────────────────────────────────────────

// 3. Settings toggle (PanelRight icon)
//    - Tooltip: "Settings (Ctrl+,)"

// 4. More menu (MoreVertical icon)
//    - Opens popover (280px wide) with sections:
//      VIEW
//        • Desktop preview
//        • Tablet preview
//        • Mobile preview
//      EDITOR
//        • Fullscreen mode          (Ctrl+Shift+Alt+F)
//        • Spotlight mode
//        • Distraction free         (Ctrl+Shift+\)
//        • Top toolbar              (toggle)
//        • Zoom out                 (Ctrl+Shift+-)
//      TOOLS
//        • Keyboard shortcuts       (opens modal)
//        • Preferences              (opens modal)
//        • Copy all content
//      SUPPORT
//        • Help center (external link)
```

---

## Writing Flow — Caret Between Blocks

This is the most critical behavioral fidelity feature. Implement it in `keymaps.ts`.

```ts
// ProseMirror keymap plugin for each RichText instance

import { keymap } from 'prosemirror-keymap';
import { splitBlock, joinBackward, joinForward,
         selectNodeBackward, endOfTextBlock, startOfTextBlock } from 'prosemirror-commands';

// Arrow Down at end of block → select next block in Zustand
const ArrowDown = (state, dispatch, view) => {
  if (!endOfTextBlock(state, 'down')) return false;
  // signal to EditorCanvas via onNavigateOut('down')
  onNavigateOut?.('down');
  return true;
};

// Arrow Up at start of block → select previous block
const ArrowUp = (state, dispatch, view) => {
  if (!startOfTextBlock(state, 'up')) return false;
  onNavigateOut?.('up');
  return true;
};

// Enter → call onSplit with before/after HTML
const Enter = (state, dispatch) => {
  const { $from, $to } = state.selection;
  if (!$from.sameParent($to)) return false;
  const beforeHTML = /* serialize content before cursor */;
  const afterHTML  = /* serialize content after cursor */;
  onSplit?.(beforeHTML, afterHTML);
  return true;
};

// Backspace at position 0 → call onMerge(forward: false)
const Backspace = (state, dispatch, view) => {
  if (state.selection.$from.parentOffset !== 0) return false;
  if (state.doc.content.size <= 2) {
    onRemove?.(false);
    return true;
  }
  const ok = joinBackward(state, dispatch, view);
  if (!ok) { onMerge?.(false); return true; }
  return ok;
};

// Delete at end → call onMerge(forward: true)
const Delete = (state, dispatch, view) => {
  const { $from, $to } = state.selection;
  if (!$from.sameParent($to)) return false;
  if ($from.parentOffset !== $from.parent.content.size) return false;
  const ok = joinForward(state, dispatch, view);
  if (!ok) { onMerge?.(true); return true; }
  return ok;
};
```

### Cross-Block Navigation in Canvas

```tsx
// EditorCanvas.tsx
// When a RichText calls onNavigateOut('down'):
const handleNavigateOut = (clientId: string, direction: 'up' | 'down') => {
  const blocks = flattenBlocks(store.blocks);
  const index  = blocks.findIndex(b => b.clientId === clientId);
  const target = direction === 'down' ? blocks[index + 1] : blocks[index - 1];
  if (!target) return;
  store.selectBlock(target.clientId, direction === 'down' ? -1 : 1);
  // -1 = focus start of block, 1 = focus end
  // BlockEdit receives initialPosition and forwards to ProseMirror:
  //   view.dispatch(view.state.tr.setSelection(TextSelection.atStart(doc)))
  //   or TextSelection.atEnd(doc) accordingly
};
```

---

## Block Validation System

Run on load and after any `save()` function update.

```ts
// helpers/validateBlock.ts

export function validateBlock(block: Block, def: BlockDefinition): boolean {
  if (!block.originalContent) return true; // new block, always valid
  try {
    const regenerated = def.save({ attributes: block.attributes, innerBlocks: block.innerBlocks });
    return normalizeHTML(regenerated) === normalizeHTML(block.originalContent);
  } catch {
    return false;
  }
}

function normalizeHTML(html: string): string {
  // strip whitespace-only text nodes, normalize attribute order
  return html.replace(/\s+/g, ' ').trim();
}
```

### Block Validation Error UI

When `block.isValid === false`, `BlockWrapper` renders error card instead of edit component:

```
┌─────────────────────────────────────────────────────────┐
│ ⚠ This block contains unexpected or invalid content.    │
│                                                         │
│ WordPress attempted to recover, but some content may    │
│ have been lost.                                         │
│                                                         │
│  [Attempt Block Recovery]  [Convert to Classic Block]   │
│  [Keep as HTML]            [Delete Block]               │
└─────────────────────────────────────────────────────────┘
```

---

## Block Insertion Animations — Exact Timings

```tsx
// InlineInserter.tsx
// The + button between blocks

// Visibility: hidden by default
// Shows: when hovering the gap between two blocks (16px tall hover zone)
// Button size: 24×24px (vs 36×36 for end-appender)
// Button position: centered horizontally, centered in hover zone
// Entry animation:
//   initial: { opacity: 0, scale: 0.8 }
//   animate: { opacity: 1, scale: 1 }
//   transition: { duration: 0.1, ease: 'easeOut' }
// The blue insertion line:
//   initial: { scaleX: 0 }
//   animate: { scaleX: 1 }
//   transition: { duration: 0.15, ease: 'easeOut' }
//   originX: 0
//   height: 2px, color: var(--wp-components-color-accent)

// BlockAppender.tsx
// At document end
// Button size: 36×36px
// Shows permanently (not hover-dependent), lower opacity until hover
// Placeholder text: "Type / to choose a block" (same as paragraph placeholder)
```

---

## Sidebar — Document Tab (Full Implementation)

The Document sidebar is fully specced below. Each panel is a `<Panel>` (collapsible, `<PanelBody>`).

### Status & Visibility Panel

```tsx
// Default: expanded

// Row: Status
// <SelectControl label="Status" options={['Draft','Pending Review','Private','Published']}/>

// Row: Visibility
// Shows current value. Click → opens inline sub-panel:
//   Radio: Public | Private | Password Protected
//   If Password: TextControl for password entry

// Row: Publish date
// Shows "Immediately" or formatted date.
// Click → opens DateTimePicker (calendar + time input)
// Future date → Save button changes to "Schedule"

// Row: Template (if postType supports templates)
// <SelectControl label="Template" options={available templates}/>

// Row: URL
// Shows slug. Click → inline edit mode
// Full permalink preview: https://site.com/YYYY/MM/slug/
```

### Permalink Panel

```tsx
// Shows full URL with slug editable
// TextControl with "Regenerate" link
// "Copy" icon button
// "View post" external link
```

### Categories Panel

```tsx
// List of checkboxes, grouped
// "Add new category" link → inline form: name + parent dropdown
// Search input to filter
```

### Tags Panel

```tsx
// TokenInput component
// Typeahead: calls onSearchTerms(query) prop
// Comma or Enter to add
// × to remove
// "Choose from most used tags" expander
```

### Featured Image Panel

```tsx
// Empty: dashed border zone + "Set featured image" button → opens MediaUpload
// Filled: thumbnail image + "Replace" / "Remove" links
// Alt text read from media, editable inline
```

### Excerpt Panel

```tsx
// <TextareaControl label="Write an excerpt (optional)" rows={4} />
// "Learn more about manual excerpts" link
```

### Discussion Panel

```tsx
// <ToggleControl label="Allow comments" />
// <ToggleControl label="Allow pingbacks and trackbacks" />
```

### Page Attributes Panel (postType: 'page')

```tsx
// SelectControl: Template
// NumberControl: Order (integer)
```

### Revisions Panel

```tsx
// Only shows if revisionsCount > 0
// "X Revisions" link → opens revisions screen (external href, passed via props)
```

---

## Block Sidebar — Dynamic Panel System

```ts
// components/sidebar/PanelRenderer.tsx

function getSidebarPanels(def: BlockDefinition, attrs: Record<string, any>): SidebarPanel[] {
  const panels: SidebarPanel[] = [];
  const s = def.supports;

  // Block styles — always first if block has styles
  if (def.styles?.length) {
    panels.push({ id: 'styles', title: 'Styles', defaultOpen: true, component: BlockStylesPanel });
  }

  // Block-specific controls — from edit component's inspector registration
  // Blocks export <InspectorControls> children; we collect and render here
  panels.push({ id: 'block-specific', title: null, isSlot: true });

  // Color
  if (s.color && Object.values(s.color).some(Boolean)) {
    panels.push({ id: 'color', title: 'Color', defaultOpen: false, component: ColorPanel });
  }

  // Typography
  if (s.typography && Object.values(s.typography).some(Boolean)) {
    panels.push({ id: 'typography', title: 'Typography', defaultOpen: false, component: TypographyPanel });
  }

  // Dimensions
  const hasDimensions = s.spacing?.padding || s.spacing?.margin || s.spacing?.blockGap
    || s.dimensions?.minHeight || s.dimensions?.aspectRatio;
  if (hasDimensions) {
    panels.push({ id: 'dimensions', title: 'Dimensions', defaultOpen: false, component: DimensionsPanel });
  }

  // Border
  if (s.border && Object.values(s.border).some(v => v === true)) {
    panels.push({ id: 'border', title: 'Border', defaultOpen: false, component: BorderPanel });
  }

  // Position
  if (s.position?.sticky) {
    panels.push({ id: 'position', title: 'Position', defaultOpen: false, component: PositionPanel });
  }

  // Advanced (always last)
  panels.push({ id: 'advanced', title: 'Advanced', defaultOpen: false, component: AdvancedPanel });

  return panels;
}
```

### InspectorControls Slot Pattern

Blocks register their own sidebar controls via a slot system (no @wordpress/components needed):

```tsx
// hooks/useInspectorControls.ts
// Blocks call:
useInspectorControls(() => (
  <>
    <PanelBody title="Image settings">
      <ToggleControl label="Link to" ... />
    </PanelBody>
  </>
), [attrs.href]);

// BlockSidebar.tsx collects these via React context and renders
// them as the "block-specific" slot.
```

### Advanced Panel — Full Spec

```tsx
// Anchor input
<TextControl label="HTML anchor" value={attrs.anchor ?? ''}
  onChange={v => updateAttributes({ anchor: v })}
  help="Enter a word or two — without spaces — to make a unique web address for this block, …"
  placeholder="Add an anchor" />

// CSS class input
<TextControl label="Additional CSS class(es)" value={attrs.className ?? ''}
  onChange={v => updateAttributes({ className: v })}
  help="Separate multiple classes with spaces." />

// Additional CSS textarea
<BaseControl label="Additional CSS" htmlFor="block-custom-css">
  <textarea id="block-custom-css" className="block-editor-block-inspector__custom-css"
    value={attrs.__customCSS ?? ''}
    onChange={e => updateAttributes({ __customCSS: e.target.value })}
    rows={4}
    style={{ fontFamily: 'monospace', fontSize: 12, width: '100%', resize: 'vertical' }} />
</BaseControl>
// When __customCSS is non-empty:
// - BlockWrapper adds class "has-custom-css" to the outer div
// - blocksToRawHtml() injects a <style> tag scoped to the block's anchor if present

// Viewport visibility (22.5 stabilized)
<BaseControl label="Visibility" className="block-editor-block-inspector__visibility">
  <ToggleRow icon={Monitor} label="Desktop"
    checked={!attrs.__hideOn?.desktop}
    onChange={v => toggleHideOn('desktop', !v)} />
  <ToggleRow icon={Tablet} label="Tablet"
    checked={!attrs.__hideOn?.tablet}
    onChange={v => toggleHideOn('tablet', !v)} />
  <ToggleRow icon={Smartphone} label="Mobile"
    checked={!attrs.__hideOn?.mobile}
    onChange={v => toggleHideOn('mobile', !v)} />
</BaseControl>
// Renderer adds classes: .hide-on-desktop / .hide-on-tablet / .hide-on-mobile
// Consumer must ship matching CSS.
```

---

## Color Panel — Exact 22.5 Behavior

```tsx
// ColorPanel renders multiple "ColorGradientControl" rows

// Text color (if supports.color.text)
<ColorGradientControl
  label="Text"
  colorValue={resolveColor(attrs.textColor, attrs.style?.color?.text, settings.colors)}
  onColorChange={color => {
    const slug = findColorSlug(color, settings.colors);
    if (slug) {
      updateAttributes({ textColor: slug, style: removeStyleColor(attrs.style, 'text') });
    } else {
      updateAttributes({ textColor: undefined, style: setStyleColor(attrs.style, 'text', color) });
    }
  }}
  gradientValue={undefined}   // text doesn't support gradient
/>

// Background (if supports.color.background)
<ColorGradientControl
  label="Background"
  colorValue={resolveColor(attrs.backgroundColor, attrs.style?.color?.background, settings.colors)}
  gradientValue={attrs.gradient
    ? findGradient(attrs.gradient, settings.gradients)?.gradient
    : attrs.style?.color?.gradient}
  onColorChange={...}
  onGradientChange={gradient => {
    const slug = findGradientSlug(gradient, settings.gradients);
    if (slug) {
      updateAttributes({ gradient: slug, backgroundColor: undefined, style: removeStyleBg(attrs.style) });
    } else {
      updateAttributes({ gradient: undefined, backgroundColor: undefined,
        style: setStyleGradient(attrs.style, gradient) });
    }
  }}
/>

// Link color (if supports.color.link)
<ColorGradientControl label="Link" ... />

// Color swatch UI:
// - 24px circles, gap: 8px, max per row: 8
// - Selected: 2px offset outline matching swatch color
// - Tooltip: color name on hover
// - "Custom color" button → opens full HSL picker popover
// - Popover: 240px wide, hue slider + saturation box + hex input + rgb inputs
```

---

## Typography Panel — Full Controls

```tsx
// Font Family (if supports.typography.fontFamily)
<SelectControl label="Font"
  options={[{ label: 'Default', value: '' }, ...settings.fontFamilies.map(...)]}
  value={attrs.fontFamily ?? ''}
  onChange={v => updateAttributes({ fontFamily: v || undefined })} />

// Font Size (if supports.typography.fontSize)
<FontSizePicker
  value={resolvedSize}
  fontSizes={settings.fontSizes}
  onChange={v => {
    const slug = findFontSizeSlug(v, settings.fontSizes);
    updateAttributes({ fontSize: slug, style: slug ? clearCustomSize(attrs.style) : setCustomSize(attrs.style, v) });
  }}
  withReset />
// FontSizePicker renders: preset pills (Small/Medium/Large/XL) + "Custom" → UnitControl

// Line height (if supports.typography.lineHeight)
<UnitControl label="Line height" value={attrs.style?.typography?.lineHeight ?? ''}
  onChange={v => updateTypographyStyle('lineHeight', v)}
  units={[{ value: '', label: '—' }]}   // unitless by default
  min={0} step={0.1} />

// Appearance (fontWeight + fontStyle, if both supported)
<HStack>
  <SelectControl label="Appearance"
    options={[
      { label: 'Default', value: '' },
      { label: 'Thin',    value: '100' },
      { label: 'Extra Light', value: '200' },
      { label: 'Light',   value: '300' },
      { label: 'Regular', value: '400' },
      { label: 'Medium',  value: '500' },
      { label: 'Semi Bold', value: '600' },
      { label: 'Bold',    value: '700' },
      { label: 'Extra Bold', value: '800' },
      { label: 'Black',   value: '900' },
    ]}
    value={attrs.style?.typography?.fontWeight ?? ''}
    onChange={v => updateTypographyStyle('fontWeight', v)} />
  <SelectControl label="" options={[{ label: 'Normal', value: '' }, { label: 'Italic', value: 'italic' }]}
    value={attrs.style?.typography?.fontStyle ?? ''}
    onChange={v => updateTypographyStyle('fontStyle', v)} />
</HStack>

// Letter spacing (if supports.typography.letterSpacing)
<UnitControl label="Letter spacing"
  value={attrs.style?.typography?.letterSpacing ?? ''}
  onChange={v => updateTypographyStyle('letterSpacing', v)}
  units={['px', 'em', 'rem']} min={-2} step={0.5} />

// Text decoration (if supports.typography.textDecoration)
<ToggleGroupControl label="Decoration" isBlock>
  <ToggleGroupControlOption value=""            label="None" />
  <ToggleGroupControlOption value="underline"   label={<UnderlineIcon />} />
  <ToggleGroupControlOption value="line-through" label={<StrikethroughIcon />} />
</ToggleGroupControl>

// Text transform (if supports.typography.textTransform)
<ToggleGroupControl label="Transform" isBlock>
  <ToggleGroupControlOption value=""            label="Aa" />   {/* None */}
  <ToggleGroupControlOption value="uppercase"   label="AA" />
  <ToggleGroupControlOption value="lowercase"   label="aa" />
  <ToggleGroupControlOption value="capitalize"  label="Aa" />
</ToggleGroupControl>

// Text columns (Paragraph only, if supports.typography.textColumns)
<RangeControl label="Columns" value={attrs.style?.typography?.textColumns ?? 1}
  onChange={v => updateTypographyStyle('textColumns', v)}
  min={1} max={6} />
```

---

## Dimensions Panel

```tsx
// Padding (if supports.spacing.padding)
<BoxControl label="Padding"
  values={parseBoxValues(attrs.style?.spacing?.padding)}
  onChange={v => updateSpacingStyle('padding', serializeBoxValues(v))}
  units={['px', '%', 'em', 'rem', 'vw', 'vh']}
  allowReset />

// Margin (if supports.spacing.margin — top/bottom only if ['vertical'])
<BoxControl label="Margin"
  sides={Array.isArray(s.spacing.margin) ? marginAxesToSides(s.spacing.margin) : undefined}
  values={parseBoxValues(attrs.style?.spacing?.margin)}
  onChange={v => updateSpacingStyle('margin', serializeBoxValues(v))}
  units={['px', '%', 'em', 'rem', 'vw', 'auto']}
  allowReset />

// Block gap (if supports.spacing.blockGap && isContainer)
<UnitControl label="Block spacing"
  value={attrs.style?.spacing?.blockGap ?? ''}
  onChange={v => updateSpacingStyle('blockGap', v)}
  units={['px', '%', 'em', 'rem', 'vw']} />

// Min. height (if supports.dimensions.minHeight)
<UnitControl label="Min. height"
  value={attrs.style?.dimensions?.minHeight ?? ''}
  onChange={v => setDimension('minHeight', v)}
  units={['px', 'vh', 'vw', '%', 'em', 'rem']} />

// Aspect ratio (if supports.dimensions.aspectRatio)
// Appears in Dimensions panel when align is 'wide' or 'full' (22.5 behavior)
{(attrs.align === 'wide' || attrs.align === 'full') && (
  <SelectControl label="Aspect ratio"
    value={attrs.style?.dimensions?.aspectRatio ?? ''}
    options={[
      { label: 'Original', value: '' },
      { label: 'Square - 1:1', value: '1' },
      { label: '4:3', value: '4/3' },
      { label: '3:4', value: '3/4' },
      { label: 'Classic - 3:2', value: '3/2' },
      { label: 'Classic portrait - 2:3', value: '2/3' },
      { label: 'Wide - 16:9', value: '16/9' },
      { label: 'Tall - 9:16', value: '9/16' },
    ]}
    onChange={v => setDimension('aspectRatio', v || undefined)} />
)}
```

---

## Image Block — Full 22.5 Spec

```ts
// attributes
attributes: {
  url: { type: 'string', source: 'attribute', selector: 'img', attribute: 'src' },
  alt: { type: 'string', source: 'attribute', selector: 'img', attribute: 'alt', default: '' },
  caption: { type: 'string', source: 'html', selector: 'figcaption', default: '' },
  title: { type: 'string', source: 'attribute', selector: 'img', attribute: 'title' },
  href: { type: 'string' },
  rel: { type: 'string' },
  id: { type: 'number' },
  width: { type: 'number' },
  height: { type: 'number' },
  aspectRatio: { type: 'string' },
  scale: { type: 'string', enum: ['cover', 'contain'], default: 'cover' },
  sizeSlug: { type: 'string', default: 'full' },
  linkDestination: { type: 'string', default: 'none' },
  linkTarget: { type: 'string' },
  align: { type: 'string' },
  className: { type: 'string' },
  lightbox: { type: 'object', default: { enabled: false } },
  style: { type: 'object' },
}
```

```tsx
// ImageBlockEdit.tsx

// State: 'empty' | 'uploading' | 'editing'

// EMPTY STATE:
<figure className="wp-block-image">
  <div className="components-placeholder">
    <div className="components-placeholder__label">
      <ImageIcon size={20} /> Image
    </div>
    <DropZone onDrop={handleFileDrop} />
    <div className="components-placeholder__fieldset">
      <Button variant="primary" onClick={openFilePicker}>Upload</Button>
      <MediaUpload onUpload={onImageUpload} ... />
      <Button variant="secondary">Insert from URL</Button>
    </div>
  </div>
</figure>

// EDITING STATE:
<figure className={cn('wp-block-image', `align-${attrs.align}`,
                       attrs.aspectRatio && 'has-aspect-ratio')}>
  <div className="block-editor-block-controls">
    {/* Overlay toolbar — appears on image hover inside edit view */}
    <Button>Replace</Button>
    <Button>Edit alt text</Button>
  </div>
  <img src={attrs.url} alt={attrs.alt}
    style={{
      aspectRatio: attrs.aspectRatio,
      objectFit:   attrs.scale,
      width:       attrs.width  ? `${attrs.width}px`  : undefined,
      height:      attrs.height ? `${attrs.height}px` : undefined,
    }} />
  {/* Caption */}
  <RichText tagName="figcaption"
    value={attrs.caption} onChange={v => updateAttributes({ caption: v })}
    placeholder="Add caption" className="wp-element-caption"
    onSplit={() => {}} onMerge={() => {}} />
</figure>

// INSPECTOR CONTROLS (registered via useInspectorControls):
// Image settings panel:
//   - Alt text (TextControl with real-time preview update)
//   - Image size (SelectControl: Thumbnail/Medium/Large/Full — from attrs sizes)
//   - Image dimensions (UnitControl W + H, constrained proportionally, Reset link)
//   - Resolution (HiDPI toggle)
// Link settings panel:
//   - Link to: None / Media File / Attachment Page / Custom URL
//   - If Custom: URL input + open in new tab toggle + rel input
// Lightbox panel (22.5):
//   - ToggleControl "Expand on click"
```

---

## List View — 22.5 Enhanced

```tsx
// ListViewItem.tsx

<div className="block-editor-list-view-leaf"
  style={{ paddingLeft: `${depth * 16 + 8}px` }}
  onClick={() => selectBlock(block.clientId)}
  onContextMenu={openContextMenu}>

  {/* Expand/collapse chevron — only if has innerBlocks */}
  {block.innerBlocks.length > 0 && (
    <Button icon={isExpanded ? ChevronDown : ChevronRight}
      onClick={toggleExpand} className="block-editor-list-view-leaf__expander" />
  )}

  {/* Block icon: 16×16 */}
  <BlockIcon icon={def.icon} showColors={true} />

  {/* Block title */}
  <span className="block-editor-list-view-leaf__title">
    {getBlockLabel(block, def)}
  </span>

  {/* Content preview: italic, gray, truncated — NEW in 22.5 */}
  <span className="block-editor-list-view-leaf__preview">
    {getBlockContentPreview(block)}
  </span>

  {/* Hover actions */}
  <div className="block-editor-list-view-leaf__actions">
    <DropdownMenu icon={MoreVertical} ... />
  </div>
</div>

// getBlockContentPreview(block):
// paragraph  → strip HTML tags, first 40 chars
// heading    → strip HTML, full
// image      → attrs.alt || attrs.url?.split('/').pop() || '(no alt)'
// button     → attrs.text (strip HTML)
// list       → first list item text
// group      → `${innerBlocks.length} blocks`
// columns    → `${cols} columns`
// default    → ''
```

---

## Zoom-Out Mode

```tsx
// Ctrl+Shift+− toggles isZoomOut in store
// ZoomOutView.tsx

<motion.div
  className="block-editor-zoom-out"
  animate={{
    transform: isZoomOut ? `scale(${zoomLevel})` : 'scale(1)',
    transformOrigin: 'top center',
  }}
  transition={{ type: 'spring', stiffness: 250, damping: 35 }}>
  {/* Normal canvas content */}
</motion.div>

// In zoom-out mode:
// - All blocks show their outlines simultaneously (not just hovered/selected)
// - Click a block → exits zoom-out mode + selects that block
// - The outer container scrolls to reveal the full document
// - Toolbar shows a "Zoom out" indicator / exit button
```

---

## Command Palette

```tsx
// Ctrl/Cmd + K to open. Dark overlay (rgba(0,0,0,0.4)).
// Modal: 560px wide, top: 20% of viewport.

<Modal className="commands-modal" onClose={close}>
  <div className="commands-modal__search">
    <Search size={16} />
    <input autoFocus placeholder="Search commands…"
      value={query} onChange={e => setQuery(e.target.value)}
      onKeyDown={handleKeyNav} />
    {query && <Button onClick={() => setQuery('')}><X size={12} /></Button>}
  </div>
  <div className="commands-modal__list" ref={listRef}>
    {grouped.map(group => (
      <>
        <div className="commands-modal__group-label">{group.label}</div>
        {group.items.map(cmd => (
          <CommandItem key={cmd.id} item={cmd} isActive={activeId === cmd.id}
            onSelect={() => { cmd.callback(); close(); }} />
        ))}
      </>
    ))}
  </div>
</Modal>

// Built-in commands registered in CommandRegistry:
// Category: Blocks
//   Insert [BlockTitle] for each registered block
// Category: Selection (only when block selected)
//   Duplicate block
//   Delete block
//   Copy block
//   Insert before / Insert after
//   Turn into [available transforms]
// Category: View
//   Toggle distraction free
//   Toggle fullscreen
//   Toggle spotlight mode
//   Toggle zoom out
//   Toggle List View
// Category: Editor
//   Preferences
//   Keyboard shortcuts
```

---

## Keyboard Shortcuts — Complete Table

```ts
// useKeyboardShortcuts.ts
// Attach to document via useEffect.

const shortcuts: ShortcutDef[] = [
  { keys: 'ctrl+z',             action: () => store.undo() },
  { keys: 'ctrl+shift+z',       action: () => store.redo() },
  { keys: 'ctrl+k',             action: () => store.openCommandPalette() },
  { keys: 'ctrl+shift+j',       action: () => store.toggleListView() },
  { keys: 'ctrl+shift+d',       action: () => store.duplicateBlock(selectedId) },
  { keys: 'ctrl+alt+t',         action: () => store.insertBefore(selectedId) },
  { keys: 'ctrl+alt+y',         action: () => store.insertAfter(selectedId) },
  { keys: 'shift+alt+z',        action: () => store.removeBlock(selectedId) },
  { keys: 'ctrl+shift+alt+f',   action: () => store.toggleFullscreen() },
  { keys: 'ctrl+shift+\\',      action: () => store.toggleDistractionFree() },
  { keys: 'ctrl+shift+-',       action: () => store.toggleZoomOut() },
  { keys: 'escape',             action: () => handleEscape() },
  { keys: 'tab',                action: () => store.selectNextBlock(), preventDefault: true },
  { keys: 'shift+tab',          action: () => store.selectPreviousBlock(), preventDefault: true },
  { keys: 'ctrl+a',             action: () => handleSelectAll() },
  { keys: 'ctrl+shift+a',       action: () => store.selectAll() },
  { keys: 'ctrl+c',             action: () => handleCopyBlock() },  // only when no text selected
  { keys: 'ctrl+x',             action: () => handleCutBlock() },
  { keys: 'ctrl+shift+v',       action: () => handlePastePlain() },
  // Save
  { keys: 'ctrl+s',             action: () => triggerSave() },
  // Format (handled inside ProseMirror, not here)
];

// handleEscape():
//   if commandPaletteOpen → close palette
//   else if isInserterOpen → close inserter
//   else if selectedId && isEditingText → blur PM, keep block selected
//   else if selectedId → clearSelection
//   else if isFullscreen → exitFullscreen

// handleSelectAll():
//   if PM view focused + selection not all → select all in PM
//   else → store.selectAll()
```

---

## Snackbar System

```tsx
// Position: fixed bottom-left, pb: 24px, pl: 24px, z-index: 9999
// Max visible: 3. Queue FIFO. Auto-dismiss: 10s (dismissible) / 2s (info).

<AnimatePresence>
  {visibleNotices.map(notice => (
    <motion.div key={notice.id}
      initial={{ opacity: 0, y: 8, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.15 } }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      className="components-snackbar"
      style={{
        background: '#1e1e1e', color: '#fff',
        borderRadius: 2, padding: '12px 16px',
        maxWidth: 320, marginBottom: 8,
        boxShadow: 'var(--wp-elevation-z4)',
        display: 'flex', alignItems: 'center', gap: 12,
      }}>
      {notice.icon && <span>{notice.icon}</span>}
      <span className="components-snackbar__content">{notice.content}</span>
      {notice.actions?.map(action => (
        <Button key={action.label} variant="link" onClick={action.onClick}
          style={{ color: '#72aee6', fontWeight: 600 }}>
          {action.label}
        </Button>
      ))}
      {notice.isDismissible && (
        <Button icon={<X size={12} />} onClick={() => removeNotice(notice.id)}
          className="components-snackbar__dismiss" />
      )}
    </motion.div>
  ))}
</AnimatePresence>
```

---

## Save Helpers

### blocksToBlockMarkup

```ts
export function blocksToBlockMarkup(blocks: Block[]): string {
  return blocks.map(block => blockToMarkup(block)).join('\n');
}

function blockToMarkup(block: Block): string {
  const def = BlockRegistry.get(block.name);
  if (!def) return '';

  const attrs = serializeBlockAttributes(block.attributes, def.attributes);
  const attrsStr = Object.keys(attrs).length > 0 ? ` ${JSON.stringify(attrs)}` : '';
  const shortName = block.name.replace('core/', '');

  // Void block (no inner content, no innerBlocks)
  const hasContent = block.innerBlocks.length > 0 ||
    (def.save({ attributes: block.attributes, innerBlocks: block.innerBlocks })?.trim() !== '');

  if (!hasContent) {
    return `<!-- wp:${shortName}${attrsStr} /-->`;
  }

  const innerHtml = def.save({ attributes: block.attributes, innerBlocks: block.innerBlocks });
  const innerBlocks = block.innerBlocks.length > 0
    ? '\n' + blocksToBlockMarkup(block.innerBlocks) + '\n'
    : '';

  return [
    `<!-- wp:${shortName}${attrsStr} -->`,
    innerHtml,
    `<!-- /wp:${shortName} -->`,
  ].join('\n');
}

// serializeBlockAttributes: strips keys whose value === schema default
function serializeBlockAttributes(
  attrs: Record<string, any>,
  schema: Record<string, BlockAttributeSchema>
): Record<string, any> {
  const out: Record<string, any> = {};
  for (const [key, val] of Object.entries(attrs)) {
    if (schema[key]?.default !== undefined && schema[key].default === val) continue;
    if (val === undefined || val === null || val === '') continue;
    if (key.startsWith('__')) continue;   // skip internal attrs (__customCSS, __hideOn)
    out[key] = val;
  }
  return out;
}
```

### blocksToRawHtml

```ts
export function blocksToRawHtml(blocks: Block[]): string {
  return blocks.map(block => {
    const def = BlockRegistry.get(block.name);
    if (!def) return '';
    let html = def.save({ attributes: block.attributes, innerBlocks: block.innerBlocks });
    // Inject custom CSS
    if (block.attributes.__customCSS) {
      const scope = block.attributes.anchor
        ? `#${block.attributes.anchor}`
        : `.wp-block-${block.name.replace('core/', '')}`;
      html = `<style>${scope} { ${block.attributes.__customCSS} }</style>\n` + html;
    }
    return html;
  }).join('\n');
}
```

### parseBlockMarkup

```ts
const BLOCK_COMMENT_OPENER = /<!--\s+wp:([a-zA-Z0-9_-]+(?:\/[a-zA-Z0-9_-]+)?)(\s+(\{[\s\S]*?\}))?\s+(\/)?-->/g;
const BLOCK_COMMENT_CLOSER = /<!--\s+\/wp:([a-zA-Z0-9_-]+(?:\/[a-zA-Z0-9_-]+)?)\s+-->/g;

export function parseBlockMarkup(markup: string): Block[] {
  // Recursive descent parser over the comment tokens.
  // Returns Block[] with innerBlocks populated for nested blocks.
  // Implementation: tokenize → build tree via stack.
  // For blocks not in registry: create block with name, preserve innerHTML as originalContent.
}
```

---

## applyBlockSupports — Class + Style Generation

This function is called in `BlockWrapper` and `blocksToRawHtml` to compute the wrapper's
`className` and `style` from block attributes + supports:

```ts
export function applyBlockSupports(block: Block, def: BlockDefinition) {
  const { attributes: attrs } = block;
  const s = def.supports;
  const classes: string[] = [`wp-block-${block.name.replace('core/', '').replace('/', '-')}`];
  const style: React.CSSProperties = {};

  if (attrs.align)     classes.push(`align${attrs.align}`);
  if (attrs.className) classes.push(...attrs.className.split(' ').filter(Boolean));
  if (block.attributes.__customCSS) classes.push('has-custom-css');
  if (attrs.__hideOn?.desktop) classes.push('hide-on-desktop');
  if (attrs.__hideOn?.tablet)  classes.push('hide-on-tablet');
  if (attrs.__hideOn?.mobile)  classes.push('hide-on-mobile');

  // Colors
  if (attrs.textColor)       classes.push(`has-${attrs.textColor}-color`, 'has-text-color');
  if (attrs.backgroundColor) classes.push(`has-${attrs.backgroundColor}-background-color`, 'has-background');
  if (attrs.gradient)        classes.push(`has-${attrs.gradient}-gradient-background`, 'has-background');

  // Custom color via style object
  if (attrs.style?.color?.text)       style.color = attrs.style.color.text;
  if (attrs.style?.color?.background) style.backgroundColor = attrs.style.color.background;
  if (attrs.style?.color?.gradient)   style.backgroundImage = attrs.style.color.gradient;

  // Font size
  if (attrs.fontSize) classes.push(`has-${attrs.fontSize}-font-size`);
  if (attrs.style?.typography?.fontSize) style.fontSize = attrs.style.typography.fontSize;

  // Spacing via CSS custom properties (WP convention for padding/margin)
  if (attrs.style?.spacing?.padding) {
    const p = attrs.style.spacing.padding;
    style['--wp--style--block-gap'] = undefined;
    if (typeof p === 'string') {
      style.padding = p;
    } else {
      if (p.top)    style.paddingTop    = p.top;
      if (p.right)  style.paddingRight  = p.right;
      if (p.bottom) style.paddingBottom = p.bottom;
      if (p.left)   style.paddingLeft   = p.left;
    }
  }

  // ... margin, border, dimensions following same pattern

  return { className: classes.join(' '), style };
}
```

---

## Block Styles Panel

```tsx
// BlockStylesPanel.tsx
// Renders when def.styles.length > 0

<div className="block-editor-block-styles">
  {def.styles.map(blockStyle => (
    <div key={blockStyle.name}
      className={cn('block-editor-block-styles__item',
        { 'is-active': activeStyleName === blockStyle.name })}
      onClick={() => {
        const existing = (attrs.className ?? '').split(' ')
          .filter(c => !c.startsWith('is-style-'));
        updateAttributes({
          className: [...existing, `is-style-${blockStyle.name}`].join(' ').trim()
        });
      }}>
      {/* Mini preview of block with this style applied — render scaled-down */}
      <div className="block-editor-block-styles__item-preview"
        style={{ transform: 'scale(0.3)', transformOrigin: 'top left', pointerEvents: 'none' }}>
        <BlockPreview block={{ ...block, attributes: {
          ...attrs, className: `is-style-${blockStyle.name}`
        }}} />
      </div>
      <span className="block-editor-block-styles__item-label">{blockStyle.label}</span>
    </div>
  ))}
</div>
```

---

## Drag & Drop — Full Spec

```tsx
// DndContext wraps the entire EditorCanvas + ListView.

// Drag start:
//   - Set store.isDragging = true, store.dragClientId = clientId
//   - BlockWrapper shows 50% opacity ghost class

// DragOverlay (portal, follows cursor):
//   - Renders a simplified block preview
//   - 200px wide, truncated if needed
//   - box-shadow: var(--wp-elevation-z4), border-radius: 2px
//   - 0.95 scale from drag start with spring

// Drop zones (between blocks):
//   - 20px tall invisible hit zones
//   - On DragOver: animate blue line 2px h, scaleX 0 → 1 in 150ms, easeOut

// Acceptance rules:
//   - Block cannot be dropped inside itself
//   - Block cannot be dropped inside a lock='all' container
//   - core/column only accepts within core/columns

// After drop:
//   - store.moveBlockToPosition(...)
//   - store.isDragging = false
//   - Snackbar: none (silent operation)
```

---

## Preview Mode

```tsx
// PreviewFrame.tsx — device frame overlay

const DEVICE_FRAMES = {
  desktop: { width: '100%', height: '100%', transform: 'none' },
  tablet:  { width: '768px', height: '1024px',
             borderRadius: 12, border: '4px solid #1e1e1e',
             boxShadow: '0 20px 60px rgba(0,0,0,0.3)' },
  mobile:  { width: '390px', height: '844px',
             borderRadius: 40, border: '8px solid #1e1e1e',
             boxShadow: '0 20px 60px rgba(0,0,0,0.3)' },
};

// Renders blocksToRawHtml() inside an <iframe srcdoc={...}>
// Tablet/Mobile: centered with gray bg overlay
// Top bar: device switcher tabs + "Exit" button
// Entry animation: fade in + scale from 0.98 → 1
```

---

## Synced Patterns (Reusable Blocks)

```tsx
// Convert to synced pattern:
// Options menu → "Create pattern / reusable block"
// Modal: "Name this pattern" TextControl
// Saves to store.syncedPatterns[]

// SyncedPatternWrapper:
// Blue dashed border 2px (dashed)
// Top-left badge: sync icon + "Synced" label, same style as block name label
// Editing any instance → all instances re-render from shared blocks[]

// Detach: Options → "Detach pattern"
// Deep clones the blocks, removes syncedPatternId from attributes
// Does NOT affect other instances
```

---

## Drop-In Usage

```tsx
import { BlockEditor, type BlockEditorProps, type SavePayload } from './BlockEditor';

export function CMSEditor({ post }: { post: Post }) {
  return (
    <BlockEditor
      initialBlocks={post.blocks}
      initialTitle={post.title}
      initialPostSettings={{
        status: post.status,
        slug: post.slug,
        categories: post.categories,
        tags: post.tags,
        excerpt: post.excerpt,
      }}
      onSave={async ({ blocks, title, content, rawHtml, postSettings }) => {
        await fetch(`/api/posts/${post.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title, content, blocks, ...postSettings }),
        });
      }}
      onAutoSave={(payload) => {
        // Called on idle (3s debounce) — silent save
        localStorage.setItem('draft', JSON.stringify(payload));
      }}
      onImageUpload={async (file) => {
        const fd = new FormData();
        fd.append('file', file);
        return fetch('/api/media', { method: 'POST', body: fd }).then(r => r.json());
      }}
      onSearchCategories={(q) =>
        fetch(`/api/categories?search=${q}`).then(r => r.json())
      }
      onSearchTerms={(q) =>
        fetch(`/api/tags?search=${q}`).then(r => r.json())
      }
      patterns={themePatterns}
      settings={{
        colors: theme.colors,
        fontSizes: theme.fontSizes,
        fontFamilies: theme.fontFamilies,
        gradients: theme.gradients,
        maxWidth: 620,
        wideWidth: 1080,
        hasFixedToolbar: false,
        templateLock: false,
        allowedBlockTypes: true,
        canLockBlocks: true,
        generateAnchors: true,
      }}
    />
  );
}
```

---

## Implementation Order

Build in this sequence for testable milestones at each step:

1. **Types + Registry + applyBlockSupports** — no UI, pure logic, fully testable
2. **Zustand Store** — all slices, undo/redo tests with Vitest
3. **ProseMirror schema + keymaps** — standalone PM sandbox, verify split/merge/caret
4. **RichText component** — PM → React bridge, onChange sync, onSplit/onMerge wiring
5. **EditorLayout + TopToolbar shell** — chrome with no blocks
6. **Canvas + BlockWrapper** — hover/select outlines, empty editor with title
7. **Paragraph + Heading** — RichText integration, full keyboard flow
8. **Inserter** — search, categories, click-to-insert, slide animation
9. **Sidebar shell + Panel system + Document tab** — all document panels
10. **Block Sidebar + dynamic panel rendering** — ColorPanel, TypographyPanel first
11. **Image block** — upload, aspect ratio, focal point, inspector controls
12. **DimensionsPanel, BorderPanel, AdvancedPanel** — complete the panel set
13. **Columns + Column** — innerBlocks, resize, DnD
14. **Group / Row / Stack / Grid** — layout variation system
15. **Cover + MediaText** — focal point, overlay gradient
16. **List View** — tree, DnD, content previews
17. **@dnd-kit canvas DnD** — drag between positions, DragOverlay
18. **All remaining blocks** — Button, List, Quote, Embed, Table, etc.
19. **Command Palette + all keyboard shortcuts**
20. **Snackbar system + Block validation error cards**
21. **Zoom-out mode + Preview frame**
22. **Synced Patterns + Preferences Modal**
23. **blocksToBlockMarkup + blocksToRawHtml + parseBlockMarkup**
24. **Block Styles panel + BlockVariation isActive detection**
25. **Auto-save (3s debounce) + final fidelity polish pass**

---

## Fidelity Checklist (Build Against This)

### Visual
- [ ] All CSS tokens defined, no hardcoded color values in components
- [ ] Toolbar exactly 56px, all icon buttons exactly 36×36
- [ ] Popover shadow: exact 3-layer stack
- [ ] Block name label: 10px, 20px height, accent bg, 2px border-radius, -11px margin-top
- [ ] Canvas outer bg `#f0f0f0`, canvas card `#fff` with `0 0 0 1px rgba(0,0,0,.1)` shadow
- [ ] Sidebar panel headers: 13px, weight 600, 16px padding, `#e0e0e0` bottom border
- [ ] Focus rings: 2px accent, 2px offset — on every interactive element
- [ ] Transitions: hover state changes 50ms ease; panel open/close 300ms ease
- [ ] Inline inserter 24px; appender 36px — visually distinct
- [ ] Blue insertion line: 2px, scaleX animation from 0

### Behavioral
- [ ] Arrow key caret navigation crosses block boundaries
- [ ] Enter splits block at cursor, creates correct block type
- [ ] Backspace at pos 0 merges with previous block
- [ ] Delete at line end merges with next block
- [ ] `/` at line start opens slash inserter, not at non-start positions
- [ ] Pasting block markup triggers parseBlockMarkup and inserts as blocks
- [ ] Multi-select: Shift+click, Ctrl+A × 2, drag-select
- [ ] Undo/redo works across all operations including block moves
- [ ] Block validation on load — error card for invalid blocksgi
- [ ] Synced pattern edits propagate to all instances
- [ ] Document sidebar state persists through block operations
- [ ] All 25 keyboard shortcuts functional
- [ ] Command palette filters all commands, keyboard navigable

### Architecture
- [ ] No @wordpress/* dependencies anywhere
- [ ] Multiple BlockEditor instances on same page don't share state
- [ ] customBlocks prop successfully registers and renders external blocks
- [ ] onSave receives valid blocksToBlockMarkup output parseable by parseBlockMarkup
- [ ] TypeScript strict mode: zero `any` except explicitly typed generics
