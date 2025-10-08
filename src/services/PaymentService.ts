import { IUserLogin, IVerifyBank, IWithdraw } from "@/interfaces"
import BaseService from "./BaseService"

const Auth = (token: string) => ({
    headers: {
        Authorization: `Bearer ${token}`
    }
})
const servicePrefix = "/v2/utility-bills"

export const apiLogin =  (data: IUserLogin) => {
    return BaseService.post(`login-event-owner`, data)
}

export const apiGetBanks =  () => {
    return BaseService.post(`${servicePrefix}/banks`)
}

export const apiVerifyBank =  (data: IVerifyBank) => {
    return BaseService.post(`${servicePrefix}/banks/verify`, data)
}

export const apiWithdraw =  (data: IWithdraw, { token }: { token: string; }) => {
    return BaseService.post(`${servicePrefix}/banks/send`, data, Auth(token))
}

