import { useEffect } from "react";
import { TypedUseSelectorHook, useSelector as _useSelector  } from "react-redux";
import { RootReducer } from "../state/store";
import { PollingData } from "./polling";

type RootState = ReturnType<typeof RootReducer>
const useSelector: TypedUseSelectorHook<RootState> = _useSelector

type pollingFunction = (oldState: RootState, data: PollingData) => void
export const pollingQueue: pollingFunction[] = []

const usePolling = (callback: pollingFunction) => {
    useEffect(() => {
        pollingQueue.push(callback)
        return () => {
            const index = pollingQueue.findIndex(fn => fn === callback)
            pollingQueue.splice(index, 1);
        }
    }, [callback])
}

export const hooks = {
    useSelector,
    usePolling,
}