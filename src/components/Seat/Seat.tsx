import "./Seat.scss";
import SeatOffImg from "../../img/seat-off.png";
import BubbleWhiteImg from "../../img/bubble-white.png";
import { FC } from "react";
import { hooks } from "../../utils/hooks";
import { GameStage } from "../../state/gameState";
import { http } from "../../net/http";
import { store } from "../../state/store";
import { manualPolling } from "../../utils/polling";

enum PlayerState {
    IDLE = 1,
    READY,
    PICKING,
    DRAWING,
}

const Seat = () => {
    const userId = hooks.useSelector(state => state.info.userId)
    const players = hooks.useSelector(state => state.room.players)
    const seat = hooks.useSelector(state => state.room.seat)
    const ready = hooks.useSelector(state => state.room.readyState);
    const gameStage = hooks.useSelector(state => state.game.stage)
    const curUserId = hooks.useSelector(state => state.game.curUserId)
    const settlement = hooks.useSelector(state => state.game.settlement)
    const scoreMap = hooks.useSelector(state => state.game.scoreMap)
    return (
        <div className="seat-container">
            {seat.map((id, index) => {
                const player = players[id!];
                return (
                    <div key={index}>
                        { id === null || !players[id]
                            // 空白座位
                            ? <PlayerSeat empty onClick={() => {
                                if (!seat.includes(userId)) {
                                    http.get('/sitOn', {
                                        params: {
                                            userId: store.getState().info.userId,
                                            pos: index,
                                        }
                                    })
                                    manualPolling()
                                }
                            }}></PlayerSeat>
                            // 有人座位
                            : (
                                <PlayerSeat
                                userId={player.userId}
                                avatar={player.avatarUrl}
                                nick={player.nickName}
                                curUserId={curUserId}
                                stage={gameStage}
                                ready={!!ready[id]}
                                score={
                                    (settlement[id] || 0) +
                                    (scoreMap[id] || 0)
                                }
                                />
                            )
                        }
                    </div>
                )
            })}
        </div>
    )
}


interface PlayerSeatEmpty {
    empty: true
    onClick: () => void
}

interface PlayerSeatExists {
    empty?: false
    userId: string
    avatar: string
    nick: string
    score: number
    stage: GameStage,
    curUserId: string
    ready: boolean
}

type PlayerSeatProps = PlayerSeatEmpty | PlayerSeatExists

interface StateData {
    img: string
    text: string
}

const StateMap: Record<Exclude<PlayerState,PlayerState.IDLE>, StateData> = {
    [PlayerState.READY]: {
        img: BubbleWhiteImg,
        text: '已准备'
    },
    [PlayerState.DRAWING]: {
        img: BubbleWhiteImg,
        text: '绘画中'
    },
    [PlayerState.PICKING]: {
        img: BubbleWhiteImg,
        text: '选词中'
    }
}

const PlayerSeat: FC<PlayerSeatProps> = (props) => {
    if (props.empty) {
        return <img src={SeatOffImg} className="seat" alt="" onClick={() => props.onClick()}></img>
    }
    const { userId, avatar, nick, score, stage, ready, curUserId } = props
    let playerState: PlayerState = PlayerState.IDLE;
    switch(stage) {
        case GameStage.Ready: {
            ready && (playerState = PlayerState.READY)
            break
        }
        case GameStage.Choose: {
            userId === curUserId && (playerState = PlayerState.PICKING)
            break
        }
        case GameStage.Drawing: {
            userId === curUserId && (playerState = PlayerState.DRAWING)
            break
        }
        case GameStage.Result: {
            break
        }
        default: {

        }
    }
    return (
        <div className="seat">
            <img className="img" src={avatar} alt=""></img>
            <div className="score">{score}</div>
            <div className="nickname">{nick}</div>
            {playerState === PlayerState.IDLE ? null : (
                <div className="bubble bg100" style={{
                    backgroundImage: `url(${StateMap[playerState].img})`,
                }}>{StateMap[playerState].text}</div>
            )}
        </div>
    )
}

PlayerSeat.defaultProps = {
    empty: false
}

export default Seat