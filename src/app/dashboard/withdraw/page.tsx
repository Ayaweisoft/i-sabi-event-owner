"use client"
import useFetch from "@/hooks/useFetch"
import { useReducer, useState } from "react"
import { toast } from "react-toastify"
import Loader from "@/components/Loader"
import { apiGetBanks, apiVerifyBank, apiWithdraw } from "@/services/PaymentService"
import useMutate from "@/hooks/useMutate"
import { IAddBank, IAddBankAction, IBanksResponse, IVerifyBank, IVerifyBankResponse } from "@/interfaces"
import useAuthStore from "@/hooks/useAuth"

const initialState = {
    account_number: "",
    bank_code: "",
    bank_name: "",
    is_default: false
}

const Withdraw = () => {
    const [amount, setAmount] = useState(0)
    const context = useAuthStore()

    
    const [addBank, dispatch] = useReducer((state: IAddBank, action: IAddBankAction) => {
        if (action.type === "reset") {
            return initialState
        }
        return { ...state, [action.type]: action.payload }
    }, initialState)

    const { data: banks } = useFetch<IBanksResponse>({
        api: apiGetBanks,
        key: ["banks"],
        requireAuth: true
    })



    const verifyBankMutation = useMutate<IVerifyBank, IVerifyBankResponse>(
        apiVerifyBank,
        {
          onSuccess: () => {
            //   toast.success("Operation Successful")
              return
          },
          showErrorMessage: true,
        }
    )

    const withdrawMutation = useMutate(
        apiWithdraw,
        {
          onSuccess: () => {
              toast.success("Your withdrawal is being processed")
              dispatch({ type: "reset", payload: '' })
              context.update({
                token: context.token,
                doc: {
                    ...context.doc,
                    balance: context.doc?.balance - amount,
                }
              })
              setAmount(0)
              return
          },
          showErrorMessage: true,
        }
    )

    const handleAccountNumber = (val: string) => {
        if (val.length > 10) {
            toast.info("Account number must be 10 digits")
            return
        }
        if (val.length === 10) {
            verifyBankMutation.mutate({
                account: val,
                settlementBank: addBank.bank_code
            })
        }
        dispatch({ type: "account_number", payload: val })
    }

    const handleSelectBank = (val: string) => {
        dispatch({ type: "bank_code", payload: val })
        const bank_name = banks?.banks?.details?.message?.find(bank => bank.bankCode === val)?.bankName
        dispatch({ type: "bank_name", payload: bank_name || "" })
    }
 
    const handleWithdraw = () => {
        // min amount 100
        if (amount < 100) {
            return toast.info('Minimum withdrawal amount is 100 naira')
        }
        return withdrawMutation.mutate({
            amount,
            account: addBank.account_number,
            settlementBank: addBank.bank_code,
        })
    }
  return (
    <div className={`pt-4 px-4`}>
        {(verifyBankMutation?.isPending || withdrawMutation?.isPending) && <Loader />}
        <div className="mb-4 md:mb-7 flex flex-col gap-2.5">
            <h1 className="text-2xl font-bold">Balance: ₦ {context.doc?.balance}</h1>
            <p className='text-sm xl:textbase'>Fill and submit the form below to make a withdrawal</p>
        </div>
        <div className="flex-col text-sm md:flex">
            <div className="grid gap-3 md:mt-3 md:grid-cols-11">
                <div className="col-span-1"></div>
                <div className="flex flex-col col-span-5 gap-2 md:ml-3">
                    <label htmlFor="phone" className="text-sm">Bank</label>
                    <select value={addBank.bank_code} onChange={(e) => handleSelectBank(e.target.value)} name="" id="" className="p-4 text-sm bg-transparent border rounded-md">
                        <option value="">Select Bank</option>
                        {
                            banks?.banks?.details?.message?.map((bank) => (
                                <option key={`${bank.bankCode}_${bank.bankName}`} value={bank.bankCode}>{bank.bankName}</option>
                            ))
                        }
                    </select>
                </div> 
                <div className="flex flex-col col-span-5 gap-2">
                    <label htmlFor="account_number" className="text-sm">Account Number</label>
                    <div className="relative flex flex-col w-full">
                        <input value={addBank.account_number} onChange={(e) => handleAccountNumber(e.target.value)} type="number" placeholder="Enter Account Number" className="p-4 text-sm bg-transparent border rounded-md" />
                        {
                            (verifyBankMutation?.data && addBank?.account_number.length===10) && <span className="inline-block mt-2 text-xs font-bold text-primary">{verifyBankMutation?.data?.bank?.details?.message?.account_name}</span>
                        }
                    </div>
                </div>
                <div className="col-span-1"></div>
                {/* <button disabled={!verifyBankMutation.isSuccess || addBank?.account_number.length < 10} onClick={() => addBankMutation.mutate(addBank)} className={`p-3 px-10 mt-8 mb-3 text-sm text-white rounded-full w-fit bg-primary whitespace-nowrap disabled:bg-primary/70 disabled:cursor-not-allowed md:ml-3`}>Save Bank Account</button> */}
            </div>
            <div className="grid items-center md:px-2 md:mt-3 md:grid-cols-11">
                <span className="col-span-1"></span>
                <div className="col-span-6 md:ml-3">
                    <div className="flex flex-col gap-2">
                        <label htmlFor="phone" className="text-sm">Enter Amount (NGN)</label>
                        <input
                            min={100}
                            value={amount ? amount : ''} 
                            onChange={(e) => setAmount(Number(e.target.value))} 
                            type="number" placeholder="Min 100.00" className="p-4 text-sm bg-transparent border rounded-md" />
                    </div>
                    <button onClick={handleWithdraw} className='w-full p-3 px-10 mt-8 mb-3 text-sm text-white rounded-full md:w-fit bg-primary'>Withdraw</button>
                </div>
            </div>
        </div>
    </div>
  )
}

export default Withdraw