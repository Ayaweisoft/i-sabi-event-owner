"use client"
/* eslint-disable @typescript-eslint/no-explicit-any */

import {keepPreviousData, QueryKey, useQuery} from '@tanstack/react-query'
import {AxiosResponse} from 'axios'
import useAuthStore from './useAuth'

interface IProps<T> {
    api: (a?: any, b?: any) => Promise<AxiosResponse<T, any>>
    param?: any
    key: QueryKey
    onSuccess?: (a: any) => void
    requireAuth?: boolean
    select?: (a: { data: T }) => T,
    enabled?: boolean
    staleTime?: number
    gcTime?: number
    refetchOnWindowFocus?: boolean
    refetchOnReconnect?: boolean
    refetchOnMount?: boolean | 'always'
}

const useFetch = <T,>({
    api,
    param,
    key,
    select,
    enabled,
    requireAuth = false,
    staleTime,
    gcTime,
    refetchOnMount,
    refetchOnReconnect,
    refetchOnWindowFocus,
    ...rest
}: IProps<T>) => {
    const token = useAuthStore((state) => state.token)
    const ownerId = useAuthStore((state) => state.doc?._id)

    const queryKey = ownerId ? [...key, ownerId] : [...key]
    const isEnabled = (typeof enabled === 'undefined' ? true : enabled) && (!requireAuth || Boolean(token))

    const {data, error, isLoading, isFetching, refetch, fetchStatus, isPlaceholderData } = useQuery({
        queryKey,
        enabled: isEnabled,
        queryFn: () => api(token, param),
        select: select || ((d: { data: T }): T => d?.data),
        placeholderData: keepPreviousData,
        staleTime,
        gcTime,
        refetchOnMount,
        refetchOnReconnect,
        refetchOnWindowFocus,
        ...rest
    })

    return {data, error, isLoading, isFetching, refetch, fetchStatus, isPlaceholderData}
}

export default useFetch