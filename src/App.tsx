import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import './App.scss';
import DrawGuess from './components/DrawGuess/DrawGuess';
import { http } from './net/http';
import { chatActions } from './state/chatState';
import { DrawData, gameActions, GameStage } from './state/gameState';
import { infoActions, PlayerInfo } from './state/infoState';
import { roomActions } from './state/roomState';
import { startPolling } from './utils/polling';
import { utils } from './utils/utils';

function App() {
  const dispatch = useDispatch()
  
  useEffect(() => {
    let timer: NodeJS.Timer;
    http.get('/init', {
      params: { userId: utils.getQueryString('userId') }
    })
      .then(res => {
        console.log(res.data)
        if (res.data === null) {
          alert("请先进入房间")
        } else {
          let { room, user, meta } = res.data as InitData;
          let chatHistory = room.chatHistory || [];
          let drawData = room.drawData || { inner: [], length: 0 }
          delete (room as any).chatHistory;
          dispatch(infoActions.setMyInfo(user))
          dispatch(roomActions.setRoomInfo(room))
          dispatch(gameActions.init({
            stage: room.stage,
            currUserId: room.curId!,
            nextTimestamp: room.nextTimestamp,
            word: room.word,
            drawList: drawData.inner,
            drawLength: drawData.inner.length,
            settlement: room.settlement || {},
            scoreMap: room.scoreMap || {},
          }))
          chatHistory.length && dispatch(chatActions.addToChat(chatHistory))
          timer = startPolling(meta.id, user.userId)
        }
      })
      .catch((e) => {
        console.error(e)
        alert('初始化失败');
      })
    return () => {
      clearInterval(timer)
    }
  }, [dispatch])

  return (
    <div className="App">
      <DrawGuess></DrawGuess>
    </div>
  );
}

export default App;

interface InitData {
  room: InitRoomData
  meta: {
    id: string
    name: string
  }
  user: PlayerInfo
}

interface InitRoomData extends BaseData {
  drawData: {
    inner: DrawData,
    length: number
  }
}

export interface BaseData {
  observer: string[]
  players: Record<string, PlayerInfo>
  readyState: Record<string, boolean>
  seat: string[]
  chatHistory: {
      content: string
      timestamp: number
      userId: string
  }[]
  curId: string | null
  word: number[]
  stage: GameStage
  nextTimestamp: number
  scoreMap: Record<string, number>
  settlement: Record<string, number>
  background: string
}