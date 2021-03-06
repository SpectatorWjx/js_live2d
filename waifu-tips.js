/*
 * Live2D Widget
 * https://github.com/stevenjoezhang/live2d-widget
 */

function loadWidget(config) {
    let { waifuPath, apiPath, cdnPath } = config;
    let modelList;
    if (!cdnPath.endsWith("/")) cdnPath += "/";
    if (!apiPath.endsWith("/")) apiPath += "/";

    localStorage.removeItem("waifu-display");
    sessionStorage.removeItem("waifu-text");
    document.body.insertAdjacentHTML("beforeend", `<div id="waifu"><div id="waifu-tips"></div><canvas id="live2d" width="1200" height="1200"></canvas><div id="waifu-tool"><span class="fa fa-lg fa-comment"></span><span class="fa fa-lg fa-paper-plane"></span><span class="fa fa-lg fa-user-circle"></span><span class="fa fa-lg fa-street-view"></span><span class="fa fa-lg fa-camera-retro"></span><span class="fa fa-lg fa-info-circle"></span><span class="fa fa-lg fa-times"></span></div></div>`);
    setTimeout(() => {
        document.getElementById("waifu").style.bottom = 0;
    }, 0);

    function randomSelection(obj) {
        return Array.isArray(obj) ? obj[Math.floor(Math.random() * obj.length)] : obj;
    }
    // 检测用户活动状态，并在空闲时显示消息
    let userAction = false,
        userActionTimer,
        messageTimer,
        messageArray = ["好久不见，日子过得好快呢……", "大坏蛋！你都多久没理人家了呀，嘤嘤嘤～", "嗨～快来逗我玩吧！", "拿小拳拳锤你胸口！", "记得把小家加入 Adblock 白名单哦！"];
    window.addEventListener("mousemove", () => userAction = true);
    window.addEventListener("keydown", () => userAction = true);
    setInterval(() => {
        if (userAction) {
            userAction = false;
            clearInterval(userActionTimer);
            userActionTimer = null;
        } else if (!userActionTimer) {
            userActionTimer = setInterval(() => {
                showMessage(randomSelection(messageArray), 6000, 9);
            }, 20000);
        }
    }, 1000);

    (function registerEventListener() {
        document.querySelector("#waifu-tool .fa-comment").addEventListener("click", showHitokoto);
        document.querySelector("#waifu-tool .fa-paper-plane").addEventListener("click", () => {
            if (window.Asteroids) {
                if (!window.ASTEROIDSPLAYERS) window.ASTEROIDSPLAYERS = [];
                window.ASTEROIDSPLAYERS.push(new Asteroids());
            } else {
                let script = document.createElement("script");
                script.src = "https://cdn.jsdelivr.net/gh/GalaxyMimi/CDN/asteroids.js";
                document.head.appendChild(script);
            }
        });
        document.querySelector("#waifu-tool .fa-user-circle").addEventListener("click", loadOtherModel);
        document.querySelector("#waifu-tool .fa-street-view").addEventListener("click", loadRandModel);
        document.querySelector("#waifu-tool .fa-camera-retro").addEventListener("click", () => {
            showMessage("照好了嘛，是不是很可爱呢？", 6000, 9);
            Live2D.captureName = "photo.png";
            Live2D.captureFrame = true;
        });
        document.querySelector("#waifu-tool .fa-info-circle").addEventListener("click", () => {
            open("https://github.com/SpectatorWjx");
        });
        document.querySelector("#waifu-tool .fa-times").addEventListener("click", () => {
            localStorage.setItem("waifu-display", Date.now());
            showMessage("愿你有一天能与重要的人重逢。", 2000, 11);
            document.getElementById("waifu").style.bottom = "-500px";
            setTimeout(() => {
                document.getElementById("waifu").style.display = "none";
                document.getElementById("waifu-toggle").classList.add("waifu-toggle-active");
            }, 3000);
        });
        let devtools = () => {};
        console.log("%c", devtools);
        devtools.toString = () => {
            showMessage("哈哈，你打开了控制台，是想要看看我的小秘密吗？", 4000, 9);
        };
        window.addEventListener("copy", () => {
            showMessage("你都复制了些什么呀，转载要记得加上出处哦！", 4000, 9);
        });
        window.addEventListener("visibilitychange", () => {
            if (!document.hidden) showMessage("哇，你终于回来了～", 4000, 9);
        });
    })();

    function showHitokoto() {
        // 增加 hitokoto.cn 的 API
        fetch("https://v1.hitokoto.cn")
            .then(response => response.json())
            .then(result => {
                let text = `这句一言来自 <span>「${result.from}」</span>，是 <span>${result.creator}</span> 在 hitokoto.cn 投稿的。`;
                showMessage(result.hitokoto, 6000, 9);
                setTimeout(() => {
                    showMessage(text, 4000, 9);
                }, 6000);
            });
    }

    function showMessage(text, timeout, priority) {
        if (!text || (sessionStorage.getItem("waifu-text") && sessionStorage.getItem("waifu-text") > priority)) return;
        if (messageTimer) {
            clearTimeout(messageTimer);
            messageTimer = null;
        }
        text = randomSelection(text);
        sessionStorage.setItem("waifu-text", priority);
        let tips = document.getElementById("waifu-tips");
        tips.innerHTML = text;
        tips.classList.add("waifu-tips-active");
        messageTimer = setTimeout(() => {
            sessionStorage.removeItem("waifu-text");
            tips.classList.remove("waifu-tips-active");
        }, timeout);
    }

    (function initModel() {
        let modelId = localStorage.getItem("modelId");
		if(!modelId){
			modelId = 0;
		}
        loadModel(modelId);
        fetch(waifuPath)
            .then(response => response.json())
            .then(result => {
                window.addEventListener("mouseover", event => {
                    for (let tips of result.mouseover) {
                        if (!event.target.matches(tips.selector)) continue;
                        let text = randomSelection(tips.text);
                        text = text.replace("{text}", event.target.innerText);
                        showMessage(text, 3000, 8);
                        return;
                    }
                });
                window.addEventListener("click", event => {
                    for (let tips of result.click) {
                        if (!event.target.matches(tips.selector)) continue;
                        let text = randomSelection(tips.text);
                        text = text.replace("{text}", event.target.innerText);
                        showMessage(text, 3000, 8);
                        return;
                    }
                });
                result.seasons.forEach(tips => {
                    let now = new Date(),
                        after = tips.date.split("-")[0],
                        before = tips.date.split("-")[1] || after;
                    if ((after.split("/")[0] <= now.getMonth() + 1 && now.getMonth() + 1 <= before.split("/")[0]) && (after.split("/")[1] <= now.getDate() && now.getDate() <= before.split("/")[1])) {
                        let text = randomSelection(tips.text);
                        text = text.replace("{year}", now.getFullYear());
                        //showMessage(text, 7000, true);
                        messageArray.push(text);
                    }
                });
            });
    })();

    async function loadModelList() {
        let response = await fetch(`${apiPath}model_list.json`);
        let result = await response.json();
        modelList = result;
    }

    async function loadModel(modelId, message) {
        localStorage.setItem("modelId", modelId);
        showMessage(message, 4000, 10);
        if (!modelList) await loadModelList();
        let target = randomSelection(modelList.models[modelId]);
        loadlive2d("live2d", `${cdnPath}model/${target}/model.json`);
    }

    async function loadRandModel() {
        let modelId = localStorage.getItem("modelId");
        if (!modelList) await loadModelList();
        let target = randomSelection(modelList.models[modelId]);
        loadlive2d("live2d", `${cdnPath}model/${target}/model.json`);
        showMessage("我的新衣服好看嘛？", 4000, 10);

    }

    async function loadOtherModel() {
        let modelId = localStorage.getItem("modelId");
        if (!modelList) await loadModelList();
        let index = (++modelId >= modelList.models.length) ? 0 : modelId;
        loadModel(index, modelList.messages[index]);
    }
}

function initWidget(config, apiPath) {
    if (typeof config === "string") {
        config = {
            waifuPath: config,
            apiPath
        };
    }
    document.body.insertAdjacentHTML("beforeend", `<div id="waifu-toggle"><span>看板娘</span></div>`);
    let toggle = document.getElementById("waifu-toggle");
    toggle.addEventListener("click", () => {
        toggle.classList.remove("waifu-toggle-active");
        if (toggle.getAttribute("first-time")) {
            loadWidget(config);
            toggle.removeAttribute("first-time");
        } else {
            localStorage.removeItem("waifu-display");
            document.getElementById("waifu").style.display = "";
            setTimeout(() => {
                document.getElementById("waifu").style.bottom = 0;
            }, 0);
        }
    });
    if (localStorage.getItem("waifu-display") && Date.now() - localStorage.getItem("waifu-display") <= 86400000) {
        toggle.setAttribute("first-time", true);
        setTimeout(() => {
            toggle.classList.add("waifu-toggle-active");
        }, 0);
    } else {
        loadWidget(config);
    }
}