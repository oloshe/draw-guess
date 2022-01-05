import { FC } from "react"
import ButtonImg from "../../img/button.png";
import "./Button.scss";

interface ButtonProps {
    bg?: string,
    disable?: boolean
    onClick?: () => void
    className?: string
}

const Button: FC<ButtonProps> = (props) => {
    return (
        <div className={`m_button bg100 ${props.className??''} ${props.disable ? 'disable' : ''}`} style={{
            backgroundImage: `url(${props.bg})`,
            pointerEvents: props.disable ? 'none' : void 0
        }} onClick={() => props.onClick?.()}>{props.children}</div>
    )
}

Button.defaultProps = {
    bg: ButtonImg
}

export default Button