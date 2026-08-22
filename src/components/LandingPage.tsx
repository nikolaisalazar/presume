import { useState, type MouseEvent, type ReactNode } from 'react'
import { BrandMark } from '@/components/BrandMark'
import { Button } from '@/components/ui/button'

export interface LandingPageProps {
  hasSavedResume: boolean
  onOpenEditor: () => void
}

interface ProductCaptureProps {
  kind: 'editor' | 'fit' | 'review'
  alt: string
  desktopBase: string
  desktopWidth: number
  desktopHeight: number
  narrowBase: string
  narrowWidth: number
  narrowHeight: number
  breakpoint: number
  priority?: boolean
}

const LANDING_ASSET_ROOT = `${import.meta.env.BASE_URL}landing`

function ProductCapture({
  kind,
  alt,
  desktopBase,
  desktopWidth,
  desktopHeight,
  narrowBase,
  narrowWidth,
  narrowHeight,
  breakpoint,
  priority = false,
}: ProductCaptureProps) {
  const [failed, setFailed] = useState(false)
  const label = `${kind === 'editor' ? 'Editor' : kind === 'fit' ? 'Fit' : 'Review'} product capture unavailable`

  return (
    <div className={`landing-capture landing-capture--${kind}`} data-capture-state={failed ? 'unavailable' : 'ready'}>
      {failed ? (
        <div className="landing-capture__fallback" role="status" aria-label={label}>
          Product capture unavailable
        </div>
      ) : (
        <picture>
          <source
            media={`(max-width: ${breakpoint}px)`}
            srcSet={`${LANDING_ASSET_ROOT}/${narrowBase}.png 1x, ${LANDING_ASSET_ROOT}/${narrowBase}@2x.png 2x`}
            width={narrowWidth}
            height={narrowHeight}
          />
          <source
            media={`(min-width: ${breakpoint + 1}px)`}
            srcSet={`${LANDING_ASSET_ROOT}/${desktopBase}.png 1x, ${LANDING_ASSET_ROOT}/${desktopBase}@2x.png 2x`}
            width={desktopWidth}
            height={desktopHeight}
          />
          <img
            src={`${LANDING_ASSET_ROOT}/${desktopBase}.png`}
            srcSet={`${LANDING_ASSET_ROOT}/${desktopBase}.png 1x, ${LANDING_ASSET_ROOT}/${desktopBase}@2x.png 2x`}
            width={desktopWidth}
            height={desktopHeight}
            alt={alt}
            loading={priority ? 'eager' : 'lazy'}
            {...(priority ? { fetchpriority: 'high' } : {})}
            decoding="async"
            onError={() => setFailed(true)}
          />
        </picture>
      )}
    </div>
  )
}

function EditorLink({ children, onOpenEditor }: { children: ReactNode; onOpenEditor: () => void }) {
  const openEditor = (event: MouseEvent<HTMLAnchorElement>) => {
    if (
      event.defaultPrevented
      || event.button !== 0
      || event.metaKey
      || event.ctrlKey
      || event.shiftKey
      || event.altKey
    ) return

    event.preventDefault()
    onOpenEditor()
  }

  return (
    <a href="/presume/editor/" onClick={openEditor}>
      {children}
    </a>
  )
}

function editorActionLabel(hasSavedResume: boolean, freshLabel: string) {
  return hasSavedResume ? 'Continue editing' : freshLabel
}

export function LandingPage({ hasSavedResume, onOpenEditor }: LandingPageProps) {
  return (
    <div className="landing-page" id="top">
      <a className="landing-skip" href="#main">Skip to content</a>

      <header className="landing-header landing-shell">
        <nav className="landing-nav" aria-label="Primary navigation">
          <a className="landing-brand" href="/presume/" aria-label="Presume home">
            <BrandMark />
            <span>Presume</span>
          </a>
          <div className="landing-nav__links">
            <a href="#fit">Fit</a>
            <a href="#boundaries">Design boundaries</a>
            <EditorLink onOpenEditor={onOpenEditor}>Editor ↗</EditorLink>
          </div>
        </nav>
      </header>

      <main id="main" className="landing-main" tabIndex={-1}>
        <section className="landing-hero landing-shell" data-landing-chapter="hero" aria-labelledby="landing-title">
          <div className="landing-hero__copy">
            <p className="landing-eyebrow"><span className="landing-hero__brand-prefix">Presume · </span>Local-first resume workbench</p>
            <h1 id="landing-title">Your resume should stay yours.</h1>
            <p className="landing-hero__lede">Edit the finished Letter page directly. Presume keeps page and line constraints visible, saves the resume in this browser, and exports a stable PDF. Review remains advisory and never changes the document.</p>
            <div className="landing-hero__action">
              <Button size="lg" onClick={onOpenEditor}>
                {editorActionLabel(hasSavedResume, 'Open the editor')}
              </Button>
              <span>Saved in this browser</span>
            </div>
          </div>
          <figure className="landing-product-stage">
            <div className="landing-product-meta"><span>Working editor crop</span><span>Sample resume</span></div>
            <ProductCapture
              kind="editor"
              desktopBase="editor-hero-desktop-hardened"
              desktopWidth={980}
              desktopHeight={855}
              narrowBase="editor-hero-narrow-hardened"
              narrowWidth={900}
              narrowHeight={635}
              breakpoint={1000}
              priority
              alt="Presume editor showing Fit constraints, export controls, and a directly editable sample resume on a Letter page"
            />
            <figcaption>Unmodified capture from the working editor. Sample resume shown.</figcaption>
          </figure>
        </section>

        <section className="landing-thesis" data-landing-chapter="thesis" aria-labelledby="thesis-title">
          <div className="landing-thesis__inner landing-shell">
            <h2 id="thesis-title">The document is not the output. <span>It is the interface.</span></h2>
            <p>Writing, measurement, local persistence, and export remain attached to the finished page instead of disappearing behind a separate preview.</p>
          </div>
        </section>

        <section className="landing-fit landing-shell" id="fit" data-landing-chapter="fit" aria-labelledby="fit-title">
          <div className="landing-fit__grid">
            <div className="landing-fit__copy">
              <p className="landing-eyebrow">Visible constraints</p>
              <h2 id="fit-title">See the page before export.</h2>
              <p>Fit keeps page and line constraints visible while you edit, so you can see wrapping pressure and overflow before export.</p>
            </div>
            <figure className="landing-evidence-plate">
              <ProductCapture
                kind="fit"
                desktopBase="working-fit-lab-capture-hardened"
                desktopWidth={742}
                desktopHeight={355}
                narrowBase="working-fit-lab-narrow-hardened"
                narrowWidth={358}
                narrowHeight={623}
                breakpoint={400}
                alt="Presume measurement fixture showing a text sample over its two-line target at a 240 pixel width"
              />
              <figcaption><span>Measurement fixture using Presume’s working fit logic</span><span>Example measured state</span></figcaption>
            </figure>
          </div>
        </section>

        <section className="landing-continuity" data-landing-chapter="continuity" aria-labelledby="continuity-title">
          <div className="landing-continuity__inner landing-shell">
            <div className="landing-continuity__intro">
              <h2 id="continuity-title">The document keeps its shape.</h2>
              <p>Presume preserves the current resume and its formatting constraints in this browser. Export produces a fixed Letter artifact independent of browser zoom.</p>
            </div>
            <ol className="landing-path">
              <li><h3>Saved in this browser</h3><p>Current resume data and formatting constraints persist in this browser.</p></li>
              <li><h3>Measured in place</h3><p>Page limit and bullet wrapping stay visible on the editable document.</p></li>
              <li><h3>Carried forward</h3><p>Export a stable Letter-sized PDF, or export an importable <strong>JSON backup</strong>.</p></li>
            </ol>
          </div>
        </section>

        <section className="landing-review" data-landing-chapter="review" aria-labelledby="review-title">
          <div className="landing-review__inner landing-shell">
            <div className="landing-review__copy">
              <p className="landing-eyebrow">Advisory Review</p>
              <h2 id="review-title">Review advises. It does not edit.</h2>
              <p>When you choose Review and an available service is configured, it can return category scores and supporting evidence beside the resume. It never rewrites or mutates the document.</p>
              <p className="landing-review__signature">It cannot <span>take the pen.</span></p>
            </div>
            <figure className="landing-review-plate">
              <p className="landing-fixture-label">Illustrative test fixture · sample resume shown</p>
              <ProductCapture
                kind="review"
                desktopBase="working-review-capture-hardened"
                desktopWidth={662}
                desktopHeight={743}
                narrowBase="working-review-narrow-essential-hardened"
                narrowWidth={366}
                narrowHeight={603}
                breakpoint={400}
                alt="Presume Review interface displaying the illustrative deterministic repository response; the score is not content-derived from the sample resume"
              />
              <figcaption><span>Deterministic repository response</span><span>Rendered in the working Review interface</span></figcaption>
            </figure>
          </div>
        </section>

        <section className="landing-boundaries" id="boundaries" data-landing-chapter="boundaries" aria-labelledby="boundaries-title">
          <div className="landing-boundaries__inner landing-shell">
            <div>
              <p className="landing-eyebrow">Design boundaries</p>
              <h2 id="boundaries-title">Two systems stay explicit.</h2>
            </div>
            <div className="landing-boundaries__list">
              <div className="landing-boundaries__item"><strong>Measurement</strong><p><a href="https://github.com/chenglou/pretext" target="_blank" rel="noreferrer">Pretext ↗</a> supplies text-layout primitives. Presume exposes their effect through Fit instead of hiding page pressure.</p></div>
              <div className="landing-boundaries__item"><strong>Advisory review</strong><p>Optional Review runs through a separate local or self-hosted service using a <a href="https://github.com/interviewstreet/hiring-agent" target="_blank" rel="noreferrer">Hiring Agent adapter ↗</a>. Returned evidence stays separate from the editable resume.</p></div>
            </div>
          </div>
        </section>

        <section className="landing-ending" data-landing-chapter="ending" aria-labelledby="ending-title">
          <div className="landing-ending__inner landing-shell">
            <h2 id="ending-title">Make the page yours.</h2>
            <p>Edit the finished document directly. Your resume and formatting stay in this browser as you work.</p>
            <Button size="lg" onClick={onOpenEditor}>
              {editorActionLabel(hasSavedResume, 'Edit your resume')} <span aria-hidden="true">→</span>
            </Button>
            <p className="landing-ending__reassurance">Direct editing · Saved in this browser · Stable Letter export</p>
          </div>
        </section>
      </main>

      <footer className="landing-footer">
        <div className="landing-footer__inner landing-shell"><span>Presume</span><a href="#top">Back to top</a></div>
      </footer>
    </div>
  )
}
