import axios from "axios";

export const http = axios.create({
    baseURL: "http://localhost:8000/v1/",
})

// @ts-ignore
window.http = http