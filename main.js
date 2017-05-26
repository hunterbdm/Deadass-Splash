const electron = require('electron');
const {app, BrowserWindow} = electron;
const ipcMain = electron.ipcMain
const Nightmare = require('nightmare');
const electronPath = require('./node_modules/electron');
const request = require('request');
const fs = require('fs');

const sizeIds = {
    'US 4.5': '_540',
    'US 5': '_550',
    'US 5.5': '_560',
    'US 6': '_570',
    'US 6.5': '_580',
    'US 7': '_590',
    'US 7.5': '_600',
    'US 8': '_610',
    'US 8.5': '_620',
    'US 9': '_630',
    'US 9.5': '_640',
    'US 10': '_650',
    'US 10.5': '_660',
    'US 11': '_670',
    'US 11.5': '_680',
    'US 12': '_690',
    'US 12.5': '_700',
    'US 13': '_710',
    'US 14': '_730',
    'US 15': '_750',
    'UK 4.5': '_550',
    'UK 5': '_560',
    'UK 5.5': '_570',
    'UK 6': '_580',
    'UK 6.5': '_590',
    'UK 7': '_600',
    'UK 7.5': '_610',
    'UK 8': '_620',
    'UK 8.5': '_630',
    'UK 9': '_640',
    'UK 9.5': '_650',
    'UK 10': '_660',
    'UK 10.5': '_670',
    'UK 11': '_680',
    'UK 11.5': '_690',
    'UK 12': '_700',
    'UK 12.5': '_710',
    'UK 13': '_720',
    'UK 14': '_730',
    'UK 15': '_740'
}

const QueueTasks = [];
const AtcTasks = [];
let loadingTasks = 0;
let atcIndex = 0;
let mainWin;
let sizeWin;

Nightmare.action('show',
    function (name, options, parent, win, renderer, done) {
        parent.respondTo('show', function (done) {
            win.show();
            done();
        });
        done();
    },
    function (done) {
        this.child.call('show', done);
    });

Nightmare.action('hide',
    function (name, options, parent, win, renderer, done) {
        parent.respondTo('hide', function (done) {
            win.hide();
            done();
        });
        done();
    },
    function (done) {
        this.child.call('hide', done);
    });

init();

function init() {
    app.on('ready', function() {
        mainWin = new BrowserWindow({width:1300, height:700, icon: __dirname + '/img/favicon.png'});
        mainWin.loadURL('file://' + __dirname +'/index.html');
        mainWin.setMenu(null);
        mainWin.addListener('closed', function() {
            endAll();
            app.exit();
            process.exit(1);
        })
        sizeWin = new BrowserWindow({width:275, height:120, resizable: false, frame: false, icon: __dirname + '/img/favicon.png'});
        sizeWin.loadURL('file://' + __dirname +'/size.html');
        sizeWin.hide();
    });
}

function getCaptcha(apikey, sitekey, url, callback=undefined) {
    request({
        url: 'http://2captcha.com/in.php',
        followAllRedirects: true,
        method: 'post',
        formData: {
            'key': apikey,
            'method': 'userrecaptcha',
            'googlekey': sitekey,
            'proxy': 'localhost',
            'proxytype': 'HTTP',
            'pageurl': url,
            'json': 1
            }
        }, function(err, res, body) {
                if (err){
                    console.log(err);
                }
                else{
                    let respJson = JSON.parse(res.body)
                    if(res.statusCode == 200 && respJson.status == 1) {
                        let captchaId = respJson.request;
                        let checkForSolution = function() {
                            request({
                                url: `http://2captcha.com/res.php?key=${apikey}&action=get&id=${captchaId}&json=1}`,
                                followAllRedirects: true,
                                method: 'get'
                            }, function(err, res, body) {
                                respJson = JSON.parse(res.body);
                                if(respJson.status == 1) {
                                    if(callback) {
                                        callback(respJson.request);
                                    }
                                    return respJson.request
                                }
                                setTimeout(checkForSolution, 5000);
                            });
                        }
                        setTimeout(checkForSolution, 5000);
                    }
                }
            });
}

function getCaptcha2(apikey, sitekey, url, callback=undefined) {
    request({
        url: 'https://api.anti-captcha.com/createTask',
        method: 'POST',
        json: {
            "clientKey": apikey,
            "task": {
                "websiteURL": url,
                "websiteKey": sitekey,
                "type": "NoCaptchaTaskProxyless"
            }
        }
        }, function(err, res, body) {
                if (err){
                    console.log(err);
                }
                else {
                    let respJson = res.body
                    if(res.statusCode == 200 && respJson.errorId == 0) {
                        let captchaId = respJson.taskId;

                        let checkForSolution = function() {
                            request({
                                url: `https://api.anti-captcha.com/getTaskResult`,
                                method: 'POST',
                                json: {
                                    "clientKey": apikey,
                                    "taskId": captchaId
                                }
                            }, function(err, res, body) {
                                respJson = res.body;
                                if(respJson.status == 'ready') {
                                    if(callback) {
                                        callback(respJson.solution.gRecaptchaResponse);
                                    }
                                    return respJson.solution.gRecaptchaResponse;
                                }
                                setTimeout(checkForSolution, 5000);
                            });
                        }
                        setTimeout(checkForSolution, 5000);
                    }
                }
            });
}

function endAll() {
    for(i in QueueTasks) {
        QueueTasks[i].end();
    }
}

function saveSettings(data) {
    fs.writeFile(__dirname + '/settings.json', JSON.stringify(data));
}

function loadSettings() {
    fs.readFile( __dirname + '/settings.json', (err, data) => {
        mainWin.webContents.send('loadSettings', JSON.parse(data));
    });
}

ipcMain.on('addQueueTask', (event, data) => {
    QueueTasks[data.id] = new QueueTask(data.id, data.proxy, data.url, data.sku);
});

ipcMain.on('removeAllTasks', (event, data) => {
    endAll();
});

ipcMain.on('saveSettings', (event, data) => {
    saveSettings(data);
});

ipcMain.on('loadSettings', (event, data) => {
    loadSettings();
});

class QueueTask {
    constructor(id, proxy, url, sku, sizes) {
        this.id = id;
        this.proxy = proxy;
        this.url = url
        this.sku = sku;
        this.sizes = sizes;
        this.showing = false;
        this.status = '';

        this.setStatus('Waiting To Start');
        let waitToStart = () => {
            if(loadingTasks >  5) 
                setTimeout(waitToStart, 100);
            else {
                loadingTasks++;
                this.init(() => {
                    this.start();
                });
                return
            }
        }
        waitToStart();
    }

    init(callback=undefined) {
        this.setStatus('Initilizing');
        /* 
        Setup proxy 
        */
        if(this.proxy != 'localhost') {
            const proxySplit = this.proxy.split(':');
            this.nightmare = new Nightmare({
                show: false,
                electronPath: electronPath,
                switches: {
                    'proxy-server': proxySplit[0] + ':' + proxySplit[1]
                }
            });
            /* Add Authentication if proxy used user:pass */
            if (proxySplit.length > 2) {
                this.nightmare.authentication(proxySplit[2], proxySplit[3]);
            }
        }
        else
            this.nightmare = new Nightmare({
                show: false, 
                electronPath: electronPath
            });

        /* 
        Setup task specific eventListeners
        */
        /* Copy HTML action listener */
        ipcMain.on('queueTask' + this.id + 'CopyHtml', (event, data) => {
            this.getHtml(function(html) {
                mainWin.webContents.send('copy' , html);
            })
        })
        /* Copy cookie action listener */
        ipcMain.on('queueTask' + this.id + 'CopyCookies', (event, data) => {
            this.getCookies(function(cookies) {
                mainWin.webContents.send('copy' , JSON.stringify(cookies));
            })

        })
        /* Start atc action listener */
        ipcMain.on('queueTask' + this.id + 'StartAtc', (event, data) => {
            this.startAtc(data);
        })

        /* Show/hide action listener */
        ipcMain.on('queueTask' + this.id + 'showHide', (event, data) => {
            if(this.showing) {
                this.nightmare
                    .hide()
                    .then(() => {
                        this.showing = false;
                        this.setStatus(this.status);
                    })
            }
            else {
                this.nightmare
                    .show()
                    .then(() => {
                        this.showing = true;
                        this.setStatus(this.status);
                    })
            }
        })

        if(callback) {
            callback();
        }
    }

    start() {
        this.enableButton('showHide');
        let doneLoading = false;
        // remove loadingTask after 45 seconds if it has not finished loading already
        setTimeout(() => {
            if(!doneLoading) {
                this.setStatus('Timed Out');
                loadingTasks--;
                doneLoading = true;
                //this.end();
            }
        }, 45000);
        this.setStatus('Loading.');

        this.nightmare
            .useragent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/60.0.3080.5 Safari/537.36')
            .goto(this.url)
            /*
            .catch(function(err) {
                this.setStatus('Timeout');
                this.setColor('red');
                loadingTasks--;
                end();
            }) */
            .then(() => {
                if(!doneLoading) {
                    setTimeout(() => {loadingTasks--;}, 3000);
                    doneLoading = true;
                }
                this.setStatus('In Queue');
                this.enableButton('copyCookies');
                this.enableButton('copyHtml');
                let checkForSitekey = () => {
                    this.getHtml((pageSource) => {
                        if (pageSource.includes('data-sitekey')) {
                            this.setStatus('Through Queue');
                            this.setColor('green');
                            this.enableButton('startAtc');
                        }
                        else
                            setTimeout(checkForSitekey, 20000);
                    });
                }
                checkForSitekey();
            })
            .catch(function(err) {
                console.log('Nightmare Error:', err);
                this.setStatus('Error: ' + err);
                this.setColor('red');
                if(!doneLoading) {
                    setTimeout(() => {loadingTasks--;}, 3000);
                    doneLoading = true;
                }
                end();
            })
    }

    end() {
        if(this.nightmare)
            this.nightmare.end();
    }

    setStatus(status) {
        status = status.replace(' / Showing', '');
        if(this.showing)
            status += ' / Showing';
        this.status = status;
        mainWin.webContents.send('queueTask' + this.id + 'SetStatus' , status);
    }

    setColor(color) {
        mainWin.webContents.send('queueTask' + this.id + 'SetColor' , color);
    }

    /*
    Current Button Names:
        copyCookies
        copyHtml
        startAtc
    */
    enableButton(buttonName) {
        mainWin.webContents.send('queueTask' + this.id + 'EnableButton', buttonName);
    }

    getCookies(callback) {
        this.nightmare
            .cookies.get({ url: null })
            .then(function(cookies) {
                callback(cookies);
                return cookies;
            })
    }

    getHtml(callback) {
        this.nightmare
            .evaluate(function(selector, done) {
                return document.documentElement.innerHTML;
            })
            .then(function(pageSource) {
                callback(pageSource);
                return pageSource;
            })
            .catch(function(err) {
                callback('Unable to get HTML, ' + err);
                return 'Unable to get HTML, ' + err;
            })
    }

    startAtc(data) {
        sizeWin.webContents.send('reset', '');
        sizeWin.show();
        ipcMain.once('sizeResponse', (event, data2) => {
            if (data2.selected) {
                let size = data2.size;
                sizeWin.hide();
                let taskId = atcIndex++;
                AtcTasks[taskId] = new AtcTask(taskId, this.proxy, this.url, this.sku, size, this.getCookies, data.formJson, data.sitekey, data.apikey);
            }
            else {
                sizeWin.hide();
                return;
            }
        })
    }
}

class AtcTask {
    constructor(id, proxy, url, sku, size, cookies, formJson, sitekey, apikey) {
        this.id = id;
        this.proxy = proxy;
        this.url = url
        this.sku = sku;
        this.size = size;
        this.cookies = cookies;
        this.formJson = formJson;
        this.sitekey = sitekey;
        this.apikey = apikey;
        this.showing = false;
        this.status = '';

        mainWin.webContents.send('addAtcTask', {
            id: this.id,
            proxy: this.proxy
        });

        
        this.init(() => {
            this.start();
        })
    }

    init(callback=undefined) {
        this.setStatus('Initilizing');
        /* 
        Setup proxy 
        */
        if(this.proxy != 'localhost') {
            const proxySplit = this.proxy.split(':');
            this.nightmare = new Nightmare({
                show: false,
                electronPath: electronPath,
                switches: {
                    'proxy-server': proxySplit[0] + ':' + proxySplit[1]
                }
            });
            /* Add Authentication if proxy used user:pass */
            if (proxySplit.length > 2) {
                this.nightmare.authentication(proxySplit[2], proxySplit[3]);
            }
        }
        else
            this.nightmare = new Nightmare({show: false, electronPath: electronPath});

        /* 
        Setup task specific eventListeners
        */
        /* Copy HTML action listener */
        ipcMain.on('atcTask' + this.id + 'CopyHtml', (event, data) => {
            this.getHtml(function(html) {
                mainWin.webContents.send('copy' , html);
            })
        })
        /* Copy cookie action listener */
        ipcMain.on('atcTask' + this.id + 'CopyCookies', (event, data) => {
            this.getCookies(function(cookies) {
                mainWin.webContents.send('copy' , JSON.stringify(cookies));
            })

        })

        /* Show/hide action listener */
        ipcMain.on('atcTask' + this.id + 'showHide', (event, data) => {
            if(this.showing) {
                this.nightmare
                    .hide()
                    .then(() => {
                        this.showing = false;
                        this.setStatus(this.status);
                    })
            }
            else {
                this.nightmare
                    .show()
                    .then(() => {
                        this.showing = true;
                        this.setStatus(this.status);
                    })
            }
        })

        if(callback) {
            callback();
        }
    }

    start() {
        this.setStatus('Loading');
        this.enableButton('showHide');

        this.nightmare
            .useragent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/60.0.3080.5 Safari/537.36')
            .goto(this.url)
            .then(() => {
                this.setStatus('Setting Cookies');
                let cCookies = this.getCookies();
                for(c in this.cookies) {
                    cName = this.cookies[c].name;
                    hasCookies = false;
                    for(c2 in cCookies) {
                        if (cCookies[c2].name == cName)
                        {
                            hasCookies = true;
                            break;
                        }
                    }
                    // If the cookie does not already exist then add it
                    if(!hasCookies) {
                        this.nightmare.cookies.set(this.cookies[c]);
                    }
                }
                this.setStatus('Getting Captcha');
                getCaptcha(this.apikey, this.sitekey, this.url, (captchaRes) => {
                    this.setStatus('Attempting Atc');
                    let sizeSku = this.sku + sizeIds[this.size];
                    this.formJson = this.formJson.replace('{$sku}', this.sku);
                    this.formJson = this.formJson.replace('{$captcha}', captchaRes);
                    this.formJson = this.formJson.replace('{$sizeSku}', sizeSku);
                    this.formJson = JSON.parse(this.formJson);

                    this.nightmare
                        .evaluate(function(FORM_DATA) {
                            var f = document.createElement("form");
                            f.setAttribute("id", "deadassForm");
                            f.setAttribute("method", "post");
                            f.setAttribute("action", FORM_DATA["action"]);

                            for(var key in FORM_DATA["form_data"]) {
                                var element = document.createElement("input");
                                element.setAttribute("type", "hidden");
                                element.setAttribute("name", key);
                                element.setAttribute("value", FORM_DATA["form_data"][key]);
                                f.appendChild(element);
                            }
                            document.getElementsByTagName("body")[0].appendChild(f);

                            document.getElementById(document.querySelector("[id^='deadassForm']").id).submit();
                        }, this.formJson)
                        .then(() => {
                            this.setStatus('ATC Submitted');
                            this.setColor('green');
                            this.enableButton('copyCookies');
                            this.enableButton('copyHtml');
                        })
                })
            })
            .catch(function(err) {
                console.log('Nightmare Error:', err);
                this.setStatus('Connection Failed.');
                this.setColor('red');
            })
    }

    setStatus(status) {
        status = status.replace(' / Showing', '');
        if(this.showing)
            status += ' / Showing';
        this.status = status;
        mainWin.webContents.send('atcTask' + this.id + 'SetStatus' , status);
    }

    setColor(color) {
        mainWin.webContents.send('atcTask' + this.id + 'SetColor' , color);
    }

    /*
    Current Button Names:
        copyCookies
        copyHtml
        startAtc
    */
    enableButton(buttonName) {
        mainWin.webContents.send('atcTask' + this.id + 'EnableButton', buttonName);
    }

    getCookies(callback) {
        this.nightmare
            .cookies.get({ url: null })
            .then(function(cookies) {
                callback(cookies);
                return cookies;
            })
    }

    getHtml(callback) {
        this.nightmare
            .evaluate(function(selector, done) {
                return document.documentElement.innerHTML;
            })
            .then(function(pageSource) {
                callback(pageSource);
                return pageSource;
            })
            .catch(function(err) {
                callback('Unable to get HTML, ' + err);
                return 'Unable to get HTML, ' + err;
            })
    }
}