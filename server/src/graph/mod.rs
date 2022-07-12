use std::{collections::HashMap, iter::Once};

use actix_web::{client::Client, http::{HeaderMap, HeaderValue, header::{CONTENT_TYPE}}};
use serde::{Deserialize, Serialize};

pub(crate) async fn send_graphql<S: Into<String>>(client: &Client, query: S, variables: Option<S>) {

  // let mut map: HashMap<&str, String> = HashMap::new();
  // map.insert("query", query.into());
  // map.insert("variables", variables.into());
  let data = GraphqlRequest {
    query: query.into(),
    variables: variables.map_or(None, |s| Some(s.into())),
  };

  let resp = client.post("https://hare.dev.blueandhack.com/graphql")
    .send_json(&data).await;
}

#[derive(Serialize)]
struct GraphqlRequest {
  pub query: String,
  pub variables: Option<String>,
}