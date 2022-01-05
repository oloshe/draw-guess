FROM rust:1.56 AS builder

RUN USER=root cargo new --bin server
WORKDIR /server
COPY . .

RUN cargo build --release

FROM debian:buster-slim

ARG APP=/usr/src/server

EXPOSE 8000

COPY --from=builder /server/target/release/server ${APP}/server
COPY --from=builder /server/words.txt ${APP}/words.txt

RUN chown -R $APP_USER:$APP_USER ${APP}

USER $APP_USER
WORKDIR ${APP}

CMD ["./server"]