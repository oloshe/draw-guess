import { PlayerInfo } from "./infoState";

const SET_ROOM_INFO = 'SET_ROOM_INFO'
const SET_ROOM_READY = 'SET_ROOM_READY'
const SET_ROOM_OBSERVER = 'SET_ROOM_OBSERVER'
const SET_ROOM_SEAT = 'SET_ROOM_SEAT'
const SET_ROOM_READY_ALL = 'SET_ROOM_READY_ALL'
const ADD_PLAYERS = 'ADD_PLAYERS'

interface SetRoomInfo {
    type: typeof SET_ROOM_INFO
    data: Partial<RoomState>
}

interface SetRoomReady {
    type: typeof SET_ROOM_READY
    ready: boolean
    userId: string
}

interface SetRoomObserver {
    type: typeof SET_ROOM_OBSERVER
    data: Array<string>
}

interface SetRoomSeat {
    type: typeof SET_ROOM_SEAT
    data: Array<string|null>
}

interface SetRoomReadyAll {
    type: typeof SET_ROOM_READY_ALL
    data: RoomState['readyState']
}

interface AddPlayers {
    type: typeof ADD_PLAYERS,
    data: Record<string, PlayerInfo>
}

type RoomAction = SetRoomInfo | SetRoomReady | SetRoomObserver | SetRoomSeat | SetRoomReadyAll | AddPlayers

export interface RoomState {
    id: string
    name: string
    /** key: userId value: PlayerInfo */
    players: Record<string, PlayerInfo>
    /** length is 6, each represent a seat no, value is userId */
    seat: Array<string | null>
    observer: Array<string>
    readyState: Record<string, boolean | undefined>
}

const initRoomState: RoomState = {
    id: '',
    name: '',
    players: {},
    seat: [null,null,null,null,null,null],
    readyState: {},
    observer: [],
}

export function roomReducer(state = initRoomState, action: RoomAction) {
    switch(action.type) {
        case SET_ROOM_INFO: {
            Object.assign(state, action.data);
            return { ...state }
        }
        case SET_ROOM_READY: {
            state.readyState = { ...state.readyState, ...{
                [action.userId]: action.ready
            }}
            return { ...state }
        }
        case SET_ROOM_OBSERVER: {
            state.observer = action.data
            return { ...state }
        }
        case SET_ROOM_SEAT: {
            state.seat = action.data
            return { ...state }
        }
        case SET_ROOM_READY_ALL: {
            state.readyState = action.data
            return { ...state }
        }
        case ADD_PLAYERS: {
            state.players = {...state.players, ...action.data }
            return { ...state }
        }
        default: {
            // exhaustive check
            const _never: never = action;
            (_never as any);
            return state
        }
    }
}

export const roomActions = {
    setRoomInfo(data: Partial<RoomState>): RoomAction {
        return { type: SET_ROOM_INFO, data }
    },
    ready(userId: string, ready: boolean): RoomAction {
        return { type: SET_ROOM_READY, userId, ready }
    },
    setObserver(list: Array<string>): RoomAction {
        return { type: SET_ROOM_OBSERVER, data: list }
    },
    setSeat(list: Array<string|null>): RoomAction {
        return { type: SET_ROOM_SEAT, data: list }
    },
    setReady(data: RoomState['readyState']): RoomAction {
        return { type: SET_ROOM_READY_ALL, data }
    },
    add_players(data: Record<string, PlayerInfo>): RoomAction {
        return { type: ADD_PLAYERS, data }
    }
}