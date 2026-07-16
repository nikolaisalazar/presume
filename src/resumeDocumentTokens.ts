export const RESUME_DOCUMENT = {
  pageWidthPx: 816,
  pageHeightPx: 1056,
  pageMarginXPx: 48,
  pageMarginYPx: 48,
  bulletIndentPx: 16,
  fontFamily: 'EB Garamond',
  fontSizeNamePx: 24,
  fontSizeContactPx: 10,
  fontSizeSectionPx: 11,
  fontSizeEntryTitlePx: 11,
  fontSizeEntrySubtitlePx: 10,
  fontSizeBulletPx: 10,
  nameMarginBottomPx: 4,
  contactGapPx: 12,
  sectionMarginTopPx: 6,
  sectionHeadingGapPx: 1,
  sectionRuleWidthPx: 1,
  sectionMarginBottomPx: 3,
  entryMarginTopPx: 4,
  bulletListMarginYPx: 2,
} as const

export const RESUME_LIVE_LAYOUT_SCALE = 4.5
export const RESUME_LIVE_PRESENTATION_SCALE = 1 / RESUME_LIVE_LAYOUT_SCALE

export function pxToPt(px: number): number {
  return px * 0.75
}
