use std::{collections::{HashMap, HashSet}, ops::{AddAssign}};
use serde_json::{Value, json};
use uuid::Uuid;
use crate::{player::Player, wrap::{PollingProvider, WrapToValue}, draw_data::DrawData};
use serde::{Serialize, Deserialize};
use unicode_segmentation::UnicodeSegmentation;

static MAX_CHAT_HISTORY: usize = 20;
/// 最大人数
pub const MAX_PEOPLE: usize = 6;
/// 最小开局人数
pub const MIN_START_PEOPLE: u8 = 3;

/// 选择阶段的最大时间
pub const CHOOSE_TIME: u8 = 10;
/// 绘制时间
pub const DRAW_TIME: u8 = 20;
/// 回合结束的时间
pub const RESULT_TIME: u8 = 5;

static DEFAULT_COLOR: &'static str = "#ffffff";

/// 房间数据
#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RoomData {
    /// 房间id
    #[serde(skip_serializing)]
    pub id: String,
    /// 房间名字
    #[serde(skip_serializing)]
    pub name: String,
    /// 房间玩家 key: user_id
    pub players: HashMap<String, Player>,
    /// 座位, id列表， None 表示没人
    pub seat: [Option<String>; MAX_PEOPLE],
    /// 准备状态 key: 玩家id， value：是否准备
    pub ready_state: HashMap<String, bool>,
    /// 观战列表
    pub observer: HashSet<String>,
    /// 聊天历史 最多保存 [`MAX_CHAT_HISTORY`] 条
    pub chat_history: Vec<ChatItem>,
    /// 游戏阶段
    pub stage: GameStage,
    /// 当前回合玩家座位
    #[serde(skip_serializing)]
    pub cur_seat: Option<usize>,
    /// 当前回合玩家id
    pub cur_id: Option<String>,
    /// 下一回合的时间戳
    pub next_timestamp: Option<i64>,
    /// 当前词汇
    pub word: String,
    /// 绘制数据
    pub draw_data: DrawData,
    /// 画布背景色 默认白色
    pub background: String,
    /// 每一回合的成绩表
    pub round_score_map: HashMap<String, u16>,
    /// 结算数据
    pub settlement: HashMap<String, u16>,
}

impl RoomData {
    pub fn new() -> Self {
        Self {
            id: Uuid::new_v4().to_string(),
            name: "默认房间".to_owned(),
            players: HashMap::new(),
            seat: Default::default(),
            observer: HashSet::new(),
            ready_state: HashMap::new(),
            chat_history: vec![],
            stage: GameStage::Ready,
            cur_seat: None,
            cur_id: None,
            next_timestamp: None,
            word: Default::default(),
            draw_data: Default::default(),
            background: DEFAULT_COLOR.to_string(),
            round_score_map: Default::default(),
            settlement: Default::default(),
        }
    }
    pub fn join_player(&mut self, player: &Player) {
        let id = player.user_id.clone();
        self.players.insert(id.clone(), player.clone());
        if let Some(val) = self.seat.iter_mut().find(|val| val.is_none()) {
            *val = Some(id.clone())
        } else {
            self.observer.insert(id);
        }
    }
    pub fn ready(&mut self, user_id: &String) {
        self.ready_state.entry(user_id.clone())
            .and_modify(|ready| *ready = false)
            .or_insert(true);
    }
    pub fn cacnel_ready(&mut self, user_id: &String) {
        self.ready_state.remove(user_id);
        // 取消倒计时
        if let Some(num) = &mut self.next_timestamp {
            if *num != 0 {
                *num = 0
            }
        }
    }
    pub fn if_all_ready(&mut self) -> IfAllReadyResult {
        let mut people_count: u8 = 0;
        let all_ready = self.seat.iter().all(|s| {
            if let Some(id) = s {
                people_count += 1;
                self.ready_state.get(id).is_some() // 准备了
            } else {
                true
            }
        });
        if all_ready {
            // 6人都准备了，直接开始
            if people_count as usize >= MAX_PEOPLE {
                IfAllReadyResult::Start
            }
            // 不满6人但超过3人都准备了，倒计时5秒开始
            else if people_count >= MIN_START_PEOPLE {
                self.next_timestamp = Some(next_time(5));
                IfAllReadyResult::AutoStart(5)
            }
            else {
                IfAllReadyResult::None
            }
        } else {   
            IfAllReadyResult::None
        }
    }

    pub fn start(&mut self) {
        self.reset_ready();
        self.next_player_draw();
    }
    
    /// 轮到下一位玩家
    pub fn next_player(&mut self) -> bool {
        for (index, id) in self.seat.iter().enumerate() {
            if id.is_some() {
                match self.cur_seat {
                    Some(cur_pos) if cur_pos < index =>  {
                        self.cur_seat = Some(index);
                        self.cur_id = Some(id.as_ref().unwrap().clone());
                        return true
                    },
                    None => {
                        self.cur_seat = Some(index);
                        self.cur_id = Some(id.as_ref().unwrap().clone());
                        return true;
                    }
                    _ => (),
                }
            }
        }
        // 下一位玩家没有了 游戏结束
        self.cur_seat = None;
        self.cur_id = None;
        self.stage = GameStage::Ready;
        self.background = DEFAULT_COLOR.to_string();
        self.settlement.clear();
        self.next_timestamp = Some(0);
        false
    }
    /// 选择超时
    pub fn choose_timeout(&mut self) -> bool {
        if self.stage == GameStage::Choose {
            if !self.next_player() {
                false
            } else {
                self.set_next_choose_time();
                true
            }
        } else {
            false
        }
    }
    pub fn reset_ready(&mut self) {
        self.ready_state.clear()
    }
    /// 把玩家移动到观战列表
    pub fn move_to_observer(&mut self, target_user_id: &String) {
        let that_seat = self.seat.iter_mut()
            .find(|s| s.as_deref() == Some(target_user_id.as_ref()));
        if let Some(the_seat) = that_seat {
            *the_seat = None;
            self.observer.insert(target_user_id.clone());
            self.ready_state.remove(target_user_id);
            self.cacnel_ready(target_user_id);
        }
    }
    /// 绘画结束
    pub fn draw_end(&mut self) {
        if self.stage == GameStage::Drawing {
            self.stage = GameStage::Result;
            self.score_to_settlement();
        }
    }
    /// 轮到下一位玩家绘制
    pub fn next_player_draw(&mut self) -> bool {
        if self.stage == GameStage::Result || self.stage == GameStage::Ready {
            self.draw_data.clear();
            self.next_player();
            if self.cur_seat.is_none() {
                false
            } else {
                self.stage = GameStage::Choose;
                self.background = DEFAULT_COLOR.to_string();
                self.set_next_choose_time();
                true
            }
        } else {
            false
        }
    }
    /// 临时成绩算入总成绩
    fn score_to_settlement(&mut self) {
        let mut count = 0;
        // 把临时分数算入结算数据 && 统计人数
        for (id, score) in self.round_score_map.iter() {
            self.settlement.entry(id.clone())
                .or_default()
                .add_assign(score);
            count += 1;
        }
        if let Some(cur_id) = &self.cur_id {
            let cur_id = cur_id.clone();
            let mut add_score = 0;
            let play_user_count = self.seat.iter().filter(|&a| a.is_some()).count();
            let player = &self.players.get(&cur_id);
            let nick_name: Option<String> = if let Some(player) = player {
                Some(player.nick_name.clone())
            } else {
                None
            };
            let answer_str = format!("答案是【{}】，", self.word);
            if let Some(nick_name) = nick_name {
                if count == play_user_count - 1 {
                    self.add_system_chat(format!("{}本轮所有玩家答对，玩家{}不得分", answer_str, nick_name))
                } else if count == play_user_count - 2 {
                    add_score = 6;
                    self.add_system_chat(format!("{}本轮共{}名玩家答对，玩家{}得{}分", answer_str, &count, nick_name, add_score));
                } else if count > 0 {
                    add_score = 3;
                    self.add_system_chat(format!("{}本轮共{}名玩家答对，玩家{}得{}分", answer_str, &count, nick_name, add_score));
                } else {
                    self.add_system_chat(format!("{}本轮无人答对，玩家{}不得分", answer_str, nick_name));
                }
            } else {
                self.add_system_chat(format!("{}本轮共{}名玩家答对，玩家因已离开不得分", answer_str, &count));
            }
            if add_score != 0 {
                self.settlement.entry(cur_id.clone()).or_default().add_assign(add_score);
            }
        }
        self.round_score_map.clear();
    }
    fn set_next_choose_time(&mut self) {
        self.next_timestamp = Some(next_time(CHOOSE_TIME as i64));
    }
    /// 从观战列表点击座位坐下
    pub fn sit_on(&mut self, target_user_id: &String, pos: usize) -> bool {
        if pos >= MAX_PEOPLE { return false } // 越界
        if self.seat[pos].is_some() { return false } // 位置已经有人
        let is_ob = self.observer.remove(target_user_id); // 是否在观战列表中
        if is_ob {
            self.seat[pos] = Some(target_user_id.clone());
        }
        is_ob
    }
    pub fn add_chat(&mut self, user_id: String, content: String) {
        let mut content = content;
        let result = self.check_answer(&user_id, &mut content);
        let item = ChatItem { 
            content,
            user_id: user_id.clone(),
            timestamp: chrono::Local::now().timestamp_millis(),
        };
        self.chat_history.push(item);
        if let Some((no, add_score)) = result {
            self.chat_history.push(ChatItem {
                content: format!("{}第{}个猜对了, 得{}分",  self.players.get(&user_id).unwrap().nick_name, no, add_score),
                user_id: "0".to_string(),
                timestamp: chrono::Local::now().timestamp_millis(),
            });
            
        }
        if self.chat_history.len() > MAX_CHAT_HISTORY {
            self.chat_history.drain(..self.chat_history.len() - MAX_CHAT_HISTORY);
        }
    }
    fn add_system_chat(&mut self, content: String) {
        self.chat_history.push(ChatItem {
            content,
            user_id: "0".to_string(),
            timestamp: chrono::Local::now().timestamp_millis(),
        });
    }
    fn check_answer(&mut self, user_id: &String, content: &mut String) -> Option<(usize, u16)> {
        if self.stage == GameStage::Drawing {
            if self.word.eq(content) { // 答对了
                *content = "*".repeat(content.graphemes(true).count());
                if !self.is_current_player(user_id) { // 画图人说话不能加分
                    if self.round_score_map.get(user_id).is_none() {
                        let no = self.round_score_map.len() + 1;
                        let add_score = match no {
                            1 => 6, // 第一个回答，得6分
                            2 => 5, // 第二个回答，得5分
                            _ => 3, // 其他，得3分
                        };
                        self.round_score_map.insert(user_id.clone(), add_score);
                        return Some((no, add_score));
                    }
                }
            } else { // 没答对
                // 把含有答案的字符串替换了
                let new_content = content.replace(self.word.as_str(), "*".repeat(self.word.len()).as_str());
                *content = new_content;
            }
        }
        None
    }
    /// 玩家退出房间
    pub fn player_leave(&mut self, player_id: &String) {
        let item = self.seat.iter_mut().find(|a| a.as_deref() == Some(player_id.as_ref()));
        if let Some(pos) = item {
            *pos = None;
        } else {
            self.observer.remove(player_id);
        }
        self.players.remove(player_id);
    }
    /// 选词
    pub fn pick_a_word(&mut self, user_id: &String, word: String) -> bool {
        if word.len() == 0{
            return false
        }
        if self.stage == GameStage::Choose && self.is_current_player(user_id) {
            self.word = word;
            self.stage = GameStage::Drawing;
            self.next_timestamp = Some(next_time(DRAW_TIME as i64));
            true
        } else {
            false
        }
    }
    pub fn draw(&mut self, user_id: &String, data: String, timestamp: i64) -> bool {
        match self.stage {
            GameStage::Drawing => {
                if self.is_current_player(user_id) {
                    self.draw_data.draw(data, timestamp);
                    return true
                }
            },
            _ => ()
        }
        false
    }
    pub fn clear_draw(&mut self, user_id: &String) -> bool {
        match self.stage {
            GameStage::Drawing => {
                if self.is_current_player(user_id) {
                    self.draw_data.clear();
                    return true
                }
            },
            _ => ()
        }
        false
    }
    pub fn undo_draw(&mut self, user_id: &String) -> bool {
        match self.stage {
            GameStage::Drawing => {
                if self.is_current_player(user_id) {
                    self.draw_data.undo();
                    return true
                }
            },
            _ => ()
        }
        false
    }
    pub fn is_current_player(&self, user_id: &String) -> bool{
        self.cur_id.as_deref() == Some(user_id.as_ref())
    }
    /// 设置画布背景颜色
    pub fn set_background(&mut self, user_id: &String, color: &String) {
        if self.is_current_player(user_id) {
            self.background = color.to_owned();
        }
    }
}

fn next_time(sec: i64) -> i64 {
    chrono::Local::now().timestamp_millis() + sec * 1000
}

#[derive(Debug, Serialize)]
pub struct RoomMeta {
    pub id: String,
    pub name: String,
}

impl RoomMeta {
    pub fn from_room_data(target: &RoomData) -> Self {
        Self {
            id: target.id.clone(),
            name: target.name.clone()
        }
    }
}

impl WrapToValue for Option<&RoomData> {
    fn to_value(&self) -> Value {
        let a = self;
        if let Some(room) = a {
            serde_json::to_value(room).unwrap_or_default()
        } else {
            Default::default()
        }
    }
}

impl WrapToValue for RoomData {
    fn to_value(&self) -> Value {
        serde_json::to_value(self).unwrap_or_default()
    }
}

impl PollingProvider for Option<&RoomData> {
    fn snapshot(&self, user_id: &String, timestamp: i64, draw_index: usize) -> Value {
        // serde_json::to_value(self).unwrap_or_default()
        if let Some(room) = self {
            let chat_history = if let Some(index) = room.chat_history.iter()
                .position(|chat_item| chat_item.timestamp > timestamp) {
                json!(room.chat_history[index..])
            } else {
                json!([])
            };

            let mut value = json!({
                "seat": room.seat,
                "observer": room.observer,
                "stage": room.stage,
                "curId": room.cur_id,
                "nextTimestamp": room.next_timestamp,
                "chatHistory": chat_history,
                "drawLength": room.draw_data.len(),
                "scoreMap": room.round_score_map,
                "settlement": room.settlement,
            });

            if let Value::Object(ref mut map) = value {
                match room.stage {
                    GameStage::Ready => {
                        map.insert("players".to_string(), json!(room.players));
                        map.insert("readyState".to_string(), json!(room.ready_state));
                    },
                    GameStage::Drawing => {
                        map.insert("drawList".to_string(), json!(room.draw_data.slice(draw_index)));
                        map.insert("background".to_string(), json!(room.background));
                        if Some(user_id.as_ref()) == room.cur_id.as_deref() {
                            map.insert("word".to_string(), json!(room.word.as_bytes()));
                        }
                    },
                    GameStage::Result => {
                        map.insert("word".to_string(), json!(room.word.as_bytes()));
                        map.insert("background".to_string(), json!(room.background));
                    },
                    _ => (),
                }
            }

            value
        } else {
            json!(null)
        }
    }
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ChatItem {
    pub content: String,
    #[serde(rename = "userId")]
    pub user_id: String,
    pub timestamp: i64,
}


#[derive(Debug, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub enum GameStage {
    Ready,
    Choose,
    Drawing,
    Result,
}

/// 1. 座位上的玩家
/// 2： 是否所有人准备 且 大于三人
pub enum IfAllReadyResult {
    None,
    Start,
    AutoStart(u8),
}

#[cfg(test)]
mod test {
    use crate::player::Player;

    use super::RoomData;

    #[test]
    fn room_next() {
        let mut room = RoomData::new();
        
        room.join_player(&Player {
            avatar_url: "1".to_string(),
            user_id: "1".to_string(),
            nick_name: "1".to_string(),
        });
        room.join_player(&Player {
            avatar_url: "2".to_string(),
            user_id: "2".to_string(),
            nick_name: "2".to_string(),
        });
        room.join_player(&Player {
            avatar_url: "3".to_string(),
            user_id: "3".to_string(),
            nick_name: "3".to_string(),
        });
        room.start();
        assert_eq!(room.cur_id, Some("1".to_string()));
        assert_eq!(room.cur_seat, Some(0));
        room.next_player();
        assert_eq!(room.cur_id, Some("2".to_string()));
        room.next_player();
        assert_eq!(room.cur_id, Some("3".to_string()));
        room.next_player();
        assert_eq!(room.cur_id, None);

        room.word = "大狮子".to_string();
        room.add_chat("1".to_string(), "大狮子".to_string());
        println!("{:?}", room.chat_history);

    }
}