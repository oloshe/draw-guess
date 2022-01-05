use std::time::Duration;

use actix::Message;
use serde::Deserialize;
use serde_json::Value;

use crate::player::Player;

#[derive(Debug, Message)]
#[rtype(result = "String")]
pub struct CreateRoomMsg {}

#[derive(Debug, Message, Deserialize)]
#[rtype(result = "bool")]
pub struct JoinRoomMsg {
    pub player: Player,
    #[serde(rename = "roomId")]
    pub room_id: String,
}

#[derive(Debug, Message, Deserialize)]
#[rtype(result = "Option<Value>")]
pub struct InitMsg {
    #[serde(rename = "userId")]
    pub user_id: String,
}

#[derive(Debug, Message)]
#[rtype(result = "Option<Value>")]
pub struct GetRoomInfoMsg {
    pub id: String
}

#[derive(Debug, Message, Deserialize)]
#[rtype(result = "()")]
pub struct RoomReadyMsg {
    #[serde(rename = "userId")]
    pub user_id: String,
    pub ready: bool,
}

/// 从座位到观战列表
#[derive(Debug, Message, Deserialize)]
#[rtype(result = "bool")]
pub struct RoomGetUpMsg {
    #[serde(rename = "userId")]
    pub user_id: String,
}

/// 从观战列表到座位
#[derive(Debug, Message, Deserialize)]
#[rtype(result = "bool")]
pub struct RoomSitOnMsg {
    #[serde(rename = "userId")]
    pub user_id: String,
    pub pos: u8
}

/// 轮训数据
#[derive(Debug, Message, Deserialize)]
#[rtype(result = "Option<Value>")]
pub struct PollingMsg {
    #[serde(rename = "userId")]
    pub user_id: String,
    #[serde(rename = "roomId")]
    pub room_id: String,
    #[serde(rename = "t")]
    pub timestamp: i64,
    #[serde(rename = "dl")]
    pub draw_index: usize,
}

/// 轮训数据
#[derive(Debug, Message, Deserialize)]
#[rtype(result = "bool")]
pub struct ChatMsg {
    #[serde(rename = "userId")]
    pub user_id: String,
    pub content: String,
}

/// 玩家离开房间
#[derive(Debug, Message, Deserialize)]
#[rtype(result = "()")]
pub struct LeaveRoomMsg {
    #[serde(rename = "userId")]
    pub user_id: String,
}

/// 玩家离开房间
#[derive(Debug, Message)]
#[rtype(result = "Option<Value>")]
pub struct GetAllRoomMsg {}

#[derive(Debug, Message)]
#[rtype(result = "()")]
pub struct GameStartMsg {
    pub room_id: String
}

#[derive(Debug, Message)]
#[rtype(result = "()")]
pub struct GameStartLaterMsg {
    pub room_id: String,
    pub duration: Duration,
}

#[derive(Debug, Message)]
#[rtype(result = "()")]
pub struct GameStartCancelMsg {
    pub room_id: String,
}

/// 选词
#[derive(Debug, Message, Deserialize)]
#[rtype(result = "bool")]
pub struct ChooseWordMsg {
    #[serde(rename = "userId")]
    pub user_id: String,
    pub word: String,
}

/// 画图
#[derive(Debug, Message, Deserialize)]
#[rtype(result = "bool")]
#[serde(rename_all = "camelCase")]
pub struct DrawMsg {
    pub user_id: String,
    pub raw_data: String,
    pub timestamp: i64,
}

/// 清空画布
#[derive(Debug, Message, Deserialize)]
#[rtype(result = "bool")]
pub struct DrawClearMsg {
    #[serde(rename = "userId")]
    pub user_id: String
}

/// 笔画撤销
#[derive(Debug, Message, Deserialize)]
#[rtype(result = "bool")]
pub struct DrawUndoMsg {
    #[serde(rename = "userId")]
    pub user_id: String
}


/// 用户选择超时
#[derive(Debug, Message)]
#[rtype(result = "()")]
pub struct ChooseTimeoutMsg {
    pub room_id: String
}

/// 设置绘制时长
#[derive(Debug, Message)]
#[rtype(result = "()")]
pub struct SetDrawTimeoutMsg {
    pub room_id: String,
}

/// 绘画结束消息
#[derive(Debug, Message)]
#[rtype(result = "()")]
pub struct DrawEndMsg {
    pub room_id: String
}

/// 下一玩家绘制
#[derive(Debug, Message)]
#[rtype(result = "()")]
pub struct NextPlayerDrawMsg {
    pub room_id: String
}


/// 修改画布颜色
#[derive(Debug, Message, Deserialize)]
#[rtype(result = "()")]
pub struct DrawChangeBackgoundMsg {
    #[serde(rename = "userId")]
    pub user_id: String,
    pub color: String,
}