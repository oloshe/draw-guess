import React, { useEffect, useRef, useState } from "react";
import { http } from "../../../net/http";
import { DrawData, gameActions, GameStage } from "../../../state/gameState";
import { store } from "../../../state/store";
import { hooks } from "../../../utils/hooks";
import { utils } from "../../../utils/utils";
import "./StageDraw.scss";
import DashedBoxBottom from "../../../img/dashed-box-bottom.png";
import UnDoImg from "../../../img/undo.png";
import ReDoImg from "../../../img/redo.png";
import EventChannel from "./EventChannel/EventChannel";
import { eventBus, MyEvents } from "../../../utils/eventBus";
import { manualPolling } from "../../../utils/polling";
import FunctionPanel, { FunctionPanelRef } from "./FunctionPanel/FunctionPanel";
import CountDown from "../../CountDown/CountDown";

let $lock_time = 0
const THROTTLE_TIME = 10;

export interface CtxData {
    canvas_width: number
    canvas_height: number
    width_scale: number
    height_scale: number
    lineData: string
    pointList: number[]
    drawStartAt: number
    drawList: DrawData
    drawLength: number
    background: string
    recycle_path: string[]
    drawWidth: number
    drawColor: string
    canTouchMove: boolean
    actionQueue: paintAction[]
    actionDoing: boolean
}

type paintAction = drawAction | undoAction
interface drawAction {
    type: 'draw'
    data: string
}
interface undoAction {
    type: 'repaint',
}

const draw_from = (ctx: CanvasRenderingContext2D, x: number, y: number) => {
    ctx.beginPath()
    ctx.moveTo(x, y);
}

const draw_to = (ctx: CanvasRenderingContext2D, x: number, y: number, manual = false) => {
	// 控制频率在 xx ms/次 以上
	if (manual && throttle(THROTTLE_TIME)) {
		return false
	} else {
		ctx.lineTo(x, y);
		ctx.stroke()
		ctx.moveTo(x, y);
		return true
	}
}


/** 节流 */
const throttle = (time: number) => {
	let now = Date.now()
	if (now - $lock_time < time) {
		return false
	} else {
		$lock_time = now
		return true
	}
}


export const deserialiazeDrawStr = (str: string) => {
    let index = str.indexOf('|')
    let header_str = str.substring(0, index)
    let point_str = str.substring(index + 1);
    let [width, color, duration] = header_str.split(';')
    let list = utils.stringToArray(point_str)
    return { 
        width: parseInt(width), 
        duration: parseInt(duration),
        color, 
        list,
    }
}

const StageDraw = () => {
    const stage = hooks.useSelector(state => state.game.stage);
    const userId = hooks.useSelector(state => state.info.userId);
    const curUserId = hooks.useSelector(state => state.game.curUserId);
    const wordArr = hooks.useSelector(state => state.game.word);
    const nextTimestamp = hooks.useSelector(state => state.game.nextTimestamp);
    const canvas = useRef<HTMLCanvasElement>(null)
    const [ctx, setCtx] = useState<CanvasRenderingContext2D>(null!);
    const fpRef = useRef<FunctionPanelRef>(null);
    const $state = store.getState();
    const { current: ctxData } = useRef<CtxData>({
        canvas_height: 500,
        canvas_width: 500,
        width_scale: 0,
        height_scale: 0,
        lineData: '',
        pointList: [],
        drawStartAt: 0,
        drawLength: $state.game.drawLength,
        background: "#ffffff",
        drawList: $state.game.drawList,
        recycle_path: [],
        drawWidth: 1,
        drawColor: '#000000',
        canTouchMove: true,
        actionQueue: [],
        actionDoing: false
    });
    const [rect, setRect] = useState<DOMRect>(null!);

    useEffect(() => {
        if (canvas.current) {
            let $canvas = canvas.current;
            let ctx = $canvas.getContext('2d')!;
            console.log('ctx loaded', ctx)
            ctx.lineJoin = 'round'
            const rect = $canvas.getBoundingClientRect()
            setCtx(ctx!)
            setRect(rect)
            ctxData.width_scale = $canvas.width / rect.width
            ctxData.height_scale = $canvas.height / rect.height
            ctxData.canvas_width = $canvas.width
            ctxData.canvas_height = $canvas.height
        }
    }, [canvas, ctxData])

    const redraw = () => {
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        ctx.fillStyle = ctxData.background
        ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        const drawList = ctxData.drawList
        const max = ctxData.drawList.length
        for (let i = 0; i < max; i++) {
            if (!drawList[i]) {
                console.warn('no data', i)
                continue
            }
            let {
                width, color, list
            } = deserialiazeDrawStr(drawList[i].data)
            setContextStyle(width, color)
            utils.arrayPointAccess(list, 
                (x, y) => draw_from(ctx, x, y), 
                (x, y) => draw_to(ctx, x, y, false)
            )
        }
    }

    useEffect(() => {
        if (!ctx) {
            return console.warn('no ctx')
        }
        redraw()
    })

    hooks.usePolling((oldState, data) => {
        if (data.drawList && data.drawList.length) {
            store.dispatch(gameActions.addDrawData(data.drawList, data.drawLength))
        } else if (oldState.game.drawLength !== data.drawLength) {
            store.dispatch(gameActions.setDrawLength(data.drawLength))
        }
        if (oldState.game.background !== data.background) {
            store.dispatch(gameActions.changeBackgound(data.background))
        }
    })

    useEffect(() => {
        let list = [
            eventBus.on(MyEvents.DrawListChanged, ({ detail }) => {
                console.log('drawList set!', detail.length)
                ctxData.drawList = detail;
            }),
            eventBus.on(MyEvents.DrawLengthChanged, ({ detail }) => {
                let oldLength = ctxData.drawLength;
                let newLength = detail
                let amount = newLength - oldLength;
                ctxData.drawLength = newLength
                if (userId !== curUserId) {
                    console.log('需要画：', amount);
                    if (amount > 0) {
                        for (let i = oldLength; i < newLength; i++) {
                            console.log(i, ctxData.drawList)
                            if (ctxData.drawList[i]) {
                                ctxData.actionQueue.push({
                                    type: 'draw',
                                    data: ctxData.drawList[i].data,
                                })
                            }
                        }
                    }
                }
                if (amount < 0) {
                    ctxData.actionQueue.push({
                        type: 'repaint'
                    })
                }
                queueDo()
            }),
            eventBus.on(MyEvents.DrawBackgroundChanged, ({detail}) => {
                ctxData.background = detail;
                ctxData.actionQueue.push({
                    type: 'repaint'
                })
                queueDo()
            })
        ]
        return () => {
            list.map(item => item.off())
        }
    }, [ctx, ctxData, userId, curUserId])


    const canDraw = () => userId === curUserId && rect && stage !== GameStage.Result

    const setContextStyle = (width?: number, color?: string) => {
        ctx.lineWidth = width || fpRef.current?.width || ctxData.drawWidth
        ctx.strokeStyle = color || fpRef.current?.color || ctxData.drawColor
    }

    const queueDo = async () => {
        if (ctxData.actionDoing) return
        let action = ctxData.actionQueue.shift()
        if (!action) return
        ctxData.actionDoing = true
        switch(action.type) {
            case 'draw': {
                await auto_draw(action.data); break;
            }
            case 'repaint': {
                redraw(); break;
            }
            default: {

            }
        }
        ctxData.actionDoing = false
        await queueDo()
    }

    const onTouchStart = (e: React.TouchEvent) => {
        if (!canDraw()) return
        let [x, y] = getPoint(e);
        draw_from(ctx, x, y)
        setContextStyle()
        ctxData.drawStartAt = Date.now()
        ctxData.pointList = [x, y]
    }
    const onTouchMove = (e: React.TouchEvent) => {
        if (!canDraw()) return
        let [x, y] = getPoint(e);
        if (!ctxData.canTouchMove) {
            if (paintInside(x, y)) {
                draw_from(ctx, x, y)
                ctxData.canTouchMove = true;
                ctxData.drawStartAt = Date.now()
                ctxData.pointList = [x, y]
                onTouchMove(e)
            }
            return
        }
        if (draw_to(ctx, x, y, true)) {
            if (paintInside(x, y)) {
                ctxData.pointList.push(x, y);
            } else {
                let last_point = ctxData.pointList.slice(ctxData.pointList.length - 2)
                if (last_point) {
                    let [x1, y1] = last_point;
                    let edge_point = calulate_end_point(x1, y1, x, y);
                    if (edge_point) {
                        ctxData.pointList.push(...edge_point)
                    }
                    onTouchEnd()
                    // 重置节流时间
                    $lock_time = 0
                    ctxData.canTouchMove = false;
                }
            }
            
            
        }
    }
    const onTouchEnd = () => {
        if (!canDraw()) return
        ctx.closePath()
        const str = utils.arrayToString(ctxData.pointList)

        let duration = (Date.now() - ctxData.drawStartAt) / 1000
        let prefix = buildDrawDataMetaData(duration)
        http.get("/draw", {
            params: {
                userId,
                rawData: prefix + str,
                timestamp: Date.now(),
            }
        })
    }

    const paintInside = (x: number, y: number) => {
        return !(x < 0 || y < 0 || x > ctxData.canvas_width || y > ctxData.canvas_height)
    }
    const calulate_end_point = (x1: number, y1: number, x2: number, y2: number) => {
        let _x = x1 - x2, _y = y1 - y2;
		let dist = Math.sqrt(_x * _x + _y * _y);
		if (dist < 10) return null
		let len1, // 内点到边界的最短路径
			len2, // 外点到边界的最短路径
			// 是否是长边溢出
			isLongSide,
			// 是否是垂直方向
			isVert = y2 < 0 || y2 > ctxData.canvas_height
		if (isVert) {
			isLongSide = y2 > ctxData.canvas_height
			if (isLongSide) {
				len1 = Math.abs(ctxData.canvas_height - y1)
				len2 = Math.abs(y2 - ctxData.canvas_height)
			} else {
				len1 = Math.abs(y1)
				len2 = Math.abs(y2)
			}
		} else {
			isLongSide = x2 > ctxData.canvas_width
			if (isLongSide) {
				len1 = Math.abs(ctxData.canvas_width - x1)
				len2 = Math.abs(x2 - ctxData.canvas_width)
			} else {
				len1 = Math.abs(x1)
				len2 = Math.abs(x2)
			}
		}
		// 计算夹角度数
		let sita = Math.acos((len1 + len2) / dist)
		// 临界点距离短边X/Y轴坐标的变化的长度
		let del = Math.tan(sita) * len2
		let ret // 结果
		if (isVert) {
			if (x2 > x1) { del = -del }
			ret = [x2 + del, isLongSide ? ctxData.canvas_height : 0]
		} else {
			if (y2 > y1) { del = -del }	
			ret = [isLongSide ? ctxData.canvas_width : 0, y2 + del]
		}
		console.log(ret)
		return ret
	}


    const getPoint = (e: React.TouchEvent) => {
        let touches = e.changedTouches[0];
        let x = (touches.clientX - rect.left) * ctxData.width_scale
        let y = (touches.clientY - rect.top) * ctxData.height_scale
        return [x, y].map(num => Math.round(num))
    }

    const buildDrawDataMetaData = (duration: number) => {
        let color = ctx.strokeStyle;
        let width = ctx.lineWidth;
        return `${width};${color};${duration}|`
    }

    const auto_draw = async (rawStr?: string) => {
        if (!rawStr || !ctx) {
            return console.warn(`can not draw (${rawStr})`, ctx)
        }
        const {
            width, color, duration = 1, list
        } = deserialiazeDrawStr(rawStr)
        let len = list.length, x: number, y: number;
        let ms = Math.floor((duration * 1000) / len)
        setContextStyle(width, color)
        for (let i = 0; i < len; i += 2) {
            x = list[i]; y = list[i + 1];
            if (i === 0) {
                draw_from(ctx, x, y)
            } else {
                draw_to(ctx, x, y, false)
                await utils.sleep(ms)
            }
        }
    }

    const undo = () => {
        http.get('/undo', {
            params: { userId }
        }).then(() => {
            let data = ctxData.drawList[ctxData.drawList.length - 1]?.data;
            if (data) {
                ctxData.recycle_path.push(data)
            }
            manualPolling()
        })
    }

    const redo = () => {
        let data = ctxData.recycle_path.pop()
        if (data) {
            auto_draw(data)
            http.get("/draw", {
                params: {
                    userId,
                    rawData: data,
                    timestamp: Date.now(),
                }
            })
        }
    }

    return (
        <div className="stage_draw">
            <EventChannel />
            <canvas ref={canvas}
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
            onTouchCancel={onTouchEnd}
            className="canvas"
            width="500"
            height="500"
            ></canvas>
            <div className="word">{utils.u8arrToString(wordArr||[])}</div>
            <CountDown className="countdown" nextTimestamp={nextTimestamp} />
            <div className="draw_toolbar bg100" style={{
                backgroundImage: `url(${DashedBoxBottom})`,
                visibility: userId === curUserId ? 'unset' : 'hidden'
            }}>
                <img src={UnDoImg} className="undo" alt="undo" onClick={undo}></img>
                <FunctionPanel ref={fpRef}></FunctionPanel>
                <img src={ReDoImg} className="redo" alt="redo" onClick={redo}></img>
            </div>
        </div>
    )
}

export default StageDraw;