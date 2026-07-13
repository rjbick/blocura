import { BlockRegistry } from './BlockRegistry'
import { paragraphBlock } from './blocks/paragraph'
import { headingBlock } from './blocks/heading'
import { separatorBlock } from './blocks/separator'
import { spacerBlock } from './blocks/spacer'
import { imageBlock } from './blocks/image'
import { galleryBlock } from './blocks/gallery'
import { videoBlock } from './blocks/video'
import { audioBlock } from './blocks/audio'
import { fileBlock } from './blocks/file'
import { coverBlock } from './blocks/cover'
import { mediaTextBlock } from './blocks/media-text'
import { embedBlock } from './blocks/embed'
import { listBlock } from './blocks/list'
import { listItemBlock } from './blocks/list-item'
import { quoteBlock } from './blocks/quote'
import { codeBlock } from './blocks/code'
import { preformattedBlock } from './blocks/preformatted'
import { pullquoteBlock } from './blocks/pullquote'
import { verseBlock } from './blocks/verse'
import { tableBlock } from './blocks/table'
import { htmlBlock } from './blocks/html'
import { iconBlock } from './blocks/icon'
import { gridBlock } from './blocks/grid'
import { mapBlock } from './blocks/map'
import { accordionBlock } from './blocks/accordion'
import { shortcodeBlock } from './blocks/shortcode'
import { classicBlock } from './blocks/classic'
import { searchBlock } from './blocks/search'
import { latestPostsBlock } from './blocks/latest-posts'
import { latestCommentsBlock } from './blocks/latest-comments'
import { calendarBlock } from './blocks/calendar'
import { archivesBlock } from './blocks/archives'
import { categoriesBlock } from './blocks/categories'
import { tagCloudBlock } from './blocks/tag-cloud'
import { rssBlock } from './blocks/rss'
import { pageListBlock } from './blocks/page-list'
import { detailsBlock } from './blocks/details'
import { readMoreBlock } from './blocks/read-more'
import { socialLinksBlock } from './blocks/social-links'
import { socialLinkBlock } from './blocks/social-link'
import { buttonBlock } from './blocks/button'
import { buttonsBlock } from './blocks/buttons'
import { navigationBlock } from './blocks/navigation'
import { navigationLinkBlock } from './blocks/navigation-link'
import { groupBlock } from './blocks/group'
import { columnsBlock, columnBlock } from './blocks/columns'
import { sectionBlock } from './blocks/section'

let registered = false

export function registerCoreBlocks() {
  if (registered) return
  registered = true

  // Text blocks
  BlockRegistry.register(paragraphBlock)
  BlockRegistry.register(headingBlock)
  BlockRegistry.register(listBlock)
  BlockRegistry.register(listItemBlock)
  BlockRegistry.register(quoteBlock)
  BlockRegistry.register(pullquoteBlock)
  BlockRegistry.register(codeBlock)
  BlockRegistry.register(preformattedBlock)
  BlockRegistry.register(verseBlock)
  BlockRegistry.register(detailsBlock)

  // Media blocks
  BlockRegistry.register(imageBlock)
  BlockRegistry.register(galleryBlock)
  BlockRegistry.register(videoBlock)
  BlockRegistry.register(audioBlock)
  BlockRegistry.register(fileBlock)
  BlockRegistry.register(coverBlock)
  BlockRegistry.register(mediaTextBlock)
  BlockRegistry.register(embedBlock)

  // Design blocks
  BlockRegistry.register(separatorBlock)
  BlockRegistry.register(spacerBlock)
  BlockRegistry.register(tableBlock)
  BlockRegistry.register(readMoreBlock)
  BlockRegistry.register(buttonBlock)
  BlockRegistry.register(buttonsBlock)
  BlockRegistry.register(navigationBlock)
  BlockRegistry.register(navigationLinkBlock)
  BlockRegistry.register(groupBlock)
  BlockRegistry.register(columnsBlock)
  BlockRegistry.register(columnBlock)
  BlockRegistry.register(sectionBlock)

  // Widgets
  BlockRegistry.register(htmlBlock)
  BlockRegistry.register(iconBlock)
  BlockRegistry.register(gridBlock)
  BlockRegistry.register(mapBlock)
  BlockRegistry.register(accordionBlock)
  BlockRegistry.register(shortcodeBlock)
  BlockRegistry.register(classicBlock)
  BlockRegistry.register(searchBlock)
  BlockRegistry.register(latestPostsBlock)
  BlockRegistry.register(latestCommentsBlock)
  BlockRegistry.register(calendarBlock)
  BlockRegistry.register(archivesBlock)
  BlockRegistry.register(categoriesBlock)
  BlockRegistry.register(tagCloudBlock)
  BlockRegistry.register(rssBlock)
  BlockRegistry.register(pageListBlock)
  BlockRegistry.register(socialLinksBlock)
  BlockRegistry.register(socialLinkBlock)
}
