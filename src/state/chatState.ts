const ADD_TO_CHAT = 'ADD_TO_CHAT'

interface AddChat {
    type: typeof ADD_TO_CHAT,
    data: ChatItem[]
}

export type ChatAction = AddChat

interface ChatItem {
    userId: string
    timestamp: number
    content: string
}

export interface ChatState {
    // 最新一条的时间戳
    lastTimestamp: number
    list: Array<ChatItem>
}

const initState: ChatState = {
    lastTimestamp: 0,
    list: []
};

export function chatReducer(state = initState, action: ChatAction) {
    switch(action.type) {
        case ADD_TO_CHAT: {
            state.list = [...state.list, ...action.data];
            if (action.data.length) {
                state.lastTimestamp = action.data[action.data.length - 1].timestamp
            }
            return { ...state }
        }
        default: {
            return state
        }
    }
}

export const chatActions = {
    addToChat(data: ChatItem[]): AddChat {
        return { type: ADD_TO_CHAT, data }
    }
}