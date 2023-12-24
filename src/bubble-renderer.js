const {ipcRenderer} = require("electron");

ipcRenderer.on("write-joke", (event, joke) => {
    document.body.innerHTML = `<div class="thought">${joke}</div>`;
});
