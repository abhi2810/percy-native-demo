const wdio = require("webdriverio");
const browserstack = require("browserstack-local");
const Jimp = require("jimp");

const opts = {
    hostname: 'hub-cloud.browserstack.com',
    path: '/wd/hub',
    capabilities: {
        "os_version": "8.0",
        "device": "Samsung Galaxy S9",
        "app": "PercyAndroid",
        "build": "Percy Build",
        "name": "Percy Session",
        "browserstack.local": true,
        "browserstack.user": process.env.BROWSERSTACK_USERNAME,
        "browserstack.key": process.env.BROWSERSTACK_ACCESS_KEY
    }
};

var bs_local = new browserstack.Local();

async function getFrameLocationSize(browser) {
    var frame = await browser.$('(//android.widget.FrameLayout)[2]');
    var location = await frame.getLocation();
    var size = await frame.getSize();
    return [location.x, location.y, size.width, size.height];
}

async function takeScreenshot(browser, uri, frameLocationSize) {
    await browser.saveScreenshot(uri);
    Jimp.read(uri)
        .then(image => {
            return image.crop(...frameLocationSize).write(uri);
        });
}

async function main() {
    var bs_local_args = { 'key': process.env.BROWSERSTACK_ACCESS_KEY };
    await new Promise((resolve, reject) => {
        bs_local.start(bs_local_args, function () {
            console.log("Started BrowserStackLocal");
            resolve();
        });
    });
    const browser = await wdio.remote(opts);
    await browser.pause(2000);
    const frameLocationSize = await getFrameLocationSize(browser);
    var context = await browser.getContexts();
    await browser.switchContext(context[1]);
    await browser.url('http://bs-local.com:5162/assets/index.html');
    await browser.pause(2000);
    await takeScreenshot(browser, './images/dashboard.png', frameLocationSize);
    await browser.url('http://bs-local.com:5162/assets/login.html');
    await browser.pause(2000);
    await takeScreenshot(browser, './images/login.png', frameLocationSize);
    await browser.url('http://bs-local.com:5162/assets/signup.html');
    await browser.pause(2000);
    await takeScreenshot(browser, './images/signup.png', frameLocationSize);
    await browser.url('http://bs-local.com:5162/assets/404_error.html');
    await browser.pause(2000);
    await takeScreenshot(browser, './images/404_error.png', frameLocationSize);
    await browser.url('http://bs-local.com:5162/assets/500_error.html');
    await browser.pause(2000);
    await takeScreenshot(browser, './images/500_error.png', frameLocationSize);
    await browser.deleteSession();
    await new Promise((resolve, reject) => {
        bs_local.stop(function () {
            console.log("Stopped BrowserStackLocal");
            resolve();
        });
    });
}

main();