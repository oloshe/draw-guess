use std::vec;

use serde::{Serialize, Deserialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct DrawData {
    inner: Vec<DrawDataUnit>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct DrawDataUnit {
    pub data: String,
    pub timestamp: i64,
}

impl DrawData {
    pub fn draw(&mut self, data: String, timestamp: i64) {
        let new_data = DrawDataUnit { data, timestamp };
        self.inner.push(new_data);
    }
    pub fn slice(&self, index: usize) -> &[DrawDataUnit] {
        if let Some(len) = self.inner.len().checked_sub(index) {
            let i = self.len() - len;
            &self.inner[i..]
        } else {
            &[]
        }
    }
    pub fn clear(&mut self) {
        self.inner.drain(..);
    }
    pub fn undo(&mut self) {
        self.inner.pop();
    }
    pub fn len(&self) -> usize {
        self.inner.len()
    }
}

impl Default for DrawData {
    fn default() -> Self {
        Self {
            inner: vec![],
        }
    }
}

#[test]
fn test_slice() {
    // 0, 2  => 2
    // 2, 2 => 0
    // 3, 2 => 0
    // 2, 4 => 2
    let mut dd = DrawData::default();
    dd.draw("test".into(), 1);
    dd.draw("test".into(), 1);
    assert_eq!(dd.slice(0).len(), 2);
    assert_eq!(dd.slice(2).len(), 0);
    assert_eq!(dd.slice(3).len(), 0);
    dd.draw("test".into(), 1);
    dd.draw("test".into(), 1);
    assert_eq!(dd.slice(2).len(), 2);
}

