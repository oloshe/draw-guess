use actix::{MailboxError};
use actix_web::HttpResponse;
use serde::Serialize;
use serde_json::{Value, json};

pub trait WrapMailboxErrorResult<T> {
    fn response<F, S: Serialize>(self, f: F) -> HttpResponse
    where
        F: FnOnce(T) -> S;
}

pub trait WrapMailboxErrorResponse<T> {
    fn to_response(self) -> HttpResponse;
}

pub trait WarpSuccResponse {
    fn to_succ_response(self) -> HttpResponse;
}

impl<T> WrapMailboxErrorResult<T> for Result<T, MailboxError> {
    fn response<F, S: Serialize>(self, f: F) -> HttpResponse
    where
        F: FnOnce(T) -> S {
        match self {
            Ok(val) => {
                HttpResponse::Ok().json(f(val))
            },
            Err(e) => {
                eprintln!("Encounter MailboxError: {}", e);
                HttpResponse::InternalServerError().finish()
            }
        }
    }
}

impl<T:Serialize> WrapMailboxErrorResponse<T> for Result<T, MailboxError> {
    fn to_response(self) -> HttpResponse {
        self.response(|a| a)
    }
}

impl WarpSuccResponse for Result<bool, MailboxError> {
    fn to_succ_response(self) -> HttpResponse {
        self.response(|succ| json!({ "succ": succ }))
    }
}

pub trait WrapToValue {
    fn to_value(&self) -> Value;
}

pub trait PollingProvider {
    fn snapshot(&self, user_id: &String, timestamp: i64, draw_length: usize) -> Value;
}
