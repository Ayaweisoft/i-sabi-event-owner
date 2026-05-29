"use client"
import React, { useState } from 'react'
import Image from 'next/image'
import { MdOpenInNew, MdClose, MdZoomIn, MdBrokenImage } from 'react-icons/md'

// ── Detection ─────────────────────────────────────────────────────────────────

const IMAGE_EXT = /\.(jpg|jpeg|png|gif|webp|avif|svg|bmp|tiff?)(\?.*)?$/i

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

// ── Field value renderer ──────────────────────────────────────────────────────
// Use this in submission detail views to auto-detect image URLs

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
    if (type === 'image' || (type === 'url' && isImageUrl(str))) {
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

    // Non-image URL
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
