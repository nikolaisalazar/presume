import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'

export interface LandingPageProps {
  hasSavedResume: boolean
  onOpenEditor: () => void
}

export function LandingPage({ hasSavedResume, onOpenEditor }: LandingPageProps) {
  return (
    <div className="flex min-h-screen flex-col items-center gap-[18px] px-7 pt-6 pb-14 text-foreground max-[960px]:px-4 max-[640px]:px-3 max-[640px]:pt-3.5 max-[640px]:pb-10">
      <header
        className="flex w-full max-w-[1120px] items-center justify-between gap-4 rounded-xl border border-border/80 bg-card/75 p-3.5 shadow-[var(--shadow-panel)] max-[640px]:flex-col max-[640px]:items-stretch"
        aria-label="Presume landing navigation"
      >
        <a
          className="landing-nav__brand inline-flex items-center gap-2.5 text-sm font-extrabold text-foreground no-underline"
          href="/presume/"
          aria-label="Presume home"
        >
          <span className="app-header__brand-mark" aria-hidden="true">P</span>
          <span>Presume</span>
        </a>
        <Button variant="outline" onClick={onOpenEditor}>
          {hasSavedResume ? 'Continue editing' : 'Open editor'}
        </Button>
      </header>

      <main className="flex w-full max-w-[1120px] flex-col gap-[18px]">
        <section
          className="grid grid-cols-1 items-center gap-9 rounded-xl border border-border/80 bg-card/75 p-8 shadow-[var(--shadow-panel)] min-[921px]:grid-cols-[minmax(0,0.95fr)_minmax(340px,0.75fr)] max-[640px]:p-[22px]"
          aria-labelledby="landing-title"
        >
          <div className="max-w-[670px]">
            <p className="mb-2.5 text-[13px] font-extrabold text-primary">
              Direct-editing resume workspace
            </p>
            <h1
              id="landing-title"
              className="max-w-[11ch] text-[clamp(2.625rem,5.2vw,3.625rem)] leading-[0.98] font-extrabold tracking-[-0.04em] text-balance text-foreground"
            >
              Edit your resume like the final document.
            </h1>
            <p className="mt-[22px] max-w-[60ch] text-base leading-[1.65] text-muted-foreground text-pretty">
              Presume gives you a fixed resume canvas, inline editing, fit guidance, and export tools in one focused workspace.
            </p>
            <div className="mt-7 flex flex-wrap items-center gap-3.5">
              <Button size="lg" onClick={onOpenEditor}>
                {hasSavedResume ? 'Continue editing' : 'Start editing'}
              </Button>
              <div className="flex flex-wrap items-center gap-2 text-[13px] font-semibold text-muted-foreground">
                <Badge variant="outline">No account required</Badge>
                <span>Stored locally in your browser</span>
              </div>
            </div>
          </div>

          <div
            className="rounded-2xl border border-border/75 bg-[image:var(--stage-surface)] p-3.5 shadow-[var(--shadow-stage)] max-[640px]:hidden"
            role="img"
            aria-label="Presume editor preview"
          >
            <div className="mb-3.5 flex justify-between gap-3 rounded-xl border border-border/70 bg-card/85 px-3 py-2.5 text-xs font-extrabold text-secondary-foreground">
              <span>Fit constraints</span>
              <span>1 page · 1 line · 8px</span>
            </div>
            <div className="rounded-xl bg-[image:var(--stage-surface)] p-5">
              <div className="mx-auto min-h-[426px] w-full max-w-[330px] rounded-md bg-card px-8 py-[34px] shadow-[var(--shadow-page-premium)]">
                <div className="h-[13px] w-[62%] bg-foreground" />
                <div className="mt-3 h-2 w-[44%] rounded-full bg-border" />
                <div className="my-[18px] h-0.5 w-full bg-foreground" />
                <div className="mt-3 h-2 rounded-full bg-border" />
                <div className="mt-3 h-2 rounded-full bg-border" />
                <div className="mt-3 h-2 w-[72%] rounded-full bg-border" />
                <div className="my-[18px] h-0.5 w-full bg-foreground" />
                <div className="mt-3 h-2 rounded-full bg-border" />
                <div className="mt-3 h-2 w-[44%] rounded-full bg-border" />
              </div>
            </div>
          </div>
        </section>

        <section
          className="grid grid-cols-1 items-stretch gap-3.5 sm:grid-cols-2 lg:grid-cols-4"
          aria-label="Features"
        >
          <Card size="sm" className="h-full">
            <CardHeader>
              <CardTitle><h2>Direct inline editing</h2></CardTitle>
              <CardDescription>
                <p>Edit the resume itself instead of translating your history through a long form.</p>
              </CardDescription>
            </CardHeader>
          </Card>
          <Card size="sm" className="h-full">
            <CardHeader>
              <CardTitle><h2>Fit constraints</h2></CardTitle>
              <CardDescription>
                <p>Keep page count, bullet wrapping, and type size visible while you shape content.</p>
              </CardDescription>
            </CardHeader>
          </Card>
          <Card size="sm" className="h-full">
            <CardHeader>
              <CardTitle><h2>PDF + JSON export</h2></CardTitle>
              <CardDescription>
                <p>Export a polished PDF and keep a portable JSON backup of your resume data.</p>
              </CardDescription>
            </CardHeader>
          </Card>
          <Card size="sm" className="h-full">
            <CardHeader>
              <CardTitle><h2>Optional advisory review</h2></CardTitle>
              <CardDescription>
                <p>When configured, request a non-mutating review without changing your document.</p>
              </CardDescription>
            </CardHeader>
          </Card>
        </section>

        <section
          className="grid grid-cols-1 items-start gap-7 rounded-xl border border-border/80 bg-card/75 p-[30px] shadow-[var(--shadow-panel)] min-[921px]:grid-cols-[minmax(260px,0.62fr)_minmax(0,1fr)]"
          aria-labelledby="why-title"
        >
          <div>
            <h2 id="why-title" className="text-lg leading-tight font-bold tracking-[-0.025em] text-balance">
              Why direct editing?
            </h2>
            <p className="mt-2.5 max-w-[38ch] text-sm leading-[1.55] text-muted-foreground text-pretty">
              Resume editing should happen where the resume is actually read. Presume keeps layout, fit, and content decisions on the same surface.
            </p>
          </div>
          <div className="grid grid-cols-1 overflow-hidden rounded-xl border border-border/70 bg-secondary/70 min-[921px]:grid-cols-2">
            <article className="p-[18px]">
              <h3 className="text-lg leading-tight font-bold tracking-[-0.025em] text-balance">
                Form-first builders
              </h3>
              <ul className="mt-3.5 flex list-none flex-col gap-2 p-0 text-[13px] leading-[1.45] text-muted-foreground">
                <li className="relative pl-[18px] before:absolute before:top-[0.58em] before:left-0 before:size-1.5 before:border before:border-primary/35 before:bg-card before:content-['']">Edit fields somewhere else</li>
                <li className="relative pl-[18px] before:absolute before:top-[0.58em] before:left-0 before:size-1.5 before:border before:border-primary/35 before:bg-card before:content-['']">Guess how bullets will wrap</li>
                <li className="relative pl-[18px] before:absolute before:top-[0.58em] before:left-0 before:size-1.5 before:border before:border-primary/35 before:bg-card before:content-['']">Find layout surprises at export</li>
              </ul>
            </article>
            <article className="border-t border-border/70 bg-primary/5 p-[18px] min-[921px]:border-t-0 min-[921px]:border-l">
              <h3 className="text-lg leading-tight font-bold tracking-[-0.025em] text-balance">
                Presume keeps the document live
              </h3>
              <ul className="mt-3.5 flex list-none flex-col gap-2 p-0 text-[13px] leading-[1.45] text-muted-foreground">
                <li className="relative pl-[18px] before:absolute before:top-[0.58em] before:left-0 before:size-1.5 before:bg-primary before:content-['']">Edit directly on the resume</li>
                <li className="relative pl-[18px] before:absolute before:top-[0.58em] before:left-0 before:size-1.5 before:bg-primary before:content-['']">See fit constraints while writing</li>
                <li className="relative pl-[18px] before:absolute before:top-[0.58em] before:left-0 before:size-1.5 before:bg-primary before:content-['']">Export from the same surface</li>
              </ul>
            </article>
          </div>
          <div className="col-span-full -mt-2 flex flex-col gap-3">
            <Separator />
            <p className="text-[13px] font-semibold text-muted-foreground">
              Not a job board, account-gated builder, or resume content farm.
            </p>
          </div>
        </section>

        <section
          className="flex flex-col gap-7 rounded-xl border border-border/80 bg-card/75 p-[30px] shadow-[var(--shadow-panel)]"
          aria-labelledby="workflow-title"
        >
          <div className="max-w-[760px]">
            <p className="mb-2.5 text-[13px] font-extrabold text-primary">Workflow</p>
            <h2 id="workflow-title" className="text-lg leading-tight font-bold tracking-[-0.025em] text-balance">
              From draft to export without leaving the page.
            </h2>
          </div>
          <ol className="relative grid list-none grid-cols-3 items-stretch gap-0 pt-1.5 before:absolute before:top-[27px] before:right-[7%] before:left-[7%] before:h-px before:bg-primary/30 before:content-[''] max-[920px]:grid-cols-1 max-[920px]:gap-[18px] max-[920px]:pl-[26px] max-[920px]:before:top-5 max-[920px]:before:bottom-5 max-[920px]:before:left-[21px] max-[920px]:before:h-auto max-[920px]:before:w-px">
            <li className="relative grid min-h-[132px] grid-rows-[auto_auto_1fr] content-start gap-2.5 pr-7 after:absolute after:top-[15px] after:right-[22px] after:text-lg after:font-extrabold after:leading-none after:text-primary/60 after:content-['→'] max-[920px]:min-h-0 max-[920px]:pl-7 max-[920px]:after:top-auto max-[920px]:after:right-auto max-[920px]:after:bottom-[-18px] max-[920px]:after:left-[-11px] max-[920px]:after:text-base max-[920px]:after:content-['↓']">
              <span className="relative z-[1] block size-[18px] border-[3px] border-card bg-primary shadow-[0_0_0_1px_color-mix(in_oklch,var(--primary),transparent_72%),0_10px_24px_rgba(15,23,42,0.08)]" aria-hidden="true" />
              <strong className="text-sm text-secondary-foreground">Edit directly</strong>
              <span className="max-w-[28ch] text-[13px] leading-[1.45] text-muted-foreground">Click into names, bullets, sections, and dates.</span>
            </li>
            <li className="relative grid min-h-[132px] grid-rows-[auto_auto_1fr] content-start gap-2.5 pr-7 after:absolute after:top-[15px] after:right-[22px] after:text-lg after:font-extrabold after:leading-none after:text-primary/60 after:content-['→'] max-[920px]:min-h-0 max-[920px]:pl-7 max-[920px]:after:top-auto max-[920px]:after:right-auto max-[920px]:after:bottom-[-18px] max-[920px]:after:left-[-11px] max-[920px]:after:text-base max-[920px]:after:content-['↓']">
              <span className="relative z-[1] block size-[18px] border-[3px] border-card bg-primary shadow-[0_0_0_1px_color-mix(in_oklch,var(--primary),transparent_72%),0_10px_24px_rgba(15,23,42,0.08)]" aria-hidden="true" />
              <strong className="text-sm text-secondary-foreground">Keep it fitting</strong>
              <span className="max-w-[28ch] text-[13px] leading-[1.45] text-muted-foreground">Use fit warnings and constraints as guardrails.</span>
            </li>
            <li className="relative grid min-h-[132px] grid-rows-[auto_auto_1fr] content-start gap-2.5 pr-7 after:hidden max-[920px]:min-h-0 max-[920px]:pl-7">
              <span className="relative z-[1] block size-[18px] border-[3px] border-card bg-primary shadow-[0_0_0_1px_color-mix(in_oklch,var(--primary),transparent_72%),0_10px_24px_rgba(15,23,42,0.08)]" aria-hidden="true" />
              <strong className="text-sm text-secondary-foreground">Export when ready</strong>
              <span className="max-w-[28ch] text-[13px] leading-[1.45] text-muted-foreground">Save a PDF or carry your data forward as JSON.</span>
            </li>
          </ol>
        </section>

        <section
          className="grid grid-cols-1 items-center gap-[18px] rounded-xl border border-border/80 bg-card/75 px-[26px] py-6 shadow-[var(--shadow-panel)] min-[921px]:grid-cols-[minmax(0,1fr)_auto_auto]"
          aria-label="Privacy and storage"
        >
          <div>
            <h2 className="text-lg leading-tight font-bold tracking-[-0.025em] text-balance">Private by default</h2>
            <p className="mt-2.5 max-w-[62ch] text-sm leading-[1.55] text-muted-foreground text-pretty">
              Presume is built as a convenient local-first editor. Your resume is saved in browser storage,
              and JSON export gives you an explicit backup you control.
            </p>
          </div>
          <ul className="flex list-disc flex-col gap-1.5 pl-[18px] text-[13px] leading-[1.35] text-secondary-foreground">
            <li>No account required</li>
            <li>Saved locally in your browser</li>
            <li>Optional review only when configured</li>
          </ul>
          <Button size="lg" onClick={onOpenEditor}>Open the editor</Button>
        </section>
      </main>
    </div>
  )
}
