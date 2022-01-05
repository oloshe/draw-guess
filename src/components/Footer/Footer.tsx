import "./Footer.scss";
import EmojiImg from "../../img/emoji.png";
import React, { useRef, useState } from "react";
import Picker, { SKIN_TONE_MEDIUM_DARK } from "emoji-picker-react";
import Graphemer from "graphemer";
import { store } from "../../state/store";
import { http } from "../../net/http";
import { manualPolling } from "../../utils/polling";

const splitter = new Graphemer()

const Footer = () => {
    const [inputValue, setInputValue] = useState('')
    const [showEmoji, setShowEmoji] = useState(false)
    const inputRef = useRef<HTMLInputElement>(null);

    const onTextConfirm = (text: string) => {
        if (!text) { return }
        if (inputRef.current) {
            inputRef.current.blur()
        }
        http.get('/chat', { params: { 
            userId: store.getState().info.userId,
            content: text,
        }})
            .then(() => {
                manualPolling()
            })
        setInputValue('')
        setShowEmoji(false)
    }

    const onKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            onTextConfirm(inputValue)
        }
    }

    const onShowEmoji = () => {
        setShowEmoji(bool => !bool)
        inputRef.current?.focus()
    }
    return (
        <>
            <div className="footer">
                <input type="text"
                    ref={inputRef}
                    className="footer-input"
                    value={inputValue}
                    onChange={e => setInputValue(e.target.value)}
                    onKeyDown={e => onKeyPress(e)}
                ></input>
                <img src={EmojiImg} className="icon emoji" alt="emoji" onClick={onShowEmoji}></img>
                <div className="emoji_picker" style={{
                    opacity: showEmoji ? 1 : 0,
                    pointerEvents: showEmoji ? 'unset' : 'none',
                }}>
                    <Picker
                        onEmojiClick={(_, data) => {
                            const emoji = data.emoji;
                            if (inputRef.current) {
                                inputRef.current.focus()
                                const start = inputRef.current.selectionStart || 0
                                console.log(start)
                                setInputValue(old => {
                                    const graphemes = splitter.splitGraphemes(old);
                                    graphemes.splice(start, 0, emoji)
                                    return graphemes.join('')
                                })
                            }
                        }}
                        disableAutoFocus={true}
                        skinTone={SKIN_TONE_MEDIUM_DARK}
                        groupNames={{ smileys_people: "PEOPLE" }}
                        native
                    />
                </div>
            </div>
            <div className="emoji_mask" hidden={!showEmoji} onClick={() => {
                setShowEmoji(false)
            }}></div>
        </>
    )
}

export default Footer;