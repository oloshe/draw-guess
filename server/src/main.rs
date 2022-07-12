mod app;
mod actor;
mod room;
mod player;
mod message;
mod wrap;
mod word;
mod draw_data;
mod log;
mod graph;

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    log::init_logger();
    app::run().await
}
