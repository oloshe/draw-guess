const SET_MY_INFO = 'SET_ACCOUNT_INFO'

interface SetMyInfo {
    type: typeof SET_MY_INFO,
    data: MyInfo
}

export interface PlayerInfo {
    userId: string
    avatarUrl: string
    nickName: string
}

interface MyInfo extends PlayerInfo {

}

type InfoAction = SetMyInfo;

const initState: MyInfo = {
    userId: '',
    avatarUrl: '',
    nickName: '',
}

export function infoReducer(state = initState, action: InfoAction) {
    switch(action.type) {
        case SET_MY_INFO: {
            return { ...state, ...action.data }
        }
        default: {
            return state
        }
    }
}

export const infoActions = {
    setMyInfo(data: MyInfo) {
        return { type: SET_MY_INFO, data }
    }
}