const CHANGE_GAME_STAGE = 'CHANGE_GAME_STAGE';
const INIT_GAME_STATE = 'INIT_GAME_STATE'
const ADD_DRAW_DATA = 'ADD_DRAW_DATA'
const CLEAR_DRAW_DATA = 'CLEAR_DRAW_DATA'
const SET_DRAW_LENGTH = 'SET_DRAW_LENGTH'
const CHANGE_CUR_ID = 'CHANGE_CUR_ID'
const SET_SCORE_MAP = 'SET_SCORE_MAP'
const SET_SETTLEMENT = 'SET_SETTLEMENT'
const CHANGE_BACKGROUND = 'CHANGE_BACKGROUND'
const SET_NEXT_TIMESTAMP = 'SET_NEXT_TIMESTAMP'

interface ChangeGameStage {
    type: typeof CHANGE_GAME_STAGE,
    data: ChangeToChoose | ChangeToDrawing | ChangeToResult | ChangeToReady,
}

interface InitGameState {
    type: typeof INIT_GAME_STATE,
    data: {
        stage: GameStage,
        currUserId: string
        nextTimestamp: number
        word: number[]
        drawList: DrawData
        drawLength: number
        settlement: Record<string, number>
        scoreMap: Record<string, number>
    }
}

interface AddDrawData {
    type: typeof ADD_DRAW_DATA,
    data: DrawData
    length: number
}

interface ClearDrawData {
    type: typeof CLEAR_DRAW_DATA,
}

interface SetDrawLength {
    type: typeof SET_DRAW_LENGTH,
    data: number
}

interface ChangeCurId {
    type: typeof CHANGE_CUR_ID,
    curId: string
    nextTimestamp: number
}

interface SetScoreMap {
    type: typeof SET_SCORE_MAP,
    scoreMap: Record<string, number>
}
interface SetSettlement {
    type: typeof SET_SETTLEMENT,
    settlement: Record<string, number>
}
interface ChangeBackgound {
    type: typeof CHANGE_BACKGROUND,
    color: string
}

interface ChangeToChoose {
    stage: GameStage.Choose,
    // 当前选词玩家id
    currUserId: string
    // 下一回合时间戳
    nextTimestamp: number
}

interface ChangeToDrawing {
    stage: GameStage.Drawing
    // 当前绘制玩家id
    currUserId: string
    // 下一回合时间戳
    nextTimestamp: number
    word?: number[]
}

interface ChangeToResult {
    stage: GameStage.Result,
    // 当前绘制玩家id
    currUserId: string,
    // 下一回合时间戳
    nextTimestamp: number
    word?: number[]
}

interface ChangeToReady {
    stage: GameStage.Ready,
}

interface SetNextTimestamp {
    type: typeof SET_NEXT_TIMESTAMP,
    timestamp: number
}

export enum GameStage {
    Ready = 'ready',
    Choose = 'choose',
    Drawing = 'drawing',
    Result = 'result',
}

type GameAction = ChangeGameStage | InitGameState | AddDrawData | ClearDrawData | SetDrawLength | ChangeCurId | SetScoreMap | SetSettlement | ChangeBackgound | SetNextTimestamp

export type DrawData = Array<{
    data: string
    timestamp: number
}>

interface GameState {
    stage: GameStage
    drawList: DrawData
    drawLength: number
    background: string
    // 当前回合玩家id
    curUserId: string
    // 下一回合时间戳
    nextTimestamp: number
    // 每轮回合的成绩
    scoreMap: Record<string, number>
    // 结算数据
    settlement: Record<string, number>
    word?: number[]
}

const initGameState: GameState = {
    stage: GameStage.Ready,
    curUserId: '',
    nextTimestamp: 0,
    background: '#ffffff',
    scoreMap: {},
    settlement: {},
    drawList: [],
    drawLength: 0,
}

export function gameReducer(state = initGameState, action: GameAction) {
    switch(action.type) {
        case CHANGE_GAME_STAGE: {
            switch(action.data.stage) {
                case GameStage.Choose: {
                    state.curUserId = action.data.currUserId
                    state.nextTimestamp = action.data.nextTimestamp
                    if (state.drawList.length !== 0) {
                        state.drawList = []
                        state.drawLength = 0
                    }
                    break;
                }
                case GameStage.Drawing: {
                    state.curUserId = action.data.currUserId
                    state.nextTimestamp = action.data.nextTimestamp
                    state.word = action.data.word;
                    break;
                }
                case GameStage.Result: {
                    state.curUserId = action.data.currUserId
                    state.nextTimestamp = action.data.nextTimestamp
                    state.word = action.data.word
                    break;
                }
                case GameStage.Ready: {
                    state.nextTimestamp = 0
                }
            }
            state.stage = action.data.stage
            return { ...state }
        }
        case INIT_GAME_STATE: {
            state.stage = action.data.stage
            state.curUserId = action.data.currUserId
            state.nextTimestamp = action.data.nextTimestamp
            state.word = action.data.word
            state.drawList = action.data.drawList
            state.drawLength = action.data.drawLength
            state.settlement = action.data.settlement
            state.scoreMap = action.data.scoreMap
            return { ...state }
        }
        case ADD_DRAW_DATA: {
            if (state.drawLength + action.data.length !== action.length) {
                return state
            }
            state.drawList = [...state.drawList, ...action.data];
            state.drawLength = action.length
            return { ...state }
        }
        case CLEAR_DRAW_DATA: {
            state.drawList = []
            return { ...state }
        }
        case SET_DRAW_LENGTH: {
            state.drawLength = action.data
            state.drawList = state.drawList.slice(0, action.data)
            return { ...state }
        }
        case CHANGE_CUR_ID: {
            state.curUserId = action.curId
            state.nextTimestamp = action.nextTimestamp
            return { ...state }
        }
        case SET_SETTLEMENT: {
            state.settlement = action.settlement
            return { ...state }
        }
        case SET_SCORE_MAP: {
            state.scoreMap = action.scoreMap
            return { ...state }
        }
        case CHANGE_BACKGROUND: {
            state.background = action.color || '#ffffff'
            return { ...state }
        }
        case SET_NEXT_TIMESTAMP: {
            state.nextTimestamp = action.timestamp
            return { ...state }
        }
        default: {
            return state
        }
    }
}

export const gameActions = {
    init(data: InitGameState['data']): InitGameState {
        return { type: INIT_GAME_STATE, data }
    },
    addDrawData(data: DrawData, length: number): AddDrawData {
        return { type: ADD_DRAW_DATA, data, length }
    },
    setDrawLength(data: number): SetDrawLength {
        return { type: SET_DRAW_LENGTH, data }
    },
    clearDrawData(): ClearDrawData {
        return { type: CLEAR_DRAW_DATA }
    },
    changeCurId(curId: string, nextTimestamp: number): ChangeCurId {
        return{ type: CHANGE_CUR_ID, curId, nextTimestamp }
    },
    changeToChoose(userId: string, time: number): ChangeGameStage {
        return {
            type: CHANGE_GAME_STAGE,
            data: {
                stage: GameStage.Choose,
                currUserId: userId,
                nextTimestamp: time
            }
        }
    },
    changeToDrawing(userId: string, time: number, word?: number[]): ChangeGameStage {
        return {
            type: CHANGE_GAME_STAGE,
            data: {
                stage: GameStage.Drawing,
                currUserId: userId,
                nextTimestamp: time,
                word,
            }
        }
    },
    changeToResult(curId: string, nextTimestamp: number, word?: number[]): ChangeGameStage {
        return {
            type: CHANGE_GAME_STAGE,
            data: {
                stage: GameStage.Result,
                currUserId: curId,
                nextTimestamp,
                word,
            }
        }
    },
    changeToReady(): ChangeGameStage {
        return {
            type: CHANGE_GAME_STAGE,
            data: {
                stage: GameStage.Ready,
            }
        }
    },
    setScoreMap(map: SetScoreMap['scoreMap']): SetScoreMap {
        return {
            type: SET_SCORE_MAP,
            scoreMap: map
        }
    },
    setSettlement(map: SetSettlement['settlement']): SetSettlement {
        return {
            type: SET_SETTLEMENT,
            settlement: map
        }
    },
    changeBackgound(color: string): ChangeBackgound {
        return {
            type: CHANGE_BACKGROUND,
            color,
        }
    },
    setNextTimestamp(timestamp: number): SetNextTimestamp {
        return {
            type: SET_NEXT_TIMESTAMP,
            timestamp,
        }
    }
}