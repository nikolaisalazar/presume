import {
  Document,
  Font,
  Page,
  StyleSheet,
  Text,
  View,
} from '@react-pdf/renderer'
import type { Resume } from '../types'
import { RESUME_DOCUMENT, pxToPt } from '../resumeDocumentTokens'
import regularFontUrl from '../assets/fonts/EBGaramond-Variable.ttf?url'
import italicFontUrl from '../assets/fonts/EBGaramond-Italic-Variable.ttf?url'

const PDF_FONT_FAMILY = 'Presume EB Garamond'
const fontSource = (assetUrl: string, filename: string) =>
  import.meta.env.MODE === 'test'
    ? `${process.cwd()}/src/assets/fonts/${filename}`
    : assetUrl

Font.register({
  family: PDF_FONT_FAMILY,
  fonts: [
    {
      src: fontSource(regularFontUrl, 'EBGaramond-Variable.ttf'),
      fontWeight: 400,
    },
    {
      src: fontSource(regularFontUrl, 'EBGaramond-Variable.ttf'),
      fontWeight: 700,
    },
    {
      src: fontSource(italicFontUrl, 'EBGaramond-Italic-Variable.ttf'),
      fontStyle: 'italic',
      fontWeight: 400,
    },
    {
      src: fontSource(italicFontUrl, 'EBGaramond-Italic-Variable.ttf'),
      fontStyle: 'italic',
      fontWeight: 700,
    },
  ],
})

function scaledPt(px: number, globalScale: number): number {
  return pxToPt(px * globalScale)
}

function createStyles(globalScale: number) {
  return StyleSheet.create({
    page: {
      paddingTop: pxToPt(RESUME_DOCUMENT.pageMarginYPx),
      paddingRight: pxToPt(RESUME_DOCUMENT.pageMarginXPx),
      paddingBottom: pxToPt(RESUME_DOCUMENT.pageMarginYPx),
      paddingLeft: pxToPt(RESUME_DOCUMENT.pageMarginXPx),
      backgroundColor: '#ffffff',
      color: '#000000',
      fontFamily: PDF_FONT_FAMILY,
    },
    name: {
      fontSize: scaledPt(RESUME_DOCUMENT.fontSizeNamePx, globalScale),
      fontWeight: 700,
      lineHeight: 1.2,
      textAlign: 'center',
      marginBottom: pxToPt(RESUME_DOCUMENT.nameMarginBottomPx),
    },
    contact: {
      display: 'flex',
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'center',
      columnGap: pxToPt(RESUME_DOCUMENT.contactGapPx),
    },
    contactItem: {
      fontSize: scaledPt(RESUME_DOCUMENT.fontSizeContactPx, globalScale),
    },
    section: {
      marginTop: pxToPt(RESUME_DOCUMENT.sectionMarginTopPx),
    },
    sectionTitle: {
      fontSize: scaledPt(RESUME_DOCUMENT.fontSizeSectionPx, globalScale),
      fontWeight: 700,
      textTransform: 'uppercase',
      letterSpacing: scaledPt(
        RESUME_DOCUMENT.fontSizeSectionPx * 0.06,
        globalScale
      ),
      paddingBottom: pxToPt(RESUME_DOCUMENT.sectionHeadingGapPx),
      borderBottomWidth: pxToPt(RESUME_DOCUMENT.sectionRuleWidthPx),
      borderBottomColor: '#000000',
      marginBottom: pxToPt(RESUME_DOCUMENT.sectionMarginBottomPx),
    },
    entry: {
      marginTop: pxToPt(RESUME_DOCUMENT.entryMarginTopPx),
    },
    row: {
      display: 'flex',
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'baseline',
    },
    rowPrimary: {
      flexGrow: 1,
      flexShrink: 1,
      paddingRight: pxToPt(8),
    },
    title: {
      fontSize: scaledPt(RESUME_DOCUMENT.fontSizeEntryTitlePx, globalScale),
      fontWeight: 700,
    },
    date: {
      fontSize: scaledPt(RESUME_DOCUMENT.fontSizeEntryTitlePx, globalScale),
      fontStyle: 'italic',
      flexShrink: 0,
    },
    subtitle: {
      fontSize: scaledPt(RESUME_DOCUMENT.fontSizeEntrySubtitlePx, globalScale),
      fontStyle: 'italic',
    },
    location: {
      fontSize: scaledPt(RESUME_DOCUMENT.fontSizeEntrySubtitlePx, globalScale),
      fontStyle: 'italic',
      flexShrink: 0,
    },
    bullets: {
      marginTop: pxToPt(RESUME_DOCUMENT.bulletListMarginYPx),
      marginBottom: pxToPt(RESUME_DOCUMENT.bulletListMarginYPx),
      paddingLeft: pxToPt(RESUME_DOCUMENT.bulletIndentPx),
    },
    bulletRow: {
      display: 'flex',
      flexDirection: 'row',
      fontSize: scaledPt(RESUME_DOCUMENT.fontSizeBulletPx, globalScale),
      lineHeight: 1.3,
    },
    bulletMarker: {
      width: pxToPt(8),
      flexShrink: 0,
    },
    bulletText: {
      flexGrow: 1,
      flexShrink: 1,
    },
  })
}

export function ResumePdfDocument({
  resume,
  globalScale,
}: {
  resume: Resume
  globalScale: number
}) {
  const styles = createStyles(globalScale)

  return (
    <Document title={`${resume.name || 'Resume'} — Presume`}>
      <Page size="LETTER" style={styles.page} wrap>
        <Text style={styles.name}>{resume.name}</Text>
        <View style={styles.contact}>
          {resume.contact.filter(Boolean).map((item, index) => (
            <Text key={index} style={styles.contactItem}>{item}</Text>
          ))}
        </View>

        {resume.sections.map((section, sectionIndex) => (
          <View
            key={sectionIndex}
            style={styles.section}
            minPresenceAhead={pxToPt(28)}
          >
            <Text style={styles.sectionTitle}>{section.title}</Text>
            {section.entries.map((entry, entryIndex) => (
              <View key={entryIndex} style={styles.entry}>
                {Boolean(entry.title || entry.dateRange) && (
                  <View style={styles.row}>
                    <Text style={[styles.title, styles.rowPrimary]}>{entry.title}</Text>
                    <Text style={styles.date}>{entry.dateRange}</Text>
                  </View>
                )}
                {Boolean(entry.subtitle || entry.location) && (
                  <View style={styles.row}>
                    <Text style={[styles.subtitle, styles.rowPrimary]}>{entry.subtitle}</Text>
                    <Text style={styles.location}>{entry.location}</Text>
                  </View>
                )}
                {entry.bullets.length > 0 && (
                  <View style={styles.bullets}>
                    {entry.bullets.filter(Boolean).map((bullet, bulletIndex) => (
                      <View key={bulletIndex} style={styles.bulletRow}>
                        <Text style={styles.bulletMarker}>•</Text>
                        <Text style={styles.bulletText}>{bullet}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            ))}
          </View>
        ))}
      </Page>
    </Document>
  )
}
