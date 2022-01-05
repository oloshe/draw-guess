import { useEffect, useRef } from "react";
import { hooks } from "../../utils/hooks";
import "./ChatContent.scss";

const ChatContent = () => {
    const chat_list = hooks.useSelector(state => state.chat.list)
    const players = hooks.useSelector(state => state.room.players)
    const containerRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        if (containerRef.current) {
            const elem = containerRef.current
            const curHeight = elem.scrollHeight;
            elem.scrollTo({
                top: curHeight,
                behavior: 'smooth',
            })
        }
    }, [chat_list])
    return (
        <div ref={containerRef} className="chat_content">
            {chat_list.map((item, idx) => {
                if (item.userId === "0") {
                    return (
                        <div className="chat_item" key={idx}>
                            <span className="content">{item.content}</span>
                        </div>
                    )
                }
                let player = players[item.userId]
                if (!player) return null
                return (
                    <div className="chat_item" key={idx}>
                        <img className="avatar" src={player.avatarUrl} alt=""></img>
                        <span className="nick">{player.nickName}: </span>
                        <span className="content">{item.content}</span>
                    </div>
                )
            })}
        </div>
    )
}

export default ChatContent