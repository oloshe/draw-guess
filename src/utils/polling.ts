import { BaseData } from "../App";
import { http } from "../net/http"
import { chatActions } from "../state/chatState";
import { gameActions } from "../state/gameState";
import { roomActions } from "../state/roomState";
import { store } from "../state/store"
import { pollingQueue } from "./hooks";

// 轮训间隔时间
const pollingIntervalTime = 2000;

let url: string, params: any;

const polling = () => {
    const id = setInterval(async () => {
        manualPolling()
    }, pollingIntervalTime)
    return id
}

export const manualPolling = async () => {
    const _state = store.getState();
    params.t = _state.chat.lastTimestamp
    params.dl = _state.game.drawList.length
    const res = await http.get(url, { params })
    if (res.data === null) return;
    const { 
        observer, players, readyState, seat, chatHistory = [],
        scoreMap, settlement
        // stage, curId, nextTimestamp
    } = res.data as PollingData;
    const curState = store.getState();

    pollingQueue.forEach(fn => {
        fn(curState, res.data as PollingData)
    })

    // 更新观战人数
    if (observer.length !== curState.room.observer.length) {
        store.dispatch(roomActions.setObserver(observer))
    }
    // 更新座位
    if (JSON.stringify(seat) !== JSON.stringify(curState.room.seat)) {
        store.dispatch(roomActions.setSeat(seat));
    }
    // 更新准备状态
    if (readyState && JSON.stringify(readyState) !== JSON.stringify(curState.room.readyState)) {
        store.dispatch(roomActions.setReady(readyState))
    }

    // 临时成绩
    if (scoreMap && JSON.stringify(scoreMap) !== JSON.stringify(curState.game.scoreMap)) {
        store.dispatch(gameActions.setScoreMap(scoreMap))
    }
    // 总成绩
    if (settlement && JSON.stringify(settlement) !== JSON.stringify(curState.game.settlement)) {
        store.dispatch(gameActions.setSettlement(settlement))
    }

    // 更新新玩家进入
    let oldPlayers = curState.room.players;
    let newPlayers: typeof oldPlayers = {}
    for(let id in players) {
        if (!oldPlayers[id]) {
            newPlayers[id] = players[id]
        }
    }
    if (Object.keys(newPlayers).length > 0) {
        store.dispatch(roomActions.add_players(newPlayers));
    }

    // 聊天
    let time = curState.chat.lastTimestamp;
    let lastestIndex = chatHistory.findIndex(item => item.timestamp > time)
    if (lastestIndex !== -1) {
        store.dispatch(chatActions.addToChat(chatHistory.slice(lastestIndex)))
    }
}

export const startPolling = (roomId: string, userId: string) => {
    url = '/poll'
    params = { roomId, userId }
    return polling();
}


export interface PollingData extends BaseData {
    drawList: Array<{
        data: string
        timestamp: number
    }>
    drawLength: number
}

