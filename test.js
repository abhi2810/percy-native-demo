const wdio = require("webdriverio");
const assert = require("assert");
const browserstack = require("browserstack-local");

const opts = {
    hostname: 'hub-cloud.browserstack.com',
    path: '/wd/hub',
    capabilities: {
        "os_version": "10.0",
        "device": "OnePlus 8",
        "app": "PercyAndroid",
        "build": "Percy Build",
        "name": "Percy Session",
        "browserstack.local": true,
        "browserstack.user": process.env.BROWSERSTACK_USERNAME,
        "browserstack.key": process.env.BROWSERSTACK_ACCESS_KEY
    }
};

var bs_local = new browserstack.Local();

async function main() {
    var bs_local_args = { 'key': process.env.BROWSERSTACK_ACCESS_KEY };
    await new Promise((resolve, reject) => {
        bs_local.start(bs_local_args, function () {
            console.log("Started BrowserStackLocal");
            resolve();
        });
    });
    const browser = await wdio.remote(opts);
    await browser.pause(5000);
    var context = await browser.getContexts();
    await browser.switchContext(context[1]);
    await browser.url('http://bs-local.com:5162/assets/index.html');
    await browser.saveScreenshot('./images/dashboard.png');
    await browser.url('http://bs-local.com:5162/assets/login.html');
    await browser.saveScreenshot('./images/login.png');
    await browser.url('http://bs-local.com:5162/assets/signup.html');
    await browser.saveScreenshot('./images/signup.png');
    await browser.url('http://bs-local.com:5162/assets/404_error.html');
    await browser.saveScreenshot('./images/404_error.png');
    await browser.url('http://bs-local.com:5162/assets/500_error.html');
    await browser.saveScreenshot('./images/500_error.png');
    await browser.deleteSession();
    await new Promise((resolve, reject) => {
        bs_local.stop(function () {
            console.log("Stopped BrowserStackLocal");
            resolve();
        });
    });
}

main();