const { default: axios } = require("axios");

let http = axios.create({
    baseURL: "http://localhost:8000/v1"
})

;(async function() {
    const count = parseInt(process.argv[2]) || 3;
    console.log("创建房间")
    const res = await http.get('/roomCreate')
    console.log(res.data)
    let roomId = res.data.id;
    let players = [
        {
            "userId": "1",
            "avatarUrl": "https://gimg2.baidu.com/image_search/src=http%3A%2F%2Fc-ssl.duitang.com%2Fuploads%2Fblog%2F202011%2F17%2F20201117105437_45d41.thumb.1000_0.jpeg&refer=http%3A%2F%2Fc-ssl.duitang.com&app=2002&size=f9999,10000&q=a80&n=0&g=0n&fmt=jpeg?sec=1641058454&t=592268e790719b5e059efc67e95eecd8",
            "nickName": "angel"
        }, {
            "userId": "2",
            "avatarUrl": "https://gimg2.baidu.com/image_search/src=http%3A%2F%2Fup.enterdesk.com%2Fedpic%2F52%2Fc9%2F24%2F52c924bd5db63b23aeb4ebb41de4192e.jpg&refer=http%3A%2F%2Fup.enterdesk.com&app=2002&size=f9999,10000&q=a80&n=0&g=0n&fmt=jpeg?sec=1641058454&t=76c592449aa36410c78fb2488b2e455d",
            "nickName": "ben"
        }, {
            "userId": "3",
            "avatarUrl": "https://gimg2.baidu.com/image_search/src=http%3A%2F%2Fc-ssl.duitang.com%2Fuploads%2Fitem%2F202003%2F20%2F20200320133354_idvak.thumb.1000_0.jpg&refer=http%3A%2F%2Fc-ssl.duitang.com&app=2002&size=f9999,10000&q=a80&n=0&g=0n&fmt=jpeg?sec=1640951992&t=597aa4233e483d25335b6b4b7513ea46",
            "nickName": "jojo"
        }, {
            "userId": "4",
            "avatarUrl": "https://gimg2.baidu.com/image_search/src=http%3A%2F%2Fup.enterdesk.com%2Fedpic%2F76%2F7b%2F57%2F767b578c5e68a890cf98b5b7e002aca8.jpeg&refer=http%3A%2F%2Fup.enterdesk.com&app=2002&size=f9999,10000&q=a80&n=0&g=0n&fmt=jpeg?sec=1641737002&t=0086394590cab69b7a41be71e88b9126",
            "nickName": "Cas"
        }, {
            "userId": "5",
            "avatarUrl": "https://gimg2.baidu.com/image_search/src=http%3A%2F%2Fb-ssl.duitang.com%2Fuploads%2Fitem%2F201711%2F14%2F20171114215055_LtiAF.thumb.700_0.jpeg&refer=http%3A%2F%2Fb-ssl.duitang.com&app=2002&size=f9999,10000&q=a80&n=0&g=0n&fmt=jpeg?sec=1641737002&t=97437583b1ac45f4c17c4777c14e4e63",
            "nickName": "salic"
        }, {
            "userId": "6",
            "avatarUrl": "https://gimg2.baidu.com/image_search/src=http%3A%2F%2Fb-ssl.duitang.com%2Fuploads%2Fitem%2F201806%2F23%2F20180623144017_ivhsn.thumb.700_0.jpeg&refer=http%3A%2F%2Fb-ssl.duitang.com&app=2002&size=f9999,10000&q=a80&n=0&g=0n&fmt=jpeg?sec=1641737002&t=5d55dc0225e6978efcd2cd3c3645fb7e",
            "nickName": "Opo",
        }
    ]
    let arr = players.slice(0, count).map(async (item) => {
        console.log(`玩家${item.userId} 加入房间`)
        return http.post("/roomJoin", { 
            player: item, 
            roomId
        })
    })
    await Promise.all(arr);
    console.log("——————————————————")
    console.log("脚本执行完毕")
})();