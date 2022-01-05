import "./GamePanel.scss";
import RectBigImg from "../../img/rect-big.png";
import StageReady from "./StageReady/StageReady";
import { hooks } from "../../utils/hooks";
import { gameActions, GameStage } from "../../state/gameState";
import StageChoose from "./StageChoose/StageChoose";
import StageDraw from "./StageDraw/StageDraw";
import { store } from "../../state/store";
import StageResult from "./StageResult/StageResult";
import { useState } from "react";
import Button from "../Button/Button";

type SettlementList = Array<{
    score: number;
    userId: string;
    avatarUrl: string;
    nickName: string;
}>;

const GamePanel = () => {
    const stage = hooks.useSelector(state => state.game.stage);
    const [settlementList, setSettlementList] = useState<SettlementList | null>(null)

    hooks.usePolling((oldState, data) => {
        let curId = data.curId!;
        let nextTimestamp = data.nextTimestamp;
        if (oldState.game.stage !== data.stage) {
            switch (data.stage) {
                case GameStage.Choose: {
                    store.dispatch(gameActions.changeToChoose(curId, nextTimestamp))
                    break
                }
                case GameStage.Drawing: {
                    store.dispatch(gameActions.changeToDrawing(curId, nextTimestamp, data.word))
                    break
                }
                case GameStage.Result: {
                    store.dispatch(gameActions.changeToResult(curId, nextTimestamp, data.word))
                    break
                }
                case GameStage.Ready: {
                    store.dispatch(gameActions.changeToReady())
                    let { room: { players }, game: { settlement } } = oldState;
                    let list = oldState.room.seat.filter((id) => {
                        return !!oldState.room.players[id!]
                    }).map((id) => {
                        return {
                            ...players[id!],
                            score: settlement[id!] || 0,
                        }
                    }).sort((a, b) => b.score - a.score)
                    setSettlementList(list);
                    break;
                }
                default: {
                    console.log('switch to', stage)
                }
            }
        } else {
            switch (data.stage) {
                case GameStage.Ready: {
                    if (oldState.game.nextTimestamp !== nextTimestamp) {
                        store.dispatch(gameActions.setNextTimestamp(nextTimestamp))
                    }
                    break;
                }
                default: {}
            }
        }
    })
    return (
        <>
            <div className="game_panel bg100" style={{
                backgroundImage: `url(${RectBigImg})`,
            }}>
                {stage === GameStage.Ready && <StageReady></StageReady>}
                {stage === GameStage.Choose && <StageChoose></StageChoose>}
                {stage === GameStage.Drawing && <StageDraw></StageDraw>}
                {stage === GameStage.Result && <StageResult></StageResult>}
            </div>
            {settlementList !== null && <div className="settlement">
                <h1>游戏结束</h1>
                {settlementList.map(item => (
                    <div className="item" key={item.userId}>
                        <img className="avatar" src={item.avatarUrl} alt={item.nickName} />
                        <div className="nick">{item.nickName}</div>
                        <div className="score">得分：{item.score}</div>
                    </div>
                ))}
                <Button className="cls-btn" onClick={() => setSettlementList(null)}>关闭</Button>
            </div>}
        </>
    )
}

export default GamePanel