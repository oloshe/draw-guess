import { FC } from "react";
import "./DrawGuess.scss";
import ChatContent from "../ChatContent/ChatContent";
import Footer from "../Footer/Footer";
import GamePanel from "../GamePanel/GamePanel";
import Header from "../Header/Header";
import Seat from "../Seat/Seat";

const DrawGuess: FC = () => {
    return (
        <div className="draw_guess">
            <Header></Header>
            <GamePanel></GamePanel>
            <Seat></Seat>
            <ChatContent></ChatContent>
            <Footer></Footer>
        </div>
    );
}

export default DrawGuess