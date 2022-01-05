import { forwardRef, useImperativeHandle, useState } from "react";
import BrushImg from "../../../../img/brush.png";
import BrushOnImg from "../../../../img/brush-on.png";
import ColorImg from "../../../../img/color.png";
import ColorOnImg from "../../../../img/color-on.png";
import RenderImg from "../../../../img/render.png";
import RenderOnImg from "../../../../img/render-on.png";
import EraserImg from "../../../../img/eraser.png";
import { http } from "../../../../net/http";
import { store } from "../../../../state/store";
import { manualPolling } from "../../../../utils/polling";

const widthArr = [1, 2, 5, 7, 10]
const colorArr = [
    `#000000`,
    '#ffffff',
    '#f8ae3b',
    '#ef2b2f',
    '#2494ff',
    '#79b534',
]
const bgColorArr = [
    '#ffffff',
    `#000000`,
    '#f8ae3b',
    '#ef2b2f',
    '#2494ff',
    '#79b534',
]

export interface FunctionPanelRef {
    width: number
    color: string
}

const FunctionPanel= forwardRef<FunctionPanelRef, {}>((props, ref) => {
    const [openIndex, setIndex] = useState(-1)
    const [width, setWidth] = useState(widthArr[0]);
    const [color, setColor] = useState(colorArr[0]);
    const [bgColor, setBgColor] = useState(colorArr[0])
    const changeIndex = (index: number) => {
        if (openIndex === index) {
            setIndex(-1)
        } else {
            setIndex(index)
        }
    }
    useImperativeHandle(ref, () => ({
        width, color
    }), [width, color])
    return (
        <>
        <div className="function_bar">
            <img src={openIndex === 0 ? BrushOnImg : BrushImg} alt="brush" className="f_icon" onClick={() => changeIndex(0)}/>
            <img src={openIndex === 1 ? ColorOnImg : ColorImg} alt="color" className="f_icon" onClick={() => changeIndex(1)}/>
            <img src={openIndex === 2 ? RenderOnImg : RenderImg} alt="color" className="f_icon" onClick={() => changeIndex(2)}/>
            <img src={EraserImg} alt="erase" className="f_icon" onClick={() => {
                changeIndex(3)
                http.get('/clear', { params: {
                    userId: store.getState().info.userId
                }})
            }}/>
        </div>
        {openIndex !== -1 && <div className="bubble">
            {openIndex === 0 && (
                widthArr.map((item, index) => (
                    <div key={item} className="brush_width" onClick={() => {
                        setWidth(item)
                        
                    }}>
                        <div className={`s${index} ${width === item ? 'selected' : ''}`}></div>
                    </div>
                ))
            )}
            {openIndex === 1 && (
                colorArr.map((item, index) => (
                    <div key={item} className="background_color" onClick={() => setColor(item)}>
                        <div className={`child ${color === item ? 'selected' : ''}`} style={{backgroundColor: item}}></div>
                    </div>
                ))
            )}
            {openIndex === 2 && (
                bgColorArr.map((item, index) => (
                    <div key={item} className="brush_color" onClick={() => {
                        setBgColor(item)
                        http.get('/setColor', { params: {
                            userId: store.getState().info.userId,
                            color: item
                        }}).then(() => {
                            manualPolling()
                        })
                    }}>
                        <div className={`child ${bgColor === item ? 'selected' : ''}`} style={{backgroundColor: item}}></div>
                    </div>
                ))
            )}
        </div>}
        </>
    )
})

export default FunctionPanel;