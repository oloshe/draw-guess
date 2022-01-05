import { combineReducers, createStore } from "redux";
import { chatReducer } from "./chatState";
import { gameReducer } from "./gameState";
import { infoReducer } from "./infoState";
import { roomReducer } from "./roomState";

export const RootReducer = combineReducers({
    chat: chatReducer,
    room: roomReducer,
    info: infoReducer,
    game: gameReducer,
});

export const store = createStore(
    RootReducer,
    // @ts-ignore
    window?.devToolsExtension?.() ?? (f => f),
)