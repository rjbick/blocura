import type { ReactNode } from 'react'
import {
  Anchor,
  Calendar,
  Clock,
  Cloud,
  FileText,
  Flame,
  Image,
  LayoutDashboard,
  LayoutGrid,
  Shield,
  Ship,
  ShoppingBag,
  Users,
} from 'lucide-react'

const ICONS: Record<string, typeof Anchor> = {
  anchor: Anchor,
  calendar: Calendar,
  clock: Clock,
  cloud: Cloud,
  dashboard: LayoutDashboard,
  'document-text': FileText,
  'file-text': FileText,
  fire: Flame,
  image: Image,
  layout: LayoutGrid,
  shield: Shield,
  ship: Ship,
  'shopping-bag': ShoppingBag,
  users: Users,
}

/**
 * Resolve a kebab-case icon name to a rendered icon element, for hosts that
 * define custom blocks with string icon names (e.g. CMS module blocks).
 * Unknown names fall back to a generic layout glyph.
 */
export function blockIconFromName(name: string | undefined, size = 20): ReactNode {
  const IconComponent = (name && ICONS[name]) || LayoutGrid
  return <IconComponent size={size} />
}
