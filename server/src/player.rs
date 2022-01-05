use serde::{Deserialize, Serialize};
use serde_json::Value;

use crate::wrap::WrapToValue;

#[derive(Debug, Clone, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Player {
    pub user_id: String,
    pub avatar_url: String,
    pub nick_name: String,
}


impl WrapToValue for Player {
    fn to_value(&self) -> Value {
        serde_json::to_value(self).unwrap_or_default()
    }
}