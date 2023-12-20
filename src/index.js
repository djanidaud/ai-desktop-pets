const {ipcRenderer} = require('electron');
const {CANVAS_WIDTH, CANVAS_HEIGHT} = require("./app.config");
const {DesktopPet, ANIMATION_STATE} = require("./pet");

const canvas = document.getElementById("petCanvas");
canvas.width = CANVAS_WIDTH;
canvas.height = CANVAS_HEIGHT;
document.body.style.maxHeight = CANVAS_HEIGHT + "px";


let isDragging = false;
let offsetX, offsetY;

canvas.addEventListener('mousedown', function (event) {
    isDragging = true;

    offsetX = event.clientX;
    offsetY = event.clientY;

    event.preventDefault();
    ipcRenderer.send('mousedown');
});

document.addEventListener('mouseup', function () {
    isDragging = false;
    ipcRenderer.send('mouseup');
});

document.addEventListener('mousemove', function (event) {
    if (isDragging) {
        const x_hat = event.clientX - offsetX;
        const y_hat = event.clientY - offsetY;

        ipcRenderer.send('move-window', x_hat, y_hat);
    }
});


const animations = {
    [ANIMATION_STATE.IDLE]: {
        sequenceLength: 1,
        srcImageRowIndex: 0,
        frameLength: 5,
    },
    [ANIMATION_STATE.RUN]: {
        sequenceLength: 4,
        srcImageRowIndex: 1,
        frameLength: 2,
    },
    [ANIMATION_STATE.ACTIVITY]: {
        sequenceLength: 4,
        srcImageRowIndex: 2,
        frameLength: 1,
    },
    [ANIMATION_STATE.SLEEP]: {
        sequenceLength: 3,
        srcImageRowIndex: 3,
        frameLength: 7,
    },
}

const desktopPet = new DesktopPet(canvas, "../sprites/hedgehog.png", 32, 32, animations);

const FRAMERATE = 15;
let frame = 0;
const animate = () => {
    if (frame % FRAMERATE === 0)
        desktopPet.animate()
    frame++;
    requestAnimationFrame(animate);
}
animate();

