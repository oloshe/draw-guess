import { FC, useEffect, useState } from "react"
import { utils } from "../../utils/utils";

interface CountDownProps {
    nextTimestamp: number
    className?: string
    hideOnZero?: boolean
    onEnd?: () => void
}

const CountDown: FC<CountDownProps> = (props) => {
    const [time, setTime] = useState(0);
    const hideOnZero = props.hideOnZero;

    useEffect(() => {
        let timer: NodeJS.Timer
        timer = setInterval(() => {
            let sec = utils.getRemainSecs(props.nextTimestamp);
            if (sec <= 0) {
                props.onEnd?.()
                clearInterval(timer)
            }
            setTime(sec)
        })
        return () => {
            clearInterval(timer)
        }
    }, [props])

    return (
        hideOnZero && time <= 0 ? null : <div className={`countdown ${props.className}`}>{time >= 0 ? time : 0}</div>
    )
}

CountDown.defaultProps = {
    hideOnZero: true,
}

export default CountDown