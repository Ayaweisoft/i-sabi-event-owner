"use client"

import { useParams } from 'next/navigation'
import FormDetailClient from '../_components/FormDetailClient'

export default function FormDetailPage() {
    const params = useParams<{ id: string }>()

    return <FormDetailClient formId={params.id} />
}
