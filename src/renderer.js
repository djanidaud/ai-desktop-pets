const {DesktopPet, ANIMATION_STATE} = require("./pet");

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
    [ANIMATION_STATE.TALK]: {
        sequenceLength: 1,
        srcImageRowIndex: 0,
        frameLength: 150,
    }
}

const desktopPet = new DesktopPet(document, "petCanvas", "../sprites/hedgehog.png", 32, 32, animations);

const animate = () => {
    desktopPet.animate();
    requestAnimationFrame(animate);
}
animate();

