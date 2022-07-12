use actix_cors::Cors;
use actix_web::{App, HttpResponse, HttpServer, Responder, get, web::{self, Data}, post, client::Client, header::CONTENT_TYPE};
use actix::{Actor, Addr};
use log::info;
use serde_json::json;
use crate::{actor::GameActor, message::*, wrap::{WrapMailboxErrorResponse, WrapMailboxErrorResult, WarpSuccResponse}, word::WordEngine};

pub async fn run() -> std::io::Result<()> {
    let (addr, port) = ("0.0.0.0", "8000");

    let client: Client = Client::builder().header(CONTENT_TYPE, "application/json").finish();
    
    HttpServer::new(move || {
        let cors = Cors::default()
            .allow_any_origin();

        let word_engine = WordEngine::configure("words.txt");

        App::new()
            .wrap(cors)
            .app_data(Data::new(ADDR.clone()))
            .app_data(Data::new(word_engine))
            .app_data(Data::new(client))
            .default_service(
                web::route().to(|| HttpResponse::NotFound().finish())
            )
            .service(
                web::scope("/v1")
                .service(create_room) // 创建房间
                .service(join_room) // 加入房间
                .service(get_all_room) // 获取所有房间
                .service(init) // 初始化
                .service(leave_room) // 离开房间
                .service(client_poll) // 客户端轮训
                .service(get_room_info) // 获取房间信息
                .service(set_ready) // 房间玩家准备
                .service(get_up) // 站起围观
                .service(sit_on) // 坐下
                .service(chat) // 聊天
                .service(get_random_words) // 获取随机词库
                .service(choose_a_word) // 选词
                .service(draw) // 画图
                .service(undo) // 撤销
                .service(clear) // 清空
                .service(set_color) // 设置颜色
                .service(random_api) // 随机进房
                
            )
    })
        .bind(format!("{}:{}", addr, port))
        .expect(format!("Can't bind to port {}", port).as_str())
        .run()
        .await
}

lazy_static::lazy_static!{
    pub static ref ADDR: Addr<GameActor> = GameActor::default().start();
}

/// 创建房间
#[get("/roomCreate")]
async fn create_room() -> impl Responder {
    ADDR.send(CreateRoomMsg{})
        .await
        .response(|id| {
            info!("roomCreate: {}", id);
            json!({
                "id": id,
            })
        })
}

/// 玩家加入房间
#[post("/roomJoin")]
async fn join_room(data: web::Json<JoinRoomMsg>) -> impl Responder {
    info!("roomJoin: {:?}", data);
    ADDR.send(data.into_inner())
        .await
        .to_succ_response()
}

#[get("/init")]
async fn init(data: web::Query<InitMsg>) -> impl Responder {
    ADDR.send(data.into_inner())
        .await
        .to_response()
}

#[get("/info/{id}")]
async fn get_room_info(path: web::Path<String>) -> impl Responder {
    let room_id = path.0;
    ADDR.send(GetRoomInfoMsg{ id: room_id })
        .await
        .to_response()
}


#[get("/ready")]
async fn set_ready(info: web::Query<RoomReadyMsg>) -> impl Responder {
    info!("ready: {:?}", info);
    ADDR.send(info.into_inner())
        .await
        .response(|_| {
            json!({
                "succ": true
            })
        })
}

#[get("/getUp")]
async fn get_up(info: web::Query<RoomGetUpMsg>) -> impl Responder {
    ADDR.send(info.into_inner())
        .await
        .to_succ_response()
}


#[get("/sitOn")]
async fn sit_on(info: web::Query<RoomSitOnMsg>) -> impl Responder {
    ADDR.send(info.into_inner())
        .await
        .to_succ_response()
}

#[get("/poll")]
async fn client_poll(info: web::Query<PollingMsg>) -> impl Responder {
    ADDR.send(info.into_inner())
        .await
        .to_response()
}

#[get("/chat")]
async fn chat(info: web::Query<ChatMsg>) -> impl Responder {
    ADDR.send(info.into_inner())
        .await
        .to_succ_response()
}

#[get("/all")]
async fn get_all_room() -> impl Responder {
    ADDR.send(GetAllRoomMsg{} )
        .await
        .to_response()
}

#[get("/leave")]
async fn leave_room(info: web::Query<LeaveRoomMsg>) -> impl Responder {
    ADDR.send(info.into_inner())    
        .await
        .response(|_| {
            json!({
                "succ": true
            })
        })
}

#[get("/random")]
async fn get_random_words(word: web::Data<WordEngine>) -> impl Responder {
    HttpResponse::Ok().json(word.random(6))
}

#[get("/choose")]
async fn choose_a_word(info: web::Query<ChooseWordMsg>) -> impl Responder {
    ADDR.send(info.into_inner())
        .await
        .to_succ_response()

}

#[get("/draw")]
async fn draw(info: web::Query<DrawMsg>) -> impl Responder {
    ADDR.send(info.into_inner())
        .await
        .to_response()
}

#[get("/undo")]
async fn undo(info: web::Query<DrawUndoMsg>) -> impl Responder {
    ADDR.send(info.into_inner())
        .await
        .to_succ_response()
}

#[get("/clear")]
async fn clear(info: web::Query<DrawClearMsg>) -> impl Responder {
    ADDR.send(info.into_inner())
        .await
        .to_succ_response()
}

#[get("/setColor")]
async fn set_color(info: web::Query<DrawChangeBackgoundMsg>) -> impl Responder {
    ADDR.send(info.into_inner())
        .await
        .response(|_| true)
}

#[get("/findJoinableRoom")]
/// 查找能加入的房间，没有则返回失败
async fn random_api() -> impl Responder {
    ADDR.send(FindJoinableRoomMsg{})
        .await
        .to_response()
}
