function getQueryString(name: string) {
    var reg = new RegExp("(^|&)" + name + "=([^&]*)(&|$)", "i");
    var reg_rewrite = new RegExp("(^|/)" + name + "/([^/]*)(/|$)", "i");
    var r = window.location.search.substr(1).match(reg);
    var q = window.location.pathname.substr(1).match(reg_rewrite);
    if (r !== null) {
        return unescape(r[2]);
    } else if (q !== null) {
        return unescape(q[2]);
    } else {
        return null;
    }
}

/**
 * 获取距离目标时间戳还有多少秒
 * @param nextTimestamp 
 * @returns 
 */
function getRemainSecs(nextTimestamp: number) {
    return Math.ceil((nextTimestamp - Date.now()) / 1000)
}

function arrayToString(data: number[]) {
    let dataString = "", len = data.length;
    for (let i = 0; i < len; i++) {
        dataString += String.fromCharCode(data[i]);
    }
    return dataString
}

function stringToArray(data: string) {
    let result: number[] = [], len = data.length
    for (let i = 0; i < len; i++) {
        result.push(data.charCodeAt(i));
    }
    return result
}

async function arrayPointAccess(
    data: number[], 
    first: (x: number, y: number) => void,
    fn: (x: number, y: number) => void
) {
    let len = data.length;
    for (let i = 0; i < len; i += 2) {
        if (i === 0) {
            first(data[i], data[i + 1])
        } else {
            fn(data[i], data[i + 1])
        }
    }
}

function u8arrToString(arr: number[]) {
    let u8arr = new Uint8Array(arr);
    let str = new TextDecoder().decode(u8arr)
    return str
}

async function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms))
}

export const utils = {
    getQueryString,
    getRemainSecs,
    arrayToString,
    stringToArray,
    arrayPointAccess,
    u8arrToString,
    sleep,
}