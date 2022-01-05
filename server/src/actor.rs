use std::{collections::HashMap, time::Duration};

use actix::{Actor, AsyncContext, Context, Handler, SpawnHandle};
use log::info;
use serde_json::{json, Value};

use crate::{
    message::*,
    room::{IfAllReadyResult, RoomData, RoomMeta, GameStage, CHOOSE_TIME, RESULT_TIME, DRAW_TIME},
    wrap::{PollingProvider, WrapToValue},
};

pub struct GameActor {
    /// 房间
    pub rooms: HashMap<String, RoomData>,
    /// 玩家映射: key: 玩家id， value：房间id
    pub player_room: HashMap<String, String>,
    pub room_spawn_handle: HashMap<String, SpawnHandle>,
}

impl Actor for GameActor {
    type Context = Context<Self>;
}

impl Default for GameActor {
    fn default() -> Self {
        Self {
            rooms: Default::default(),
            player_room: Default::default(),
            room_spawn_handle: Default::default(),
        }
    }
}

impl GameActor {
    /// 根据玩家id获取玩家所在房间
    fn get_player_room(&mut self, user_id: &String) -> Option<&mut RoomData> {
        if let Some(room_id) = self.player_room.get(user_id) {
            return self.rooms.get_mut(room_id);
        }
        None
    }
    fn set_choose_timeout(&mut self, room_id: &String, ctx: &mut <GameActor as Actor>::Context) {
        let handle = ctx.notify_later(ChooseTimeoutMsg {
            room_id: room_id.clone()
        }, Duration::from_secs(CHOOSE_TIME as u64));
        self.room_spawn_handle.insert(room_id.clone(), handle);
    }
    fn cancel_room_spawn(&mut self, room_id: &String, ctx: &mut <GameActor as Actor>::Context) {
        if let Some(handle) = self.room_spawn_handle.remove(room_id) {
            ctx.cancel_future(handle);
        }
    }
}

/// 处理创建房间消息
impl Handler<CreateRoomMsg> for GameActor {
    type Result = String;

    fn handle(&mut self, _: CreateRoomMsg, _: &mut Self::Context) -> Self::Result {
        let room_data = RoomData::new();
        let id = room_data.id.clone();
        self.rooms.insert(id.clone(), room_data);
        id
    }
}

/// 处理玩家加入房间
impl Handler<JoinRoomMsg> for GameActor {
    type Result = bool;

    fn handle(&mut self, msg: JoinRoomMsg, _: &mut Self::Context) -> Self::Result {
        let JoinRoomMsg { player, room_id } = msg;
        if let Some(room) = self.rooms.get_mut(&room_id) {
            room.join_player(&player);
            self.player_room
                .insert(player.user_id.clone(), room.id.clone());
            true
        } else {
            false
        }
    }
}

/// 初始化
impl Handler<InitMsg> for GameActor {
    type Result = Option<Value>;

    fn handle(&mut self, msg: InitMsg, _: &mut Self::Context) -> Self::Result {
        if let Some(room) = self.get_player_room(&msg.user_id) {
            let player = room.players.get(&msg.user_id);
            if let Some(player) = player {
                let player = player.to_value(); // 玩家信息
                let room_meta = RoomMeta::from_room_data(room);
                let room = room.to_value();
                return Some(json!({
                    "room": room,
                    "user": player,
                    "meta": room_meta,
                }));
            }
        }
        Default::default()
    }
}

/// 获取房间信息
impl Handler<GetRoomInfoMsg> for GameActor {
    type Result = Option<Value>;

    fn handle(&mut self, msg: GetRoomInfoMsg, _: &mut Self::Context) -> Self::Result {
        let room_id = msg.id;
        Some(self.rooms.get(&room_id).to_value())
    }
}

/// 玩家准备
impl Handler<RoomReadyMsg> for GameActor {
    type Result = ();

    fn handle(&mut self, msg: RoomReadyMsg, ctx: &mut Self::Context) -> Self::Result {
        if let Some(room) = self.get_player_room(&msg.user_id) {
            match room.stage {
                GameStage::Ready => {
                    if msg.ready {
                        room.ready(&msg.user_id);
                        match room.if_all_ready() {
                            IfAllReadyResult::Start => {
                                ctx.notify(GameStartMsg {
                                    room_id: room.id.clone()
                                })
                            },
                            IfAllReadyResult::AutoStart(sec) => {
                                ctx.notify(GameStartLaterMsg {
                                    room_id: room.id.clone(),
                                    duration: Duration::from_secs(sec as u64),
                                })
                            },
                            _ => (),
                        }
                    } else {
                        room.cacnel_ready(&msg.user_id);
                        // 有人取消准备则直接取消倒计时
                        ctx.notify(GameStartCancelMsg {
                            room_id: room.id.clone()
                        })
                    }
                },
                _ => (),
            }
        } else {
            // 该用户并不在房间内 无法准备
        }
    }
}

/// 站起围观
impl Handler<RoomGetUpMsg> for GameActor {
    type Result = bool;

    fn handle(&mut self, msg: RoomGetUpMsg, _: &mut Self::Context) -> Self::Result {
        if let Some(room) = self.get_player_room(&msg.user_id) {
            room.move_to_observer(&msg.user_id);
            return true;
        }
        false
    }
}

/// 坐下
impl Handler<RoomSitOnMsg> for GameActor {
    type Result = bool;

    fn handle(&mut self, msg: RoomSitOnMsg, _: &mut Self::Context) -> Self::Result {
        if let Some(room) = self.get_player_room(&msg.user_id) {
            return room.sit_on(&msg.user_id, msg.pos as usize);
        }
        false
    }
}

impl Handler<PollingMsg> for GameActor {
    type Result = Option<Value>;

    fn handle(&mut self, msg: PollingMsg, _: &mut Self::Context) -> Self::Result {
        Some(
            self.rooms.get(&msg.room_id).
                snapshot(&msg.user_id, msg.timestamp ,msg.draw_index)
        )
    }
}

impl Handler<ChatMsg> for GameActor {
    type Result = bool;

    fn handle(&mut self, msg: ChatMsg, _: &mut Self::Context) -> Self::Result {
        if let Some(room) = self.get_player_room(&msg.user_id) {
            room.add_chat(msg.user_id, msg.content);
            return true;
        }
        false
    }
}

impl Handler<LeaveRoomMsg> for GameActor {
    type Result = ();

    fn handle(&mut self, msg: LeaveRoomMsg, _: &mut Self::Context) -> Self::Result {
        if let Some(room) = self.get_player_room(&msg.user_id) {
            room.player_leave(&msg.user_id)
        }
    }
}

impl Handler<GetAllRoomMsg> for GameActor {
    type Result = Option<Value>;

    fn handle(&mut self, _: GetAllRoomMsg, _: &mut Self::Context) -> Self::Result {
        let vec = self
            .rooms
            .iter()
            .map(|(_, room)| RoomMeta::from_room_data(room))
            .collect::<Vec<RoomMeta>>();
        Some(serde_json::to_value(vec).unwrap_or(Default::default()))
    }
}

impl Handler<GameStartMsg> for GameActor {
    type Result = ();

    fn handle(&mut self, msg: GameStartMsg, ctx: &mut Self::Context) -> Self::Result {
        self.cancel_room_spawn(&msg.room_id, ctx);
        if let Some(room) = self.rooms.get_mut(&msg.room_id) {
            room.start();
            self.set_choose_timeout(&msg.room_id, ctx);
        }
    }
}

impl Handler<GameStartLaterMsg> for GameActor {
    type Result = ();

    fn handle(&mut self, msg: GameStartLaterMsg, ctx: &mut Self::Context) -> Self::Result {
        let handle = ctx.notify_later(GameStartMsg {
            room_id: msg.room_id.clone(),
        }, msg.duration);
        self.room_spawn_handle.insert(msg.room_id, handle);
    }
}

impl Handler<ChooseTimeoutMsg> for GameActor {
    type Result = ();

    fn handle(&mut self, msg: ChooseTimeoutMsg, ctx: &mut Self::Context) -> Self::Result {
        if let Some(room) = self.rooms.get_mut(&msg.room_id) {
            info!("user select timeout: {}", room.id);
            if room.choose_timeout() {
                self.set_choose_timeout(&msg.room_id, ctx);
            }
        }
    }
}

/// 取消游戏开始（倒计时时有人取消的情况）
impl Handler<GameStartCancelMsg> for GameActor {
    type Result = ();

    fn handle(&mut self, msg: GameStartCancelMsg, ctx: &mut Self::Context) -> Self::Result {
        if let Some(handle) = self.room_spawn_handle.remove(&msg.room_id) {
            info!("stop auto start {}", msg.room_id);
            ctx.cancel_future(handle);
        }
    }
}

impl Handler<ChooseWordMsg> for GameActor {
    type Result = bool;

    fn handle(&mut self, msg: ChooseWordMsg, ctx: &mut Self::Context) -> Self::Result {
        if let Some(room) = self.get_player_room(&msg.user_id) {
            let result = room.pick_a_word(&msg.user_id, msg.word);
            if result {
                ctx.notify(SetDrawTimeoutMsg { room_id: room.id.clone() })
            }
            return result
        }
        false
    }
}

impl Handler<SetDrawTimeoutMsg> for GameActor {
    type Result = ();

    fn handle(&mut self, msg: SetDrawTimeoutMsg, ctx: &mut Self::Context) -> Self::Result {
        self.cancel_room_spawn(&msg.room_id, ctx);
        let handle = ctx.notify_later(DrawEndMsg{ 
            room_id: msg.room_id.clone() 
        }, Duration::from_secs(DRAW_TIME as u64));
        self.room_spawn_handle.insert(msg.room_id, handle);
    }
}

impl Handler<DrawMsg> for GameActor {
    type Result = bool;

    fn handle(&mut self, msg: DrawMsg, _: &mut Self::Context) -> Self::Result {
        if let Some(room) = self.get_player_room(&msg.user_id) {
            return room.draw(&msg.user_id, msg.raw_data, msg.timestamp);
        }
        false
    }
}

impl Handler<DrawEndMsg> for GameActor {
    type Result = ();

    fn handle(&mut self, msg: DrawEndMsg, ctx: &mut Self::Context) -> Self::Result {
        if let Some(room) = self.rooms.get_mut(&msg.room_id) {
            room.draw_end();
            let handle = ctx.notify_later(NextPlayerDrawMsg {
                room_id: msg.room_id.clone()
            }, Duration::from_secs(RESULT_TIME as u64));
            self.room_spawn_handle.insert(msg.room_id, handle);
        }
    }
}

impl Handler<NextPlayerDrawMsg> for GameActor {
    type Result = ();

    fn handle(&mut self, msg: NextPlayerDrawMsg, ctx: &mut Self::Context) -> Self::Result {
        if let Some(room) = self.rooms.get_mut(&msg.room_id) {
            if room.next_player_draw() {
                self.set_choose_timeout(&msg.room_id, ctx);
            }
        }
    }
}

impl Handler<DrawClearMsg> for GameActor {
    type Result = bool;

    fn handle(&mut self, msg: DrawClearMsg, _: &mut Self::Context) -> Self::Result {
        if let Some(room) = self.get_player_room(&msg.user_id) {
            return room.clear_draw(&msg.user_id);
        } else {
            false
        }
    }
}

impl Handler<DrawUndoMsg> for GameActor {
    type Result = bool;

    fn handle(&mut self, msg: DrawUndoMsg, _: &mut Self::Context) -> Self::Result {
        if let Some(room) = self.get_player_room(&msg.user_id) {
            return room.undo_draw(&msg.user_id)
        }
        false
    }
}

impl Handler<DrawChangeBackgoundMsg> for GameActor {
    type Result = ();

    fn handle(&mut self, msg: DrawChangeBackgoundMsg, _: &mut Self::Context) -> Self::Result {
        if let Some(room) = self.get_player_room(&msg.user_id) {
            room.set_background(&msg.user_id, &msg.color);
        }
    }
}