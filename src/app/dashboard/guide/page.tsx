'use client'
import Link from 'next/link'
import { useEffect, useMemo, useRef, useState } from 'react'
import { MdSearch, MdOutlineExplore, MdArrowOutward, MdExpandMore, MdOutlineTipsAndUpdates } from 'react-icons/md'
import { GUIDE_SECTIONS, GUIDE_FAQS } from '@/constants/guide'
import { useTourStore } from '@/hooks/useTour'

const GREEN      = '#2d8c3e'
const GREEN_DEEP = '#07360E'
const BORDER     = '#d4e8d6'
const TEXT_LIGHT = '#6b8f70'
const TEXT_MID   = '#3d5c42'
const SURFACE    = '#f4f8f4'

const matches = (haystack: string[], query: string) =>
    haystack.some((s) => s.toLowerCase().includes(query))

const GuidePage = () => {
    const [query, setQuery] = useState('')
    const [activeId, setActiveId] = useState(GUIDE_SECTIONS[0].id)
    const [openFaq, setOpenFaq] = useState<number | null>(null)
    const startTour = useTourStore((s) => s.start)
    const sectionRefs = useRef<Record<string, HTMLElement | null>>({})

    const q = query.trim().toLowerCase()
    const visibleSections = useMemo(() => {
        if (!q) return GUIDE_SECTIONS
        return GUIDE_SECTIONS.filter((s) =>
            matches([s.title, s.summary, ...(s.body ?? []), ...(s.steps ?? []), ...(s.tips ?? [])], q)
        )
    }, [q])

    const visibleFaqs = useMemo(() => {
        if (!q) return GUIDE_FAQS
        return GUIDE_FAQS.filter((f) => matches([f.q, f.a], q))
    }, [q])

    // Highlight the section currently in view in the table of contents.
    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                const visible = entries.filter((e) => e.isIntersecting)
                if (visible.length > 0) {
                    setActiveId(visible[0].target.id)
                }
            },
            { rootMargin: '-15% 0px -70% 0px', threshold: 0 }
        )
        Object.values(sectionRefs.current).forEach((el) => el && observer.observe(el))
        return () => observer.disconnect()
    }, [visibleSections])

    const jumpTo = (id: string) => {
        sectionRefs.current[id]?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }

    return (
        <div className="flex flex-col gap-6 pb-16">
            {/* Hero */}
            <div
                className="rounded-[2rem] border p-6 md:p-8 flex flex-col gap-4"
                style={{ borderColor: '#d7e6d6', background: 'linear-gradient(135deg,#ffffff 0%,#f3f8ef 55%,#edf7ee 100%)' }}
            >
                <span
                    className="inline-flex w-fit rounded-full bg-white/90 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em]"
                    style={{ color: GREEN }}
                >
                    User Guide
                </span>
                <div className="flex flex-col gap-2 max-w-2xl">
                    <h1 className="text-2xl font-bold" style={{ color: GREEN_DEEP }}>
                        Everything you need to run your events like a pro
                    </h1>
                    <p className="text-sm" style={{ color: TEXT_MID }}>
                        Search for a topic, browse a section, or replay the guided tour of the dashboard&apos;s navigation.
                    </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
                    <div
                        className="flex items-center gap-2 rounded-xl bg-white px-3 py-2.5 flex-1 max-w-md border"
                        style={{ borderColor: BORDER }}
                    >
                        <MdSearch className="text-lg shrink-0" style={{ color: TEXT_LIGHT }} />
                        <input
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Search the guide (e.g. “withdraw”, “votes”, “forms”)…"
                            className="w-full text-sm outline-none bg-transparent placeholder:text-muted-foreground"
                        />
                    </div>
                    <button
                        onClick={() => startTour()}
                        className="inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white shrink-0"
                        style={{ backgroundColor: GREEN }}
                    >
                        <MdOutlineExplore className="text-lg" />
                        Restart the guided tour
                    </button>
                </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
                {/* Table of contents */}
                <nav className="hidden lg:flex flex-col gap-1 h-fit sticky top-20 self-start">
                    {GUIDE_SECTIONS.map((s) => (
                        <button
                            key={s.id}
                            onClick={() => jumpTo(s.id)}
                            className="flex items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors"
                            style={{
                                backgroundColor: activeId === s.id ? SURFACE : 'transparent',
                                color: activeId === s.id ? GREEN_DEEP : TEXT_LIGHT,
                            }}
                        >
                            <s.icon className="text-base shrink-0" />
                            <span className="truncate">{s.title}</span>
                        </button>
                    ))}
                    <button
                        onClick={() => jumpTo('faq')}
                        className="flex items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors"
                        style={{ color: TEXT_LIGHT }}
                    >
                        <span className="truncate">FAQ</span>
                    </button>
                </nav>

                {/* Mobile jump-to */}
                <div className="lg:hidden -mx-1 flex gap-2 overflow-x-auto pb-1">
                    {GUIDE_SECTIONS.map((s) => (
                        <button
                            key={s.id}
                            onClick={() => jumpTo(s.id)}
                            className="shrink-0 flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold"
                            style={{ borderColor: BORDER, color: TEXT_MID, backgroundColor: '#ffffff' }}
                        >
                            <s.icon className="text-sm" />
                            {s.title}
                        </button>
                    ))}
                </div>

                {/* Sections */}
                <div className="flex flex-col gap-4 min-w-0">
                    {visibleSections.length === 0 && (
                        <div className="rounded-2xl border bg-white p-8 text-center text-sm text-muted-foreground" style={{ borderColor: BORDER }}>
                            No topics match &ldquo;{query}&rdquo;. Try a different word.
                        </div>
                    )}

                    {visibleSections.map((s) => (
                        <section
                            key={s.id}
                            id={s.id}
                            ref={(el) => { sectionRefs.current[s.id] = el }}
                            className="scroll-mt-24 rounded-2xl border bg-white p-5 md:p-6 flex flex-col gap-4"
                            style={{ borderColor: BORDER }}
                        >
                            <div className="flex items-start gap-3">
                                <div className="rounded-2xl p-3 shrink-0" style={{ backgroundColor: '#eef7ec', color: GREEN }}>
                                    <s.icon className="text-xl" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h2 className="text-lg font-bold" style={{ color: GREEN_DEEP }}>{s.title}</h2>
                                    <p className="text-sm text-muted-foreground mt-0.5">{s.summary}</p>
                                </div>
                            </div>

                            {s.body?.map((p, i) => (
                                <p key={i} className="text-sm leading-relaxed" style={{ color: TEXT_MID }}>{p}</p>
                            ))}

                            {s.steps && (
                                <ol className="flex flex-col gap-2.5">
                                    {s.steps.map((step, i) => (
                                        <li key={i} className="flex items-start gap-3 text-sm" style={{ color: TEXT_MID }}>
                                            <span
                                                className="flex items-center justify-center w-5 h-5 rounded-full text-[11px] font-bold text-white shrink-0 mt-0.5"
                                                style={{ backgroundColor: GREEN }}
                                            >
                                                {i + 1}
                                            </span>
                                            <span className="leading-relaxed">{step}</span>
                                        </li>
                                    ))}
                                </ol>
                            )}

                            {s.tips?.map((tip, i) => (
                                <div
                                    key={i}
                                    className="flex items-start gap-2.5 rounded-xl px-3.5 py-3 text-sm"
                                    style={{ backgroundColor: '#fff9e6', color: '#7a5b00' }}
                                >
                                    <MdOutlineTipsAndUpdates className="text-base shrink-0 mt-0.5" />
                                    <span className="leading-relaxed">{tip}</span>
                                </div>
                            ))}

                            {s.link && (
                                <Link
                                    href={s.link.href}
                                    className="inline-flex items-center gap-1.5 text-sm font-semibold w-fit"
                                    style={{ color: GREEN }}
                                >
                                    {s.link.label}
                                    <MdArrowOutward className="text-sm" />
                                </Link>
                            )}
                        </section>
                    ))}

                    {/* FAQ */}
                    {visibleFaqs.length > 0 && (
                        <section
                            id="faq"
                            ref={(el) => { sectionRefs.current.faq = el }}
                            className="scroll-mt-24 rounded-2xl border bg-white p-5 md:p-6 flex flex-col gap-1"
                            style={{ borderColor: BORDER }}
                        >
                            <h2 className="text-lg font-bold mb-2" style={{ color: GREEN_DEEP }}>Frequently Asked Questions</h2>
                            {visibleFaqs.map((f, i) => {
                                const open = openFaq === i
                                return (
                                    <div key={i} className="border-t first:border-t-0" style={{ borderColor: BORDER }}>
                                        <button
                                            onClick={() => setOpenFaq(open ? null : i)}
                                            className="w-full flex items-center justify-between gap-3 py-3.5 text-left"
                                        >
                                            <span className="text-sm font-semibold" style={{ color: GREEN_DEEP }}>{f.q}</span>
                                            <MdExpandMore
                                                className="text-lg shrink-0 transition-transform"
                                                style={{ color: TEXT_LIGHT, transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}
                                            />
                                        </button>
                                        {open && (
                                            <p className="text-sm leading-relaxed pb-4" style={{ color: TEXT_MID }}>{f.a}</p>
                                        )}
                                    </div>
                                )
                            })}
                        </section>
                    )}
                </div>
            </div>
        </div>
    )
}

export default GuidePage
