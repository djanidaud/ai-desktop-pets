const {CANVAS_WIDTH, CANVAS_HEIGHT} = require("./app.config");
const {ipcRenderer} = require("electron");

const ANIMATION_STATE = {
    IDLE: "idle",
    RUN: "run",
    ACTIVITY: "activity1",
    SLEEP: "sleep",
}

class DesktopPet {

    constructor(canvas, imageSrc, spriteWidth, spriteHeight, animations) {
        this.canvas = canvas;
        this.context = canvas.getContext('2d');

        this.petImage = new Image();
        this.petImage.src = imageSrc;

        this.animations = animations;
        this.animationId = ANIMATION_STATE.IDLE;
        this.frameX = 0;
        this.direction = this.getDirection();

        this.spriteWidth = spriteWidth;
        this.spriteHeight = spriteHeight;
    }


    hasAnimationFinished() {
        const {sequenceLength, frameLength} = this.animations[this.animationId];
        return this.frameX === (sequenceLength * frameLength);
    }

    nextAnimation() {
        if (this.animationId !== ANIMATION_STATE.IDLE)
            return ANIMATION_STATE.IDLE;

        const randomVal = Math.random();

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

        // 70%
        return ANIMATION_STATE.IDLE;
    }

    getDirection() {
        const random = Math.random();

        return random < 0.5 ? 1 : -1;
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

    animate() {
        this.drawNextFrame();

        if (this.hasAnimationFinished()) {
            this.frameX = 0;
            this.animationId = this.nextAnimation(this.animationId);
        }

        // While running, walk around
        if (this.animationId === ANIMATION_STATE.RUN) {
            ipcRenderer.send('move-window', 5 * this.direction, 0);
        }
    }
}

module.exports = {
    DesktopPet,
    ANIMATION_STATE
};
