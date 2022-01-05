use log::info;

/// 初始化打印日志
pub fn init_logger () {
	use chrono::Local;
	use std::io::Write;

	let env = env_logger::Env::default()
		.filter_or(env_logger::DEFAULT_FILTER_ENV, "info");
	// 设置打印日志的格式
	env_logger::Builder::from_env(env)
		.format(|buf, record|{
			writeln!(
				buf,
				"{} {} [{}] {}",
				Local::now().format("%Y-%m-%d %H:%m:%S"),
				record.level(),
				record.module_path().unwrap_or("<unnamed>"),
				&record.args()
			) 
		})
		.init();
	info!("env_logger initialized.");
}