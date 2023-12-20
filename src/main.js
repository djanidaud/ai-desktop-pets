const {app, BrowserWindow, screen, ipcMain} = require('electron');
const path = require('node:path')
const {CANVAS_WIDTH, CANVAS_HEIGHT} = require("./app.config");

require('electron-reload')(__dirname);


const isMac = process.platform === 'darwin';
let isBeingDragged = false;

if (isMac) {
    app.dock.hide();
}

const createWindow = () => {
    const win = new BrowserWindow({
        width: CANVAS_WIDTH,
        height: CANVAS_HEIGHT,
        frame: false,
        movable: true,
        focusable: false,
        alwaysOnTop: true,
        minimizable: false,
        transparent: true,
        roundedCorners: false,
        acceptFirstMouse: true,
        fullscreenable: false,
        hasShadow: false,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: true,
            contextIsolation: false,
            enableRemoteModule: true,
        }
    })

    win.setAlwaysOnTop(true, 'screen-saver');
    win.setVisibleOnAllWorkspaces(true)


    setInterval(() => {
        if (isBeingDragged)
            return;

        fallDown(win);
    }, 10)

    win.loadFile('src/index.html');
    // win.webContents.openDevTools({detach: true});
}

const fallDown = (window) => {
    const primaryDisplay = screen.getPrimaryDisplay()
    const height = primaryDisplay.size.height;

    const x = window.getPosition()[0];
    const y = window.getPosition()[1];

    const hasReachedBottom = (y + CANVAS_HEIGHT) >= height;
    if (hasReachedBottom) {
        window.setPosition(x, height - CANVAS_HEIGHT);
        return;
    }
    window.setPosition(x, y + 5);
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

    if (newY < 0) newY = 0;
    if ((newY + CANVAS_HEIGHT) > height) newY = height - CANVAS_HEIGHT;

    if (newX < 0) newX = 0;
    if ((newX + CANVAS_WIDTH) > width) newX = width - CANVAS_WIDTH;

    window.setPosition(newX, newY);
});

ipcMain.on('mouseup', () => {
    isBeingDragged = false;
});


ipcMain.on('mousedown', () => {
    isBeingDragged = true;
});

