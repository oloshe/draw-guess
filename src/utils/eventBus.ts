import { DrawData } from "../state/gameState"

export enum MyEvents {
    DrawListChanged = 'draw_list_changed',
    DrawLengthChanged = 'draw_length_changed',
    DrawWordChanged = 'draw_word_changed',
	DrawBackgroundChanged = 'draw_background_change',
}

export type MyEventData<K> = K extends keyof MyEventDataStruct ? MyEventDataStruct[K] : any

interface MyEventDataStruct {
    [MyEvents.DrawBackgroundChanged]: string
    [MyEvents.DrawListChanged]: DrawData
    [MyEvents.DrawLengthChanged]: number
    [MyEvents.DrawWordChanged]: string
}

export type BusEvent<T> = {
    detail: T
}

type BusCallback<T> = (e: BusEvent<MyEventData<T>>) => void

class EventBus {
    private bus: HTMLElement
    constructor() {
        this.bus = document.createElement('EventBus')
	}
    /** 触发事件 */
    emit<T extends MyEvents>(event: T, detail: MyEventData<T>) {
        // console.log(`[eventbus.${event}]`, detail)
        this.bus.dispatchEvent(new CustomEvent(event, { detail }));
    }
    emitFocu<T extends MyEvents>(event: T, key: string, detail: MyEventData<T>) {
        this.emit<any>(`${event}.${key}`, detail)
    }
    /** 监听事件 */
    on<T extends MyEvents>(event: T, callback: BusCallback<T>, options?: boolean | AddEventListenerOptions) {
        this.bus.addEventListener(event, callback as any, options);
        return { off: () => this.off(event, callback as any) }
	}
	/** 一次性监听 */
	once<T extends MyEvents>(event: T, callback: BusCallback<T>) {
		return this.on<T>(event, callback, { once: true })
	}
	/** 监听某类事件的某一项 */
    focu<T extends MyEvents>(event: T, key: string, callback: BusCallback<T>) {
        return this.on<any>(`${event}.${key}`, callback);
    }
    /** 取消监听 */
    off(event: string, callback: any) {
        this.bus.removeEventListener(event, callback);
    }

}

export const eventBus = new EventBus()