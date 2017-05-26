const ipcRenderer = require('electron').ipcRenderer;

const proxies = document.getElementById('proxies');
const splashUrl = document.getElementById('splashUrl');
const sku = document.getElementById('sku');
const tpp = document.getElementById('tpp');
const addTasks = document.getElementById('addTasks');
const removeAllTasks = document.getElementById('removeAllTasks');
const saveSettings = document.getElementById('saveSettings');
const queueTasks = document.getElementById('queueTasks');
const atcTasks = document.getElementById('atcTasks');
const formJson = document.getElementById('formJson');
const sitekey = document.getElementById('sitekey');
const apikey = document.getElementById('apikey');
const ready = document.getElementById('ready');
const readySpan = document.getElementById('readySpan');

let tasks = {
    queue: [],
    atc: []
};

let queueIndex = 0;
let atcIndex = 0;

/*
                        <tr>
                            <td>0</td>
                            <td>In Queue</td>
                            <td>275.288.34.525:3128</td>
                            <td>
                                <button type="button" class="btn btn-default tasks-action">Copy Cookies</button>
                                <button type="button" class="btn btn-default tasks-action">Copy HTML</button>
                                <button disabled type="button" class="btn btn-default tasks-action">Start ATC</button>
                            </td>
                        </tr>

                        <tr>
                            <td>0</td>
                            <td>Attempting ATC</td>
                            <td>275.288.34.525:3128</td>
                            <td>
                                <button type="button" class="btn btn-default tasks-action">Copy Cookies</button>
                                <button type="button" class="btn btn-default tasks-action">Copy HTML</button>
                            </td>
                        </tr>
*/

addTasks.addEventListener("click", function() {
    let proxyList = proxies.value.split('\n');
    for (proxyIndex in proxyList) {
        if (!proxyList[proxyIndex] == '') {
            for(let i = 0; i < tpp.value; i++) {
                let taskId = queueIndex++;
                let tr = document.createElement('tr');
                tr.setAttribute('class', 'js-task' + taskId);
                let id = document.createElement('td');
                id.setAttribute('class', 'js-id')
                id.textContent = taskId;
                let status = document.createElement('td');
                status.setAttribute('class', 'js-status');
                status.textContent = 'Initializing';
                let proxy = document.createElement('td');
                proxy.setAttribute('class', 'js-proxy');
                proxy.textContent = proxyList[proxyIndex];
                let actions = document.createElement('td');
                actions.setAttribute('class', 'js-actions');

                let copyCookies = document.createElement('button');
                copyCookies.setAttribute("type", "button");
                copyCookies.setAttribute("class", "btn btn-default tasks-action js-copyCookies");
                copyCookies.setAttribute('disabled', '');
                copyCookies.textContent = 'Copy Cookies';
                copyCookies.addEventListener('click', function() {
                    ipcRenderer.send('queueTask' + id.textContent + 'CopyCookies', '');
                })

                let copyHtml = document.createElement('button');
                copyHtml.setAttribute("type", "button");
                copyHtml.setAttribute("class", "btn btn-default tasks-action js-copyHtml");
                copyHtml.setAttribute('disabled', '');
                copyHtml.textContent = 'Copy HTML';
                copyHtml.addEventListener('click', function() {
                    ipcRenderer.send('queueTask' + id.textContent + 'CopyHtml', '');
                })

                let showHide = document.createElement('button');
                showHide.setAttribute("type", "button");
                showHide.setAttribute("class", "btn btn-default tasks-action js-showHide");
                showHide.setAttribute('disabled', '');
                showHide.textContent = 'Show/Hide';
                showHide.addEventListener('click', function() {
                    ipcRenderer.send('queueTask' + id.textContent + 'showHide', '');
                })

                let startAtc = document.createElement('button');
                startAtc.setAttribute("type", "button");
                startAtc.setAttribute("class", "btn btn-default tasks-action js-startAtc");
                startAtc.setAttribute('disabled', '');
                startAtc.textContent = 'Start ATC Task';
                startAtc.addEventListener('click', function() {
                    if(ready.checked)
                        ipcRenderer.send('queueTask' + id.textContent + 'StartAtc', {
                            formJson: formJson.value,
                            sitekey: sitekey.value,
                            apikey: apikey.value
                        });
                    else
                        flash(readySpan, 'red');
                })

                actions.appendChild(copyCookies);
                actions.appendChild(copyHtml);
                actions.appendChild(showHide);
                actions.appendChild(startAtc);

                tr.appendChild(id);
                tr.appendChild(status);
                tr.appendChild(proxy);
                tr.appendChild(actions);

                queueTasks.appendChild(tr);

                ipcRenderer.on('queueTask' + id.textContent + 'SetStatus', (event, data) => {
                    status.textContent = data;
                })

                ipcRenderer.on('queueTask' + id.textContent + 'SetColor', (event, data) => {
                    tr.style.background = data;
                })

                ipcRenderer.on('queueTask' + id.textContent + 'EnableButton', (event, data) => {
                    let button;
                    switch(data) {
                        case 'copyCookies':
                            button = copyCookies;
                            break;
                        case 'copyHtml':
                            button = copyHtml;
                            break;
                        case 'startAtc':
                            button = startAtc;
                            break;
                        case 'showHide':
                            button = showHide;
                            break;
                        default:
                            break;
                    }
                    if (typeof button != undefined && button.hasAttribute('disabled')) {
                        button.removeAttribute('disabled');
                    }
                })

                ipcRenderer.send('addQueueTask', {
                    id: id.textContent,
                    proxy: proxyList[proxyIndex],
                    url: splashUrl.value,
                    sku: sku.value
                });
            }
        }
    }

})

removeAllTasks.addEventListener("click", function() {
    // TODO End all tasks
    window.location.reload();
    ipcRenderer.send('removeAllTasks', '');
})

saveSettings.addEventListener("click", function() {
    ipcRenderer.send('saveSettings', {
        proxies: proxies.value,
        splashUrl: splashUrl.value,
        sku: sku.value,
        tpp: tpp.value,
        formJson: formJson.value,
        sitekey: sitekey.value,
        apikey: apikey.value
    });
})

ipcRenderer.send('loadSettings', '');

ipcRenderer.on('loadSettings', (event, data) => {
    proxies.value = data.proxies;
    splashUrl.value = data.splashUrl;
    sku.value = data.sku;
    formJson.value = data.formJson;
    sitekey.value = data.sitekey;
    apikey.value = data.apikey;
})

ipcRenderer.on('addAtcTask', (event, data) => {
    let taskId = data.id;
    let tr = document.createElement('tr');
    tr.setAttribute('class', 'js-task' + taskId);
    let id = document.createElement('td');
    id.setAttribute('class', 'js-id')
    id.textContent = taskId;
    let status = document.createElement('td');
    status.setAttribute('class', 'js-status');
    status.textContent = 'Initializing';
    let proxy = document.createElement('td');
    proxy.setAttribute('class', 'js-proxy');
    proxy.textContent = data.proxy;
    let actions = document.createElement('td');
    actions.setAttribute('class', 'js-actions');

    let copyCookies = document.createElement('button');
    copyCookies.setAttribute("type", "button");
    copyCookies.setAttribute("class", "btn btn-default tasks-action js-copyCookies");
    copyCookies.setAttribute('disabled', '');
    copyCookies.textContent = 'Copy Cookies';
    copyCookies.addEventListener('click', function() {
        ipcRenderer.send('atcTask' + id.textContent + 'CopyCookies', '');
    })

    let copyHtml = document.createElement('button');
    copyHtml.setAttribute('class', 'copyHtml');
    copyHtml.setAttribute("type", "button");
    copyHtml.setAttribute("class", "btn btn-default tasks-action js-copyHtml");
    copyHtml.setAttribute('disabled', '');
    copyHtml.textContent = 'Copy HTML';
    copyHtml.addEventListener('click', function() {
        ipcRenderer.send('atcTask' + id.textContent + 'CopyHtml', '');
    })

    let showHide = document.createElement('button');
    showHide.setAttribute("type", "button");
    showHide.setAttribute("class", "btn btn-default tasks-action js-showHide");
    showHide.setAttribute('disabled', '');
    showHide.textContent = 'Show/Hide';
    showHide.addEventListener('click', function() {
        ipcRenderer.send('atcTask' + id.textContent + 'showHide', '');
    })

    actions.appendChild(copyCookies);
    actions.appendChild(copyHtml);
    actions.appendChild(showHide);

    tr.appendChild(id);
    tr.appendChild(status);
    tr.appendChild(proxy);
    tr.appendChild(actions);

    atcTasks.appendChild(tr);

    ipcRenderer.on('atcTask' + id.textContent + 'SetStatus', (event, data) => {
        status.textContent = data;
    })

    ipcRenderer.on('atcTask' + id.textContent + 'SetColor', (event, data) => {
        tr.style.background = data;
    })

    ipcRenderer.on('atcTask' + id.textContent + 'EnableButton', (event, data) => {
        let button;
        switch(data) {
            case 'copyCookies':
                button = copyCookies;
                break;
            case 'copyHtml':
                button = copyHtml;
                break;
            case 'showHide':
                button = showHide;
                break;
            default:
                  break;
        }
        if (typeof button != undefined && button.hasAttribute('disabled')) {
            button.removeAttribute('disabled');
        }
    })
})

ipcRenderer.on('copy', (event, data) => {
    copyToClipboard(data);
})

function copyToClipboard(text) {
    if (window.clipboardData && window.clipboardData.setData) {
        // IE specific code path to prevent textarea being shown while dialog is visible.
        return clipboardData.setData("Text", text); 

    } else if (document.queryCommandSupported && document.queryCommandSupported("copy")) {
        var textarea = document.createElement("textarea");
        textarea.textContent = text;
        textarea.style.position = "fixed";  // Prevent scrolling to bottom of page in MS Edge.
        document.body.appendChild(textarea);
        textarea.select();
        try {
            return document.execCommand("copy");  // Security exception may be thrown by some browsers.
        } catch (ex) {
            console.warn("Copy to clipboard failed.", ex);
            return false;
        } finally {
            document.body.removeChild(textarea);
        }
    }
}

function flash(element, color) {
    let norm = element.style.background
    element.style.background = color;
    setTimeout(function() {
            element.style.background = norm;
    }, 250)
    setTimeout(function() {
        element.style.background = color;
    }, 500)
    setTimeout(function() {
        element.style.background = norm;
    }, 750)
}