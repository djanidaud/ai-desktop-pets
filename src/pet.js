const {CANVAS_WIDTH, CANVAS_HEIGHT} = require("./app.config");
const {ipcRenderer} = require("electron");

const ANIMATION_STATE = {
    IDLE: "idle",
    RUN: "run",
    ACTIVITY: "activity1",
    SLEEP: "sleep",
    TALK: "talk"
}

class DesktopPet {
    FRAMERATE = 10;
    SPEED = 5;
    CAN_TALK = true;

    constructor(document, canvasId, imageSrc, spriteWidth, spriteHeight, animations) {
        this.frame = 0;

        this.canvas = document.getElementById(canvasId);
        this.canvas.width = CANVAS_WIDTH;
        this.canvas.height = CANVAS_HEIGHT;
        document.body.style.maxHeight = CANVAS_HEIGHT + "px";
        this.context = this.canvas.getContext('2d');

        this.isInTheAir = true;
        this.isAtLeftBorder = false;
        this.isAtRightBorder = false;

        this.petImage = new Image();
        this.petImage.src = imageSrc;

        this.animations = animations;
        this.animationId = ANIMATION_STATE.IDLE;
        this.frameX = 0;
        this.direction = this.getDirection();

        this.spriteWidth = spriteWidth;
        this.spriteHeight = spriteHeight;
        this.isDragging = false;

        let offsetX, offsetY;
        this.canvas.addEventListener('mousedown',  (event) => {
            this.isDragging = true;
            offsetX = event.clientX;
            offsetY = event.clientY;
            event.preventDefault();
        });

        document.addEventListener('mouseup', () => {
            this.isDragging = false;
        });

        document.addEventListener('mousemove', (event) => {
            if (this.isDragging) {
                const x_hat = event.clientX - offsetX;
                const y_hat = event.clientY - offsetY;

                ipcRenderer.send('move-window', x_hat, y_hat);
            }
        });

        ipcRenderer.on("move-window-reply", (event, isInTheAir, isAtLeftBorder, isAtRightBorder) => {
            this.isInTheAir = isInTheAir;
            this.isAtLeftBorder = isAtLeftBorder;
            this.isAtRightBorder = isAtRightBorder;
        });
    }


    hasAnimationFinished() {
        const {sequenceLength, frameLength} = this.animations[this.animationId];
        return this.frameX === (sequenceLength * frameLength);
    }

    nextAnimation() {
        if (this.animationId !== ANIMATION_STATE.IDLE)
            return ANIMATION_STATE.IDLE;

        const randomVal = Math.random();

        if (this.CAN_TALK && randomVal < 0.9) {
            ipcRenderer.send("talk-start");
            return ANIMATION_STATE.TALK;
        }

        // 20%
        if (randomVal < 0.2) {
            this.direction = this.getDirection();
            this.canvas.style.transform = this.direction === 1 ? "rotateY(0deg)" : "rotateY(180deg)";

            return ANIMATION_STATE.RUN;
        }

        // 5%
        if (randomVal < 0.25)
            return ANIMATION_STATE.ACTIVITY;

        // 5%
        if (randomVal < 0.3)
            return ANIMATION_STATE.SLEEP;

        // 10%
        if (this.CAN_TALK && randomVal < 0.9) {
            ipcRenderer.send("talk-start");
            return ANIMATION_STATE.TALK;
        }

        // 60%
        return ANIMATION_STATE.IDLE;
    }

    getDirection() {
        if (this.isAtLeftBorder)
            return 1;

        if (this.isAtRightBorder)
            return -1;

        return Math.random() < 0.5 ? 1 : -1;
    }

    drawNextFrame() {
        const {frameLength, srcImageRowIndex} = this.animations[this.animationId];
        if (this.frameX % frameLength === 0) {
            const sequenceIndex = this.frameX / frameLength;
            this.context.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
            this.context.drawImage(
                this.petImage,
                sequenceIndex * this.spriteWidth,
                srcImageRowIndex * this.spriteHeight,
                this.spriteWidth,
                this.spriteHeight,
                0,
                0,
                CANVAS_WIDTH,
                CANVAS_HEIGHT
            );
        }
        this.frameX++;
    }

    isRunning() {
        return this.animationId === ANIMATION_STATE.RUN;
    }

    isTalking() {
        return this.animationId === ANIMATION_STATE.TALK;
    }

    animationCleanUp() {
        this.frameX = 0;

        if (this.isTalking()) {
            ipcRenderer.send("talk-end");
        }
    }

    animate() {
        if (this.frame % this.FRAMERATE === 0) {
            if (this.isDragging) return;

            this.drawNextFrame();

            if (this.hasAnimationFinished()) {
                this.animationCleanUp();
                this.animationId = this.nextAnimation(this.animationId);
            }

            // While running, walk around
            const walkX = this.isRunning() ? this.SPEED * this.direction : 0;

            if (this.isRunning() || this.isInTheAir) {
                ipcRenderer.send('move-window', walkX, 10);
            }
        }
        this.frame++;
    }
}

module.exports = {
    DesktopPet,
    ANIMATION_STATE
};
