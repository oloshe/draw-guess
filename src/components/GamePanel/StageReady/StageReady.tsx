import { http } from "../../../net/http";
import { hooks } from "../../../utils/hooks";
import { manualPolling } from "../../../utils/polling";
import Button from "../../Button/Button";
import CountDown from "../../CountDown/CountDown";
import "./StageReady.scss";

const StageReady = () => {
    const userId = hooks.useSelector(state => state.info.userId)
    const ready = hooks.useSelector(state => state.room.readyState);
    const seat = hooks.useSelector(state => state.room.seat);
    const observer = hooks.useSelector(state => state.room.observer);
    const nextTimestamp = hooks.useSelector(state => state.game.nextTimestamp);
    
    const onReady = async () => {
        await http.get('/ready', { params: { userId, ready: !ready[userId] }})
        manualPolling()
    }
    const onInvite = () => {
        console.log('邀请')
    }

    const onCountDownEnd = async () => {
        await http.get('/getUp', {
            params: { userId }
        })
        setTimeout(() => alert('长期未准备 变成观众了'), 1000)
    }
    const showReadyCountDown = !observer.includes(userId) && !ready[userId] && seat.filter(a => !!a).length >= 3
    const timestamp = Date.now() + 10000


    return (
        <div className="stage_ready">
            <h1>游戏规则</h1>
            <p>绘画阶段描述者根据所选题目进行绘画，其他人答题</p>
            <p>答题者根据答对的先后顺序获得不同分数</p>
            <p>描述者根据猜对人数获得分数，所有人都猜对了则不会得分</p>
            <p>最后根据最终分数进行排名获得对应的奖励或惩罚</p>
            <h2>准备阶段</h2>
            { showReadyCountDown && <CountDown nextTimestamp={timestamp} onEnd={onCountDownEnd}></CountDown> }
            { nextTimestamp !== 0 && <CountDown nextTimestamp={nextTimestamp}></CountDown> }
            <div className="btn_view">
                <Button onClick={onInvite}>邀请</Button>
                <Button onClick={onReady} disable={!seat.includes(userId)}>{ready[userId] ? '取消准备' : '准备'}</Button>
            </div>
        </div>
    )
}

export default StageReady