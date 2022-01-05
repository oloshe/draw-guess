use std::{fs::File, io::Read};

use rand::prelude::SliceRandom;

#[derive(Debug)]
pub struct WordEngine {
    pub words: Vec<String>,
}

impl WordEngine {
    pub fn configure(filename: &str) -> Self {
        let mut file = File::open(filename).expect("打开词库文件失败");
        let mut buffer = String::new();
        file.read_to_string(&mut buffer).expect("读取词库文件失败");
        let vec = buffer.split("\n")
            .filter(|a| a.len() > 0)
            .map(|a| a.trim().to_string())
            .collect::<Vec<String>>();
        Self {
            words: vec,
        }
    }
    pub fn random(&self, amount: usize) -> Vec<&String> {
        let vec = self.words
            .choose_multiple(&mut rand::thread_rng(), amount)
            .collect::<Vec<_>>();
        vec
    }
}