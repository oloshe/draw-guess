import { FC, useEffect, useRef } from "react";
import "./StageResult.scss";
import { hooks } from "../../../utils/hooks";
import { deserialiazeDrawStr } from "../StageDraw/StageDraw";
import { utils } from "../../../utils/utils";
import DashedBoxBottom from "../../../img/dashed-box-bottom.png";
import DownloadImg from "../../../img/download.png";
import ShareImg from "../../../img/share.png";
import Canvas2Image from "../../../utils/canvas2image";

const StageResult: FC = () => {
    const list = hooks.useSelector(state => state.game.drawList);
    const background = hooks.useSelector(state => state.game.background);
    const wordArr = hooks.useSelector(state => state.game.word);
    const canvas = useRef<HTMLCanvasElement>(null)
    console.log(list)
    useEffect(() => {
        if (!canvas.current) return
        const ctx = canvas.current.getContext('2d');
        if (!ctx) return
        ctx.fillStyle = background || '#ffffff'
        ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        list.forEach((item) => {
            let { width, color, list } = deserialiazeDrawStr(item.data);
            ctx.lineWidth = width
            ctx.strokeStyle = color
            ctx.lineJoin = 'round';
            utils.arrayPointAccess(list, (x, y) => {
                ctx.beginPath()
                ctx.moveTo(x, y);
            }, (x, y) => {
                ctx.lineTo(x, y);
                ctx.stroke()
                ctx.moveTo(x, y);
            })
            ctx.closePath()
        })
    }, [background, list])

    const onShare = () => {

    }

    const onSaveFile = () => {
       const a = Canvas2Image.saveAsJPEG(canvas.current, 500, 500, "save");
       console.log(a)
    }

    return (
        <div className="stage_draw stage_result">
            <canvas ref={canvas}
            className="canvas"
            width="500"
            height="500"
            ></canvas>
            <div className="word">{utils.u8arrToString(wordArr||[])}</div>
            <div className="draw_toolbar toolbar bg100" style={{
                backgroundImage: `url(${DashedBoxBottom})`,
            }}>
                <img src={DownloadImg} className="download" alt="download" onClick={onSaveFile}></img>
                <img src={ShareImg} className="share" alt="share" onClick={onShare}></img>
            </div>
        </div>
    )
}

export default StageResult;