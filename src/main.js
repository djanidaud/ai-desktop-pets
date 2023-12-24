const {app, BrowserWindow, screen, ipcMain, Tray, Menu} = require('electron');
const path = require('node:path')
const tf = require('@tensorflow/tfjs');
const {CANVAS_WIDTH, CANVAS_HEIGHT} = require("./app.config");

require('electron-reload')(__dirname);

const isMac = process.platform === 'darwin';

if (isMac) {
    app.dock.hide();
}

let browserWindow, tray, bubble;

const createWindow = () => {
    browserWindow = new BrowserWindow({
        width: CANVAS_WIDTH,
        height: CANVAS_HEIGHT,
        frame: false,
        movable: true,
        focusable: false,
        alwaysOnTop: true,
        minimizable: false,
        transparent: true,
        resizable: false,
        maxHeight: CANVAS_HEIGHT,
        roundedCorners: false,
        acceptFirstMouse: true,
        fullscreenable: false,
        hasShadow: false,
        useContentSize: true,
        show: false,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: true,
            contextIsolation: false,
        },
    })
    browserWindow.setAlwaysOnTop(true, 'screen-saver');
    browserWindow.setVisibleOnAllWorkspaces(true);
    browserWindow.loadFile('src/index.html');

    bubble = new BrowserWindow({
        width: 300,
        parent: browserWindow,
        frame: false,
        movable: true,
        focusable: false,
        alwaysOnTop: true,
        minimizable: false,
        transparent: true,
        resizable: false,
        roundedCorners: false,
        acceptFirstMouse: false,
        fullscreenable: false,
        hasShadow: false,
        useContentSize: true,
        show: false,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
        }
    })

    bubble.setAlwaysOnTop(true, 'screen-saver');
    bubble.setVisibleOnAllWorkspaces(true);
    bubble.loadFile("src/bubble.html");
    // bubble.webContents.openDevTools()

    browserWindow.webContents.once("did-finish-load", () => {
        browserWindow.show();
    });

    // browserWindow.webContents.openDevTools({detach: true});
    createTray();
}

function createTray() {
    const model = tf.sequential();
    model.add(tf.layers.dense({units: 1, inputShape: [1]}));

    // Prepare the model for training: Specify the loss and the optimizer.
    model.compile({loss: 'meanSquaredError', optimizer: 'sgd'});

    // Generate some synthetic data for training.
    const xs = tf.tensor2d([1, 2, 3, 4], [4, 1]);
    const ys = tf.tensor2d([1, 2, 3, 4], [4, 1]);

    // Train the model using the data.
    model.fit(xs, ys).then(() => {
        // Use the model to do inference on a data point the model hasn't seen before:
        // Open the browser devtools to see the output
        model.predict(tf.tensor2d([5], [1, 1])).print();
    });

    tray = new Tray(path.join(__dirname, "../images/trayTemplate@4x.png"));
    tray.setToolTip("AI Desktop Pet");

    tray.setContextMenu(Menu.buildFromTemplate(
        [
            {
                label: "Exit",
                role: "quit"
            }
        ]
    ))
}


app.whenReady().then(() => {
    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    })
})


app.on('window-all-closed', () => {
    if (!isMac) app.quit()
})

ipcMain.on('move-window', (event, x_hat, y_hat) => {
    const primaryDisplay = screen.getPrimaryDisplay()
    const {width, height} = primaryDisplay.size;

    const window = BrowserWindow.fromWebContents(event.sender);
    let newX = window.getPosition()[0] + x_hat;
    let newY = window.getPosition()[1] + y_hat;
    let isInTheAir = true;
    let isAtLeftBorder = false;
    let isAtRightBorder = false;

    if (newY < 0) {
        newY = 0;
    }

    if ((newY + CANVAS_HEIGHT) > height) {
        newY = height - CANVAS_HEIGHT;
        isInTheAir = false;
    }

    if (newX < 0) {
        newX = 0;
        isAtLeftBorder = true;
    }

    if ((newX + CANVAS_WIDTH) > width) {
        newX = width - CANVAS_WIDTH;
        isAtRightBorder = true;
    }

    window.setPosition(newX, newY);
    window.setSize(CANVAS_WIDTH, CANVAS_HEIGHT);

    const childBubble = window.getChildWindows()[0];
    // childBubble.setPosition(newX - 100, newY - 150);

    childBubble.setPosition(newX - 100, newY - childBubble.getSize()[1] + 60);

    event.reply("move-window-reply", isInTheAir, isAtLeftBorder, isAtRightBorder);
});

ipcMain.on("bubble-height", (event, height) => {
    const bubble = BrowserWindow.fromWebContents(event.sender);
    bubble.setSize(bubble.getSize()[0], height);

    const customSpacing = 60;
    bubble.setPosition(bubble.getParentWindow().getPosition()[0] - 100, bubble.getParentWindow().getPosition()[1] - height + customSpacing);
    bubble.showInactive();
})

ipcMain.on("talk-start", () => {

    fetch("https://v2.jokeapi.dev/joke/Miscellaneous,Dark,Pun,Spooky,Christmas?type=single").then(result => result.json()).then(result => {
        bubble.webContents.send("write-joke", result.joke );
    });

});

ipcMain.on("talk-end", () => {
    bubble.hide();
});
