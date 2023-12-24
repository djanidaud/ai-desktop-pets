const {ipcRenderer} = require("electron");

ipcRenderer.on("write-joke", (event, joke) => {
    document.body.innerHTML = `<div class="thought">${joke}</div>`;


    event.sender.send("bubble-height", document.body.scrollHeight + 40);
});
