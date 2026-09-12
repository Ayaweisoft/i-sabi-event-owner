// Direct, unsigned client-side upload to Cloudinary — same account and
// upload preset the mobile app already uses (src/app/services/cloudinary.service.ts),
// so images uploaded from either surface land in the same place. Unsigned
// presets are designed to be safe to call straight from the browser like
// this; no server round-trip or secret key involved.
const CLOUD_NAME     = 'ayaweisoft'
const UPLOAD_PRESET  = 'i-sabi_upload'

export async function uploadImageToCloudinary(file: File): Promise<string> {
    const url = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`
    const formData = new FormData()
    formData.append('file', file)
    formData.append('upload_preset', UPLOAD_PRESET)

    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 60_000)

    try {
        const res = await fetch(url, { method: 'POST', body: formData, signal: controller.signal })
        if (!res.ok) throw new Error('Image upload failed')
        const data = await res.json()
        return data.secure_url as string
    } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') {
            throw new Error('Upload timed out. Please check your connection and try again.')
        }
        throw err
    } finally {
        clearTimeout(timer)
    }
}
