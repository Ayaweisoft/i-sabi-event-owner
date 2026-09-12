"use client"
import React, { useState } from 'react'
import Image from 'next/image'
import { MdOpenInNew, MdClose, MdZoomIn, MdBrokenImage, MdPlayCircle, MdDescription, MdPictureAsPdf } from 'react-icons/md'

// ── Detection ─────────────────────────────────────────────────────────────────

const IMAGE_EXT = /\.(jpg|jpeg|png|gif|webp|avif|svg|bmp|tiff?)(\?.*)?$/i
const VIDEO_EXT = /\.(mp4|mov|webm|mkv|avi|m4v|3gp)(\?.*)?$/i
const DOC_EXT = /\.(pdf|docx?|xlsx?|pptx?|csv|txt)(\?.*)?$/i

const IMAGE_HOSTS = [
    'cloudinary.com',
    'firebasestorage.googleapis.com',
    'res.cloudinary.com',
    'imgur.com',
    'imgbb.com',
    'ibb.co',
    'unsplash.com',
    'images.unsplash.com',
    'upload.wikimedia.org',
    'i.postimg.cc',
    'drive.google.com',    // Google Drive direct image links
    'lh3.googleusercontent.com',
    'googleusercontent.com',
]

export function isImageUrl(raw: string): boolean {
    if (!raw || typeof raw !== 'string') return false
    const url = raw.trim()
    if (!url.startsWith('http')) return false
    try {
        const u = new URL(url)
        if (IMAGE_EXT.test(u.pathname)) return true
        if (IMAGE_HOSTS.some((h) => u.hostname.endsWith(h))) return true
        // Cloudinary transformation URLs (no extension)
        if (u.pathname.includes('/image/upload/')) return true
        return false
    } catch {
        return IMAGE_EXT.test(url)
    }
}

export function isVideoUrl(raw: string): boolean {
    if (!raw || typeof raw !== 'string') return false
    const url = raw.trim()
    if (!url.startsWith('http')) return false
    try {
        const u = new URL(url)
        if (VIDEO_EXT.test(u.pathname)) return true
        // Cloudinary video transformation URLs (no extension)
        if (u.pathname.includes('/video/upload/')) return true
        return false
    } catch {
        return VIDEO_EXT.test(url)
    }
}

export function isDocUrl(raw: string): boolean {
    if (!raw || typeof raw !== 'string') return false
    const url = raw.trim()
    if (!url.startsWith('http')) return false
    try {
        const u = new URL(url)
        return DOC_EXT.test(u.pathname)
    } catch {
        return DOC_EXT.test(url)
    }
}

const fileNameFromUrl = (raw: string) => {
    try {
        const u = new URL(raw)
        return decodeURIComponent(u.pathname.split('/').pop() || raw)
    } catch {
        return raw
    }
}

// ── Lightbox ──────────────────────────────────────────────────────────────────

function Lightbox({ src, alt, onClose }: { src: string; alt: string; onClose: () => void }) {
    return (
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
            onClick={onClose}
        >
            <button
                onClick={onClose}
                className="absolute top-4 right-4 p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition"
            >
                <MdClose className="text-2xl" />
            </button>

            <div
                className="relative max-w-4xl max-h-[90vh] w-full"
                onClick={(e) => e.stopPropagation()}
            >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                    src={src}
                    alt={alt}
                    className="max-w-full max-h-[85vh] object-contain mx-auto rounded-xl shadow-2xl"
                />
                <div className="flex justify-center mt-3">
                    <a
                        href={src}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-sm text-white/80 hover:text-white transition"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <MdOpenInNew /> Open original
                    </a>
                </div>
            </div>
        </div>
    )
}

// ── Thumbnail ─────────────────────────────────────────────────────────────────

interface ImagePreviewProps {
    url: string
    alt?: string
    /** Compact inline thumbnail (default) or full-width */
    size?: 'sm' | 'md' | 'lg'
}

export default function ImagePreview({ url, alt = 'Image', size = 'md' }: ImagePreviewProps) {
    const [open,   setOpen]   = useState(false)
    const [broken, setBroken] = useState(false)

    const sizeMap = {
        sm: { w: 48,  h: 48,  cls: 'w-12 h-12' },
        md: { w: 96,  h: 96,  cls: 'w-24 h-24' },
        lg: { w: 256, h: 160, cls: 'w-full h-40' },
    }
    const { w, h, cls } = sizeMap[size]

    if (broken) {
        return (
            <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-sm underline"
                style={{ color: '#2d8c3e' }}
            >
                <MdBrokenImage className="text-base opacity-60" /> {url.length > 40 ? url.slice(0, 40) + '…' : url}
            </a>
        )
    }

    return (
        <>
            <div
                className={`relative ${cls} rounded-xl overflow-hidden cursor-zoom-in border group`}
                style={{ borderColor: '#d4e8d6', backgroundColor: '#f4f8f4', flexShrink: 0 }}
                onClick={() => setOpen(true)}
            >
                <Image
                    src={url}
                    alt={alt}
                    width={w}
                    height={h}
                    className="object-cover w-full h-full transition-transform duration-200 group-hover:scale-105"
                    onError={() => setBroken(true)}
                    unoptimized={url.startsWith('http://') || url.includes('localhost')}
                />
                <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/20 transition-all">
                    <MdZoomIn className="text-white text-2xl opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-md" />
                </div>
            </div>

            {open && (
                <Lightbox
                    src={url}
                    alt={alt}
                    onClose={() => setOpen(false)}
                />
            )}
        </>
    )
}

// ── Video preview ─────────────────────────────────────────────────────────────

function VideoLightbox({ src, onClose }: { src: string; onClose: () => void }) {
    return (
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
            onClick={onClose}
        >
            <button
                onClick={onClose}
                className="absolute top-4 right-4 p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition"
            >
                <MdClose className="text-2xl" />
            </button>
            <div className="relative max-w-4xl max-h-[90vh] w-full" onClick={(e) => e.stopPropagation()}>
                <video src={src} controls autoPlay className="max-w-full max-h-[85vh] mx-auto rounded-xl shadow-2xl" />
                <div className="flex justify-center mt-3">
                    <a
                        href={src}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-sm text-white/80 hover:text-white transition"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <MdOpenInNew /> Open original
                    </a>
                </div>
            </div>
        </div>
    )
}

interface VideoPreviewProps {
    url: string
    size?: 'sm' | 'md' | 'lg'
}

export function VideoPreview({ url, size = 'md' }: VideoPreviewProps) {
    const [open, setOpen] = useState(false)
    const sizeCls = { sm: 'w-12 h-12', md: 'w-24 h-24', lg: 'w-full h-40' }[size]

    return (
        <>
            <div
                className={`relative ${sizeCls} rounded-xl overflow-hidden cursor-pointer border group flex items-center justify-center bg-black/80`}
                style={{ borderColor: '#d4e8d6', flexShrink: 0 }}
                onClick={() => setOpen(true)}
            >
                <video src={`${url}#t=0.1`} className="object-cover w-full h-full opacity-80" preload="metadata" muted />
                <MdPlayCircle className="absolute text-white text-3xl drop-shadow-md transition-transform group-hover:scale-110" />
            </div>
            {open && <VideoLightbox src={url} onClose={() => setOpen(false)} />}
        </>
    )
}

// ── Document preview ──────────────────────────────────────────────────────────

interface DocPreviewProps {
    url: string
    size?: 'sm' | 'md' | 'lg'
}

export function DocPreview({ url, size = 'md' }: DocPreviewProps) {
    const name = fileNameFromUrl(url)
    const isPdf = /\.pdf(\?.*)?$/i.test(url)
    const Icon = isPdf ? MdPictureAsPdf : MdDescription

    if (size === 'lg') {
        return (
            <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 rounded-xl border px-4 py-3 transition hover:bg-black/[0.02]"
                style={{ borderColor: '#d4e8d6', backgroundColor: '#f4f8f4' }}
            >
                <Icon className="text-3xl shrink-0" style={{ color: '#2d8c3e' }} />
                <span className="text-sm break-all" style={{ color: '#0f2312' }}>{name}</span>
                <MdOpenInNew className="ml-auto shrink-0 text-base" style={{ color: '#2d8c3e' }} />
            </a>
        )
    }

    const sizeCls = { sm: 'w-12 h-12', md: 'w-24 h-24' }[size as 'sm' | 'md'] ?? 'w-12 h-12'
    return (
        <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            title={name}
            className={`relative ${sizeCls} rounded-xl overflow-hidden border flex items-center justify-center transition hover:bg-black/[0.02]`}
            style={{ borderColor: '#d4e8d6', backgroundColor: '#f4f8f4', flexShrink: 0 }}
        >
            <Icon className="text-2xl" style={{ color: '#2d8c3e' }} />
        </a>
    )
}

// ── Generic file preview (auto-detects image / video / doc) ───────────────────

export function FilePreview({ url, alt, size = 'md' }: { url: string; alt?: string; size?: 'sm' | 'md' | 'lg' }) {
    if (isImageUrl(url)) return <ImagePreview url={url} alt={alt} size={size} />
    if (isVideoUrl(url)) return <VideoPreview url={url} size={size} />
    return <DocPreview url={url} size={size} />
}

// ── Field value renderer ──────────────────────────────────────────────────────
// Use this in submission detail views to auto-detect image/video/doc URLs

interface FieldValueProps {
    value: string | number | boolean | null
    type?: string
    label?: string
}

export function FieldValue({ value, type, label }: FieldValueProps) {
    const str = value != null && value !== '' ? String(value) : null

    if (!str) {
        return <span style={{ color: '#6b8f70' }}>—</span>
    }

    // Image URL field or URL field whose value looks like an image
    if (type === 'image' || (type !== 'video' && type !== 'file' && isImageUrl(str))) {
        return (
            <div className="flex flex-col gap-2">
                <ImagePreview url={str} alt={label ?? 'Image'} size="lg" />
                <a
                    href={str}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs flex items-center gap-1 break-all"
                    style={{ color: '#2d8c3e' }}
                >
                    <MdOpenInNew className="shrink-0" /> {str}
                </a>
            </div>
        )
    }

    // Video URL field or URL field whose value looks like a video
    if (type === 'video' || isVideoUrl(str)) {
        return (
            <div className="flex flex-col gap-2">
                <VideoPreview url={str} size="lg" />
                <a
                    href={str}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs flex items-center gap-1 break-all"
                    style={{ color: '#2d8c3e' }}
                >
                    <MdOpenInNew className="shrink-0" /> {str}
                </a>
            </div>
        )
    }

    // File/document upload field, or URL that looks like a document
    if (type === 'file' || isDocUrl(str)) {
        return <DocPreview url={str} size="lg" />
    }

    // Non-file URL
    if (type === 'url' || str.startsWith('http')) {
        return (
            <a
                href={str}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm underline break-all flex items-center gap-1"
                style={{ color: '#2d8c3e' }}
            >
                <MdOpenInNew className="shrink-0 text-base" /> {str}
            </a>
        )
    }

    return <span style={{ color: '#0f2312', wordBreak: 'break-word' }}>{str}</span>
}

// ── Compact cell renderer (for dense table rows) ───────────────────────────────
// Same detection as FieldValue, but renders small thumbnails/icons instead of
// full-size previews — used in table cells where space is tight.

export function FieldValueCompact({ value, type }: { value: string | number | boolean | null; type?: string }) {
    const str = value != null && value !== '' ? String(value) : null
    if (!str) return <span className="text-slate-400">—</span>

    if (type === 'image' || (type !== 'video' && type !== 'file' && isImageUrl(str))) {
        return <ImagePreview url={str} size="sm" />
    }
    if (type === 'video' || isVideoUrl(str)) {
        return <VideoPreview url={str} size="sm" />
    }
    if (type === 'file' || isDocUrl(str)) {
        return <DocPreview url={str} size="sm" />
    }
    return <span className="truncate">{str}</span>
}
