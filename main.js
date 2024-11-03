const getChannelId = () => {
    const selectedElement = document.querySelector('.p-channel_sidebar__channel--selected');
    let dataId = 0;
    if (selectedElement) {
        dataId = selectedElement.closest('div[id]').getAttribute('id');
    }

    return dataId;
}

const fetchReactionFromThread = async (token, channel_id, thread_ts) => {
    const myHeaders = new Headers();
    const formdata = new FormData();
    formdata.append("token", token);
    formdata.append("channel", channel_id);
    formdata.append("timestamp", thread_ts);
    formdata.append("full", "true");

    const requestOptions = {
        method: "POST",
        headers: myHeaders,
        body: formdata,
        redirect: "follow"
    };

    const res = await fetch("/api/reactions.get", requestOptions);

    return await res.json();
}

const getUniqueUser = (reactions) => {
    const uniqueUsers = new Set();

    // Duyệt qua mỗi reaction và thêm từng userId vào Set
    reactions.forEach(reaction => {
        reaction.users.forEach(userId => uniqueUsers.add(userId));
    });

    // Chuyển Set thành mảng
    return Array.from(uniqueUsers);
}

const getUserNameFromId = async (token, userIdList) => {
    let result = {};
    for (let userId of userIdList) {
        const userInfo = await fetchUserInfo(token, userId);
        result[userId] = userInfo.profile.email
    }
    return result;
}

const fetchUserInfo = async (token, userId) => {
    const formdata = new FormData();
    formdata.append("token", token);
    formdata.append("user", userId);

    const requestOptions = {
        method: "POST",
        body: formdata,
        redirect: "follow"
    };

    const res = await fetch("/api/users.profile.get", requestOptions);
    return await res.json();
}

async function getReactionDetails(reactions, userInfo) {
    for (const reaction of reactions) {
        const userNames = await Promise.all(reaction.users.map(userId => userInfo[userId]));
        
        const userNamesStr = userNames.join(', ');
        console.log(`Người reaction ${reaction.name}: ${userNamesStr}`);
    }
}

const counterReaction = async (token) => {
    const channelId = getChannelId();
    if (channelId != 0 ) {
        const reactRes = await fetchReactionFromThread(token, channelId, currentThreadTs);
        const reactionInfo = reactRes.message.reactions;
        if (reactionInfo) {
            const userList =  getUniqueUser(reactionInfo);
            const userInfo = await getUserNameFromId(token, userList)
            await getReactionDetails(reactionInfo, userInfo)
        } else {
            console.log("Không có thông tin reactions")
        } 
    } else {
        alert("Lỗi rồi")
    }
}


var currentThreadTs = 0;
var token = prompt("Vui lòng nhập giá trị:");
if (token == null) {
    alert("Vui lòng nhập token");
} else {
    document.addEventListener('click', function(event) {
        const classList = event.target.classList[0];
        console.log(classList);
        if (event.target.classList.contains('c-timestamp__label')) {
            const targetElement = event.target.closest('.c-message_kit__message');
            if (targetElement) {
                const parentDivWithId = targetElement.closest('div[id]');
                if (parentDivWithId) {
                    currentThreadTs = parentDivWithId.getAttribute('data-item-key');
                    counterReaction(token);
                }
            }
        }
    });
}
