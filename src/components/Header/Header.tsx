import "./Header.scss";
import ExitImg from "../../img/exit.png";
import PreviewImg from "../../img/preview.png";
import StoreImg from "../../img/store.png";
import ListImg from "../../img/list.png";
import { hooks } from "../../utils/hooks";

const Header = () => {
    const roomId = hooks.useSelector(state => state.room.name);
    const observer = hooks.useSelector(state => state.room.observer);
    return (
        <div className="header">
            <img src={ExitImg} className="icon" alt=""></img>
            <div className="room">{roomId? roomId + '房' : ''}</div>
            <img src={PreviewImg} className="icon observer" alt=""></img>
            <div className="ob_num">{Object.keys(observer).length}</div>
            <img src={StoreImg} className="icon store" alt=""></img>
            <img src={ListImg} className="icon list" alt=""></img>
        </div>
    )
}

export default Header