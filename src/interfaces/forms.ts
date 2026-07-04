// Types for the Form Sales module — mirrors i-sabi-server/models/form-model.js.
// Kept in its own file (like adz.ts) since the module is self-contained.

export type FormFieldType =
    | 'text' | 'number' | 'date' | 'email' | 'tel' | 'url'
    | 'textarea' | 'select' | 'checkbox' | 'radio'
    | 'file' | 'image' | 'video'

export const FORM_FIELD_TYPES: { value: FormFieldType; label: string }[] = [
    { value: 'text', label: 'Text' },
    { value: 'number', label: 'Number' },
    { value: 'email', label: 'Email' },
    { value: 'tel', label: 'Phone' },
    { value: 'url', label: 'URL' },
    { value: 'date', label: 'Date' },
    { value: 'textarea', label: 'Paragraph' },
    { value: 'select', label: 'Dropdown' },
    { value: 'checkbox', label: 'Checkboxes' },
    { value: 'radio', label: 'Multiple choice' },
    { value: 'image', label: 'Image upload' },
    { value: 'video', label: 'Video upload' },
    { value: 'file', label: 'File upload' },
]

export interface IFormField {
    label: string
    name: string
    type: FormFieldType
    required: boolean
    options?: string[]
    placeholder?: string
    rows?: number
    min?: number
    max?: number
    accept?: string
    multiple?: boolean
}

export interface IFormStep {
    title: string
    description?: string
    // Indexes into the form's flat `fields` array — must stay in sync with
    // it; this is what fill-form.component.ts (mobile) and
    // formPageRenderer.js (public web page) both read to group fields.
    fieldIndexes: number[]
}

export const FORM_THEME_NAMES = [
    'ocean', 'forest', 'sunset', 'violet', 'rose', 'slate', 'midnight', 'custom',
] as const
export type FormThemeName = typeof FORM_THEME_NAMES[number]

export interface IForm {
    _id: string
    eventId: string
    ownerId: string
    title: string
    description?: string
    fields: IFormField[]
    steps?: IFormStep[]
    price: number
    colorTheme: FormThemeName
    colorHex?: string
    active: boolean
    slug?: string
    createdAt: string
    updatedAt?: string
}

export interface IFormsListResponse {
    data: IForm[]
    meta: { page: number; limit: number; total: number; pages: number }
}

export interface IFormShareInfo {
    formId: string
    slug?: string
    title: string
    active: boolean
    price: number
    links: {
        embed: string
        direct: string
        iframe: string
    }
}

export interface IFormSubmission {
    _id: string
    formId: string
    eventId: string
    ownerId: string
    submittedBy?: string | null
    data: Record<string, unknown>
    createdAt: string
}

export interface IFormSubmissionsResponse {
    data: IFormSubmission[]
    meta: { page: number; limit: number; total: number; pages: number }
}

// Payloads for create/update — server whitelists fields, so it's safe to
// send a superset; unknown keys are ignored server-side.
export interface ICreateFormPayload {
    eventId: string
    title: string
    description?: string
    fields?: IFormField[]
    steps?: IFormStep[]
    price?: number
    colorTheme?: FormThemeName
    colorHex?: string
    active?: boolean
}

export interface IUpdateFormPayload {
    title?: string
    description?: string
    fields?: IFormField[]
    steps?: IFormStep[]
    colorTheme?: FormThemeName
    colorHex?: string
    active?: boolean
}
