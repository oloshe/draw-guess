import "./StageChoose.scss";
import DashedBoxImg from "../../../img/dashed-box.png";
import Button from "../../Button/Button";
import { CSSProperties, useEffect, useState } from "react";
import { hooks } from "../../../utils/hooks";
import { http } from "../../../net/http";
import CountDown from "../../CountDown/CountDown";
import { store } from "../../../state/store";
import { gameActions, GameStage } from "../../../state/gameState";
const StageChoose = () => {
    const userId = hooks.useSelector(state => state.info.userId)
    const curUserId = hooks.useSelector(state => state.game.curUserId)
    const players = hooks.useSelector(state => state.room.players)
    const nextTimestamp = hooks.useSelector(state => state.game.nextTimestamp)
    const [words, setWords] = useState<Array<string>>([])
    const onWordClick = async (word: string) => {
        await http.get('/choose', {
            params: { userId, word }
        })
    }
    const onChangeWords = () => {
        http.get('/random')
            .then(res => {
                console.log(res.data)
                if (Array.isArray(res.data)) {
                    setWords(res.data)
                }
            })
    }
    const wordStyle: CSSProperties = {
        backgroundImage: `url(${DashedBoxImg})`
    }

    useEffect(() => {
        if (curUserId === userId) {
            onChangeWords()
        }
    }, [userId, curUserId])

    hooks.usePolling((oldState, data) => {
        if (data.curId !== oldState.game.curUserId) {
            store.dispatch(gameActions.changeCurId(data.curId!, data.nextTimestamp))
        }
        if (data.curId === null && data.stage === GameStage.Ready) {
            store.dispatch(gameActions.changeToReady())
        }
    })

    return (
        <div className="stage_choose">
            <CountDown className="countdown" nextTimestamp={nextTimestamp} />
            <h1>选词绘画</h1>
            {curUserId === userId ? (
                <>
                    <p>请选择你要描述的词语</p>
                    <div className="words">
                        {words.map(item => (
                            <div key={item} className="word bg100" style={wordStyle} onClick={() => onWordClick(item)}>{item}</div>
                        ))}
                    </div>
                    <Button className="switch_btn" onClick={onChangeWords}>换一批</Button>
                </>
            ) : (
                <div>{players[curUserId]?.nickName}选词中</div>
            )}
            
        </div>
    )
}

export default StageChoose