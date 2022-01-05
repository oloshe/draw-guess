import { nextTick } from "process";
import { FC, useEffect } from "react";
import { eventBus, MyEvents } from "../../../../utils/eventBus";
import { hooks } from "../../../../utils/hooks";

const EventChannel: FC = () => {
    const drawList = hooks.useSelector(state => state.game.drawList);
    const drawLength = hooks.useSelector(state => state.game.drawLength);
    const wordArr = hooks.useSelector(state => state.game.word);
    const background = hooks.useSelector(state => state.game.background);

    useEffect(() => {
        eventBus.emit(MyEvents.DrawListChanged, drawList)
    }, [drawList])

    useEffect(() => {
        nextTick(() => eventBus.emit(MyEvents.DrawLengthChanged, drawLength))
    }, [drawLength])

    useEffect(() => {
        let word = new TextDecoder().decode(new Uint8Array(wordArr || []));
        eventBus.emit(MyEvents.DrawWordChanged, word)
    }, [wordArr])

    useEffect(() => {
        eventBus.emit(MyEvents.DrawBackgroundChanged, background);
    }, [background])

    return (null)
}

export default EventChannel