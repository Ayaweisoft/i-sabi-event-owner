"use client"
import React from 'react'
import { useQueryClient } from '@tanstack/react-query'
import ErrorImg from "@/assets/logo.png"
import Image from 'next/image'
import { Button } from '../ui/button'
import { useRouter } from 'next/navigation'
import useAuthStore from '@/hooks/useAuth'
import { clearPersistedQueryCache } from '@/providers/QueryProvider'

interface IProps {
    setIsOpen: React.Dispatch<React.SetStateAction<boolean>>
    isOpen: boolean
    logout?: () => void
}


const LogoutModal = ({ isOpen, setIsOpen, logout }: IProps) => {

    const context = useAuthStore()
    const router = useRouter()
    const queryClient = useQueryClient()

    const logOutHandler = () => {
        queryClient.clear()
        clearPersistedQueryCache()
        context.reset()
        logout?.()
        setIsOpen(false)
        return router.push('/')
    }
    
    React.useEffect(() => {
        if (isOpen) {
          document.body.style.overflow = 'hidden'
        } else {
          document.body.style.overflow = 'unset'
        }
      }, [isOpen])
      
    const closeModal = () => {
        setIsOpen(false)
        document.body.style.overflow = 'unset'
    }
    
    const handleOutsideClick = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
          if (e.target === e.currentTarget) {
              closeModal()
          }
    }
       
    return (
        <>
        {
            isOpen &&
                <div onClick={handleOutsideClick} className='fixed top-0 left-0 z-40 max-h-screen min-h-screen p-4 py-40 overflow-hidden md:p-8 md:py-40 bg-black/50 h-[100vh] w-[100vw]'>
                    {/* {(loginMutation?.isPending) && <Loader />} */}
                    <div className="flex flex-col items-center w-full max-w-sm gap-5 p-4 py-8 pt-6 mx-auto overflow-hidden bg-white rounded-md md:rounded-xl">
                        <div className='w-12 h-1 bg-[#D9D9D9] rounded-full'></div>
                        <div className="flex flex-col items-center max-w-[220px] gap-3 text-center">
                            <Image src={ErrorImg} alt='Success' className='w-16 h-16 rounded-full md:w-20 md:h-20' />
                            <h2 className='text-xl font-bold text-black'>You are about to Logout</h2>
                            <p className='mb-4 text-sm font-semibold text-[#abb4bf] '>Are you sure you want to logout from this site?</p>
                        </div>
                        <div className="flex gap-2">
                            <Button className='py-3 md:py-5 rounded-r-none bg-[#ED3A3A0D] text-black' onClick={() => setIsOpen(false)} >
                                Cancel
                            </Button>
                            <Button className='py-3 rounded-l-none md:py-5' onClick={() => logOutHandler()}>
                                Confirm
                            </Button>
                        </div>
                    </div>
                </div>
        }
        </>
    )
}

export default LogoutModal