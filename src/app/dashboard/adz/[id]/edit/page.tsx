"use client"

import { useParams } from 'next/navigation'
import AdzCampaignForm from '../../_components/AdzCampaignForm'

export default function EditAdzCampaignPage() {
    const params = useParams<{ id: string }>()

    return <AdzCampaignForm campaignId={params.id} />
}