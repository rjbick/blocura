// ─── Block Model ──────────────────────────────────────────────────────────────

export interface Block<A = Record<string, unknown>> {
  clientId: string;          // UUID v4
  name: string;              // "core/paragraph"
  attributes: A;
  innerBlocks: Block[];
  isValid?: boolean;
  originalContent?: string;
}

// ─── Block Definition ─────────────────────────────────────────────────────────

export interface BlockDefinition {
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
  providesContext?: Record<string, string>;
  usesContext?: string[];
  edit: React.ComponentType<BlockEditProps>;
  save: (props: { attributes: any; innerBlocks?: Block[] }) => string;
  deprecated?: DeprecatedBlock[];
  merge?: (baseAttrs: any, mergeAttrs: any) => any;
  split?: (value: any) => [any, any];
}

export type BlockCategory =
  | 'text' | 'media' | 'design' | 'widgets'
  | 'theme' | 'embed' | '_unstable';

// ─── Block Attribute Schema ───────────────────────────────────────────────────

export interface BlockAttributeSchema {
  type: 'string' | 'number' | 'boolean' | 'object' | 'array' | 'null';
  default?: unknown;
  source?: 'attribute' | 'html' | 'text' | 'children' | 'query' | 'tag';
  selector?: string;
  attribute?: string;
  query?: Record<string, BlockAttributeSchema>;
  enum?: unknown[];
  items?: BlockAttributeSchema;
  role?: string;
}

// ─── Block Supports ───────────────────────────────────────────────────────────

export interface BlockSupports {
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

export type AlignValue = 'left' | 'center' | 'right' | 'wide' | 'full';
export type SpacingAxis = 'top' | 'right' | 'bottom' | 'left' | 'vertical' | 'horizontal';

export interface LayoutConfig {
  type: 'default' | 'flex' | 'grid' | 'constrained';
  contentSize?: string;
  wideSize?: string;
  justifyContent?: string;
  orientation?: 'horizontal' | 'vertical';
}

// ─── Block Variation / Style ──────────────────────────────────────────────────

export interface BlockVariation {
  name: string;
  title: string;
  description?: string;
  icon?: string | React.ReactNode;
  isDefault?: boolean;
  attributes?: Record<string, unknown>;
  innerBlocks?: unknown[];
  isActive?: (attrs: Record<string, unknown>) => boolean;
  scope?: string[];
  keywords?: string[];
}

export interface BlockStyle {
  name: string;
  label: string;
  isDefault?: boolean;
}

export interface BlockTransforms {
  from?: BlockTransform[];
  to?: BlockTransform[];
}

export interface BlockTransform {
  type: 'block' | 'enter' | 'prefix' | 'raw' | 'files' | 'shortcode';
  blocks?: string[];
  transform?: (attrs: Record<string, unknown>, innerBlocks?: Block[]) => Block | Block[];
  isMatch?: (attrs: Record<string, unknown>) => boolean;
}

export interface DeprecatedBlock {
  attributes?: Record<string, BlockAttributeSchema>;
  supports?: BlockSupports;
  migrate?: (attrs: Record<string, unknown>) => Record<string, unknown>;
  save: (props: { attributes: Record<string, unknown> }) => string;
}

// ─── Block Edit Props ─────────────────────────────────────────────────────────

export interface BlockEditProps<A = any> {
  clientId: string;
  attributes: A;
  setAttributes: (attrs: Partial<A>) => void;
  isSelected: boolean;
  innerBlocks?: Block[];
  context?: Record<string, unknown>;
  insertBlocksAfter?: (blocks: Block[]) => void;
  onReplace?: (blocks: Block | Block[]) => void;
  onRemove?: (forward?: boolean) => void;
  mergeBlocks?: (forward: boolean) => void;
  onNavigateOut?: (direction: 'up' | 'down') => void;
  initialPosition?: -1 | 0 | 1 | null;
}

// ─── Editor State ─────────────────────────────────────────────────────────────

export interface EditorState {
  blocks: Block[];
  title: string;

  // Selection
  selectedClientIds: string[];
  hoveredClientId: string | null;
  insertionPoint: InsertionPoint | null;
  focusedClientId: string | null;
  selectionInitialPosition: -1 | 0 | 1 | null;
  selectionStart: BlockSelectionPoint | null;
  selectionEnd: BlockSelectionPoint | null;

  // Panels
  sidebarOpen: boolean;
  sidebarTab: 'document' | 'block';
  listViewOpen: boolean;
  inserterOpen: boolean;

  // Modes
  isCodeMode: boolean;
  previewDevice: 'desktop' | 'tablet' | 'mobile' | null;
  isFullscreen: boolean;
  isDistractionFree: boolean;
  isSpotlightMode: boolean;
  isZoomOut: boolean;
  zoomLevel: number;

  // Drag
  isDragging: boolean;
  dragClientId: string | null;

  // Command Palette
  commandPaletteOpen: boolean;

  // Preferences
  preferences: EditorPreferences;

  // History
  history: HistoryStack;

  // Notices
  notices: Notice[];

  // Synced Patterns
  syncedPatterns: SyncedPattern[];

  // Post settings
  postSettings: PostSettings;
}

export interface BlockSelectionPoint {
  clientId: string;
  attributeKey: string;
  offset: number;
}

export interface InsertionPoint {
  rootClientId: string | null;
  index: number;
}

export interface EditorPreferences {
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

export interface PostSettings {
  status: 'draft' | 'publish' | 'private' | 'pending' | 'future';
  visibility: 'public' | 'private' | 'password';
  password?: string;
  scheduledDate?: string;
  slug: string;
  permalink?: string;
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
  includeTitleInContent: boolean;
  meta: Record<string, unknown>;
}

export interface Term {
  id: number;
  name: string;
  slug: string;
}

export interface LinkablePage {
  id?: string | number;
  title: string;
  url: string;
  type?: string;
}

export interface SearchPagesOptions {
  query: string;
  page: number;
  perPage: number;
  signal?: AbortSignal;
}

export interface SearchPagesResponse {
  pages: LinkablePage[];
  nextPage?: number | null;
  total?: number;
}

export type SearchPagesResult = LinkablePage[] | SearchPagesResponse;

export interface HistoryStack {
  past: HistoryEntry[];
  present: HistoryEntry;
  future: HistoryEntry[];
}

export interface HistoryEntry {
  blocks: Block[];
  selection: {
    clientIds: string[];
    focusedClientId: string | null;
    initialPosition: -1 | 0 | 1 | null;
  };
  lastModifiedClientId: string | null;
}

export interface Notice {
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

export interface NoticeAction {
  label: string;
  onClick?: () => void;
  url?: string;
  className?: string;
}

// ─── Rich Text ────────────────────────────────────────────────────────────────

export interface RichTextProps {
  tagName?: string;
  value: string;
  onChange: (html: string) => void;
  onSplit?: (before: string, after: string) => void;
  onMerge?: (forward: boolean) => void;
  onReplace?: (blocks: Block[]) => void;
  onRemove?: (forward: boolean) => void;
  placeholder?: string;
  allowedFormats?: string[];
  disableLineBreaks?: boolean;
  preserveWhiteSpace?: boolean;
  isSelected?: boolean;
  identifier?: string;
  readOnly?: boolean;
  className?: string;
  style?: React.CSSProperties;
  __unstableAllowPrefixTransforms?: boolean;
  onNavigateOut?: (direction: 'up' | 'down') => void;
  initialPosition?: -1 | 0 | 1 | null;
}

// ─── Patterns ─────────────────────────────────────────────────────────────────

export interface Pattern {
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

export interface LatestPostItem {
  id?: string | number;
  title: string;
  date?: string;
  excerpt?: string;
  url?: string;
}

export interface LatestCommentItem {
  id?: string | number;
  author: string;
  avatarUrl?: string;
  date?: string;
  excerpt?: string;
  postTitle?: string;
  postUrl?: string;
}

export interface RssFeedItem {
  id?: string | number;
  title: string;
  url?: string;
  author?: string;
  date?: string;
  excerpt?: string;
}

export interface RssFeedResult {
  sourceLabel?: string;
  items: RssFeedItem[];
}

export interface SyncedPattern {
  id: string;
  clientId: string;
  title: string;
  blocks: Block[];
  modified: boolean;
}

export interface AiAssistantContext {
  title: string;
  blocks: Block[];
  rawHtml: string;
  selectedClientIds: string[];
  selectedBlocks: Block[];
}

export interface AiAssistantRequest {
  prompt: string;
  context: AiAssistantContext;
}

export type AiAssistantResponse =
  | {
      type: 'text';
      text: string;
      message?: string;
    }
  | {
      type: 'html';
      html: string;
      message?: string;
    }
  | {
      type: 'blocks';
      blocks: Block[] | string;
      message?: string;
    };

// ─── Save / Output ────────────────────────────────────────────────────────────

export interface SavePayload {
  blocks: Block[];
  blocksJson: string;
  title: string;
  rawHtml: string;
  postSettings: PostSettings;
  metadata: Record<string, unknown>;
  images: ImageAsset[];
  tailwindSafelist: string[];
  titleIncludedInContent: boolean;
}

export interface ImageAsset {
  url: string;
  alt?: string;
  id?: string | number;
  width?: number;
  height?: number;
  caption?: string;
  blockClientId?: string;
  blockName?: string;
}

// ─── Component Props ──────────────────────────────────────────────────────────

export interface BlockEditorProps {
  initialBlocks?: Block[];
  initialBlocksJson?: Block[] | string;
  initialRawHtml?: string;
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
  onSearchPages?: (options: SearchPagesOptions) => Promise<SearchPagesResult>;
  onFetchLatestPosts?: (options: {
    postsToShow: number;
    order: 'desc' | 'asc';
    displayPostDate: boolean;
    displayExcerpt: boolean;
    excerptLength: number;
  }) => Promise<LatestPostItem[]>;
  onFetchLatestComments?: (options: {
    commentsToShow: number;
    displayAvatar: boolean;
    displayDate: boolean;
    displayExcerpt: boolean;
  }) => Promise<LatestCommentItem[]>;
  onFetchRssFeed?: (options: {
    feedURL: string;
    itemsToShow: number;
    displayAuthor: boolean;
    displayDate: boolean;
    displayExcerpt: boolean;
  }) => Promise<RssFeedResult | RssFeedItem[]>;
  onPromptAI?: (request: AiAssistantRequest) => Promise<AiAssistantResponse>;
  onResolvePreviewAssetUrl?: (
    url: string,
    context: PreviewAssetUrlContext
  ) => string | null | undefined;
  patterns?: Pattern[];
  customBlocks?: BlockDefinition[];
  settings?: Partial<EditorSettings>;
  className?: string;
  contentRef?: React.RefObject<HTMLDivElement>;
}

export interface EditorSettings {
  title: string;
  hasFixedToolbar: boolean;
  imageEditing: boolean;
  maxWidth: number;
  wideWidth: number;
  bodyPlaceholder: string;
  titlePlaceholder: string;
  contentMode?: 'document' | 'body';
  showDocumentMetadata?: boolean;
  allowedBlockTypes: string[] | true;
  templateLock: false | 'all' | 'insert' | 'contentOnly';
  template?: [string, Record<string, unknown>, unknown[]?][];
  supportsLayout: boolean;
  supportsTemplateMode: boolean;
  colors: EditorColor[];
  gradients: EditorGradient[];
  fontSizes: EditorFontSize[];
  fontFamilies?: EditorFontFamily[];
  defaultEditorStyles?: string;
  locale: string;
  isRTL: boolean;
  canLockBlocks: boolean;
  canEditBlocks: boolean;
  generateAnchors: boolean;
  __experimentalFeatures?: {
    color?: { defaultPalette?: boolean; defaultGradients?: boolean };
    typography?: { defaultFontSizes?: boolean; fluid?: boolean };
    layout?: { definitions?: Record<string, unknown> };
  };
  preview?: PreviewSettings;
  postType?: string;
  logo?: string;
}

export interface PreviewSettings {
  /**
   * External stylesheet URLs loaded into preview documents.
   * Use this to load your site's Tailwind/Bootstrap/custom CSS bundle.
   */
  stylesheets?: string[];
  /**
   * Optional script URLs loaded into preview documents.
   */
  scripts?: string[];
  /**
   * Optional raw markup injected into <head> (for meta tags or inline CSS).
   */
  headHtml?: string;
  /**
   * Optional class name added to the preview <html>.
   */
  htmlClassName?: string;
  /**
   * Optional class name added to the preview <body>.
   */
  bodyClassName?: string;
  /**
   * Optional base URL for resolving relative links/assets.
   */
  baseUrl?: string;
  /**
   * Optional body template markup with {{content}} placeholder.
   * Example: `<main class="site-content">{{content}}</main>`.
   */
  templateHtml?: string;
  /**
   * Keep built-in fallback preview CSS.
   * Set false to rely entirely on site stylesheets.
   */
  includeDefaultStyles?: boolean;
}

export interface PreviewAssetUrlContext {
  tagName: string;
  attribute: string;
}

export interface EditorColor    { name: string; slug: string; color: string; }
export interface EditorGradient { name: string; slug: string; gradient: string; }
export interface EditorFontSize { name: string; slug: string; size: string | number; fluid?: { min: string; max: string; }; }
export interface EditorFontFamily { name: string; slug: string; fontFamily: string; fontFace?: unknown[]; }

// ─── Sidebar Panel ────────────────────────────────────────────────────────────

export interface SidebarPanel {
  id: string;
  title: string | null;
  defaultOpen?: boolean;
  isSlot?: boolean;
  component?: React.ComponentType<SidebarPanelProps>;
}

export interface SidebarPanelProps {
  block: Block;
  def: BlockDefinition;
  attributes: Record<string, unknown>;
  updateAttributes: (attrs: Record<string, unknown>) => void;
  settings: Partial<EditorSettings>;
}
