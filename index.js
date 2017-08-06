const ipcRenderer = require('electron').ipcRenderer;

/* Tabs Selects */
const tabSelectAddTasks = $('#tabSelectAddTasks');
const tabSelectBruteforce = $('#tabSelectBruteforce');
const tabSelectCart = $('#tabSelectCart');
const tabSelectSettings = $('#tabSelectSettings');
const tabSelectPayment = $('#tabSelectPayment');
var cTabSelect = tabSelectAddTasks;


/* Tab Divs */
const tabAddTasks = $('#tabAddTasks');
const tabBruteforce = $('#tabBruteforce');
const tabCart = $('#tabCart');
const tabSettings = $('#tabSettings');
const tabPayment = $('#tabPayment');
var cTab = tabAddTasks;
const item = $('.content-container'); // All tabs

/* New BruteForce Tasks Elements */
const proxies = $('#proxies');
const splashUrlBruteforce = $('#splashUrlBruteforce');
const skuBruteforce = $('#skuBruteforce');
const tpp = $('#tpp');
const addBruteforce = $('#addBruteforce');

/* New Cart Tasks Elements */
const proxyCart = $('#proxyCart');
const splashUrlCart = $('#splashUrlCart');
const skuCart = $('#skuCart');
const cookies = $('#cookies');
const sizes = $('#sizes');
const tasks = $('#tasks');
const regionCart = $('#regionCart');
const addCart = $('#addCart');

/* Bruteforce Tasks Elements */
const bruteforceTasks = $('#bruteforceTasks');
const removeAllBruteTasks = $('#removeAllBruteTasks');

/* Cart Tasks Elements */
const cartTasks = $('#cartTasks');
const removeAllCartTasks = $('#removeAllCartTasks');

/* Harvester Elements */
const regionHarvester = $('#regionHarvester');
const threads = $('#threads');
const startHarvester = $('#startHarvester');
const stopHarvester = $('#stopHarvester');

/* Settings Region Divs */
const dropDownRegion = $('#dropdownRegion');
const divUS = $('#divUS');
const divUK = $('#divUK');

/* Global Settings Elements */
const apiKeys = $('#apiKeys');
const gCookies = $('#gCookies');
const userAgent = $('#userAgent');
const hmacName = $('#hmacName');
const saveSettings = $('#saveSettings');

/* Region Specific Settings Elements */
const sitekeyUS = $('#sitekeyUS');
const clientIdUS = $('#clientIdUS');
const capdupUS = $('#capdupUS');
const sitekeyUK = $('#sitekeyUK');
const clientIdUK = $('#clientIdUK');
const capdupUK = $('#capdupUK');

/* Theme Settings */
const darkTheme = "./styles/css/dark-app.css";
const lightTheme = "./styles/css/app.css";
var activeTheme = '';

/* Theme Switch */
$('#themeSelector').change(function() {
  var el = document.getElementById("css-link");
  if($('#darkTheme').is(':checked')){
    el.href = darkTheme;
    activeTheme = 'darkTheme';
  }
  if($('#lightTheme').is(':checked')) {
    el.href = lightTheme;
    activeTheme = 'lightTheme';
  }
});

/* Tasks Indexs */
let bruteforceIndex = 0;
let cartIndex = 0;

$('.tab-link').click(function() {
  let tab = $(this).attr("tab"); 

  item.each(function(){
    if ($(this).hasClass(tab)) {
      $(this).fadeIn(100)
    } else {
      $(this).fadeOut(0)
    }
  })

});

// tabSelectAddTasks.click(function(event) {
//   cTab.attr('hidden', '');
//   cTabSelect.attr('class', 'div-tabSelect')
//   tabAddTasks.removeAttr('hidden');
//   tabSelectAddTasks.attr('class', 'div-tabSelect div-tabSelect-current');
//   cTab = tabAddTasks;
//   cTabSelect = tabSelectAddTasks;
// })

// tabSelectBruteforce.click(function(event) {
//   cTab.attr('hidden', '');
//   cTabSelect.attr('class', 'div-tabSelect')
//   tabBruteforce.removeAttr('hidden');
//   tabSelectBruteforce.attr('class', 'div-tabSelect div-tabSelect-current');
//   cTab = tabBruteforce;
//   cTabSelect = tabSelectBruteforce;
// })

// tabSelectCart.click(function(event) {
//   cTab.attr('hidden', '');
//   cTabSelect.attr('class', 'div-tabSelect')
//   tabCart.removeAttr('hidden');
//   tabSelectCart.attr('class', 'div-tabSelect div-tabSelect-current');
//   cTab = tabCart;
//   cTabSelect = tabSelectCart;
// })

// tabSelectSettings.click(function(event) {
//   cTab.attr('hidden', '');
//   cTabSelect.attr('class', 'div-tabSelect')
//   tabSettings.removeAttr('hidden');
//   tabSelectSettings.attr('class', 'div-tabSelect div-tabSelect-current');
//   cTab = tabSettings;
//   cTabSelect = tabSelectSettings;
// })

// tabSelectPayment.click(function(event) {
//   cTab.attr('hidden', '');
//   cTabSelect.attr('class', 'div-tabSelect')
//   tabPayment.removeAttr('hidden');
//   tabSelectPayment.attr('class', 'div-tabSelect div-tabSelect-current');
//   cTab = tabPayment;
//   cTabSelect = tabSelectPayment;
// })

dropDownRegion.change(function(event) {
  let newVal = dropDownRegion.find(":selected").attr('value');
  switch(newVal) {
    case 'US':
      divUS.removeAttr('hidden');
      divUK.attr('hidden', '');
      break;
    case 'UK':
      divUK.removeAttr('hidden');
      divUS.attr('hidden', '');
      break;
  }
})

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

/* New Bruteforce Task */
addBruteforce.click(function(event) {
  let proxyList = proxies.val().split('\n');
  let tppInt = parseInt(tpp.val());
  for (let i = 0;i < tppInt; i++) {
    for (let p = 0; p < proxyList.length; p++) {
      if (!proxyList[p] == '') {
        let taskId = bruteforceIndex++;
        let tr = $(document.createElement('tr'));
        tr.attr('class', 'js-task' + taskId);
        let id = $(document.createElement('td'));
        id.attr('class', 'js-id')
        id.text(taskId);
        let status = $(document.createElement('td'));
        status.attr('class', 'js-status');
        status.text('Initializing');
        let proxy = $(document.createElement('td'));
        proxy.attr('class', 'js-proxy');
        proxy.text(proxyList[p]);
        let actions = $(document.createElement('td'));
        actions.attr('class', 'js-actions btn-group');

        let copyCookies = $(document.createElement('button'));
        copyCookies.attr("type", "button");
        copyCookies.attr("class", "left action js-copyCookies btn btn-default btn-sm");
        copyCookies.attr('disabled', '');
        copyCookies.text('Copy Cookies');
        copyCookies.click(function() {
          ipcRenderer.send('bruteforceTask' + taskId + 'CopyCookies', '');
        })

        let copyHtml = $(document.createElement('button'));
        copyHtml.attr("type", "button");
        copyHtml.attr("class", "mid action js-copyHtml btn btn-default btn-sm");
        copyHtml.attr('disabled', '');
        copyHtml.text('Copy HTML');
        copyHtml.click(function() {
          ipcRenderer.send('bruteforceTask' + taskId + 'CopyHtml', '');
        })

        let showHide = $(document.createElement('button'));
        showHide.attr("type", "button");
        showHide.attr("class", "mid action js-showHide btn btn-default btn-sm");
        showHide.attr('disabled', '');
        showHide.text('Show/Hide');
        showHide.click(function() {
          ipcRenderer.send('bruteforceTask' + taskId + 'showHide', '');
        })

        let fillAtc = $(document.createElement('button'));
        fillAtc.attr("type", "button");
        fillAtc.attr("class", "right action js-fillAtc btn btn-default btn-sm");
        fillAtc.attr('disabled', '');
        fillAtc.text('Fill ATC');
        fillAtc.click(function() {
          ipcRenderer.send('bruteforceTask' + taskId + 'FillAtc', {});
        })

        actions.append(copyCookies);
        actions.append(copyHtml);
        actions.append(showHide);
        actions.append(fillAtc);

        tr.append(id);
        tr.append(status);
        tr.append(proxy);
        tr.append(actions);

        bruteforceTasks.append(tr);

        ipcRenderer.on('bruteforceTask' + taskId + 'SetStatus', (event, data) => {
            status.text(data);
        })

        ipcRenderer.on('bruteforceTask' + taskId + 'SetColor', (event, data) => {
            tr.css('background', data);
        })

        ipcRenderer.on('bruteforceTask' + taskId + 'EnableButton', (event, data) => {
            let button;
            switch(data) {
                case 'copyCookies':
                  button = copyCookies;
                  break;
                case 'copyHtml':
                  button = copyHtml;
                  break;
                case 'fillAtc':
                  button = fillAtc;
                  break;
                case 'showHide':
                  button = showHide;
                  break;
                default:
                  console.log(data);
                  button = undefined;
                  break;
            }
            if (typeof button != undefined && button.attr('disabled')) {
                button.removeAttr('disabled');
            }
        })

        ipcRenderer.send('newBruteforceTask', {
            id: taskId,
            proxy: proxyList[p],
            splashUrl: splashUrlBruteforce.val(),
            sku: skuBruteforce.val()
        });
      }
    }
  }
})

/* New Card Task */
addCart.click(function(event) {
  if (proxyCart.val() !== '') {
    for (let i = 0; i < parseInt(tasks.val()); i++) {
      let taskId = cartIndex++;
      let ranSize = sizes.val().random();
      let tr = $(document.createElement('tr'));
      tr.attr('class', 'js-task' + taskId);
      let id = $(document.createElement('td'));
      id.attr('class', 'js-id')
      id.text(taskId);
      let region = $(document.createElement('td'));
      region.attr('class', 'js-region');
      region.text(regionCart.val());
      let size = $(document.createElement('td'));
      size.attr('class', 'js-size');
      size.text(ranSize);
      let status = $(document.createElement('td'));
      status.attr('class', 'js-status');
      status.text('Initializing');
      let proxy = $(document.createElement('td'));
      proxy.attr('class', 'js-proxy');
      proxy.text(proxyCart.val());
      let actions = $(document.createElement('td'));
      actions.attr('class', 'js-actions btn-group');

      let copyCookies = $(document.createElement('button'));
      copyCookies.attr("type", "button");
      copyCookies.attr("class", "left action js-copyCookies btn btn-default btn-sm");
      copyCookies.attr('disabled', '');
      copyCookies.text('Copy Cookies');
      copyCookies.click(function() {
        ipcRenderer.send('cartTask' + taskId + 'CopyCookies', '');
      })

      let openBrowser = $(document.createElement('button'));
      openBrowser.attr("type", "button");
      openBrowser.attr("class", "mid action js-openBrowser btn btn-default btn-sm");
      openBrowser.attr('disabled', '');
      openBrowser.text('Open Browser');
      openBrowser.click(function() {
        ipcRenderer.send('cartTask' + taskId + 'OpenBrowser', '');
      })

      actions.append(copyCookies);
      actions.append(openBrowser);

      tr.append(id);
      tr.append(region);
      tr.append(size);
      tr.append(status);
      tr.append(proxy);
      tr.append(actions);

      cartTasks.append(tr);

      ipcRenderer.on('cartTask' + taskId + 'SetStatus', (event, data) => {
          status.text(data);
      })

      ipcRenderer.on('cartTask' + taskId + 'SetColor', (event, data) => {
          tr.css('background', data);
      })

      ipcRenderer.on('cartTask' + taskId + 'EnableButton', (event, data) => {
          let button;
          switch(data) {
              case 'copyCookies':
                  button = copyCookies;
                  break;
              case 'openBrowser':
                  button = openBrowser;
                  break;
              default:
                  break;
          }
          if (typeof button != undefined && button.attr('disabled') !== typeof undefined) {
              button.removeAttr('disabled');
          }
      })

      ipcRenderer.send('newCartTask', {
          id: taskId,
          proxy: proxyCart.val(),
          url: splashUrlCart.val(),
          sku: skuCart.val(),
          cookies: JSON.parse(cookies.val()),
          size: ranSize,
          region: regionCart.val()
      });
    }
  }
})

/* Harvester Started */
startHarvester.click(function(event) {
  ipcRenderer.send('startHarvester', {
    region: regionHarvester.val(),
    threads: threads.val()
  })
  startHarvester.attr('disabled', '');
  stopHarvester.removeAttr('disabled');
})

/* Harvester Stopped */
stopHarvester.click(function(event) {
  ipcRenderer.send('stopHarvester', {});
  startHarvester.removeAttr('disabled');
  stopHarvester.attr('disabled', '');
})

/* Remove All Bruteforce Tasks */
removeAllBruteTasks.click(function(event) {
  ipcRenderer.send('removeAllBruteTasks', {});
  document.reload();
})

/* Remove All Cart Tasks */
removeAllCartTasks.click(function(event) {
  ipcRenderer.send('removeAllCartTask', {});
  document.reload();
})

/* Save Settings */
saveSettings.click(function(event) {
  ipcRenderer.send('saveSettings', {
    apiKeys:      apiKeys.val().split('\n').clean(''),
    gCookies:     JSON.parseNoErr(gCookies.val()),
    userAgent:    userAgent.val(),
    hmacName:     hmacName.val(),
    sitekeyUS:    sitekeyUS.val(),
    sitekeyUK:    sitekeyUK.val(),
    clientIdUS:   clientIdUS.val(),
    clientIdUK:   clientIdUK.val(),
    capdupUS:     capdupUS.val(),
    capdupUK:     capdupUK.val(),
    activeTheme:  activeTheme
  });
})

/* Fill Atc */
ipcRenderer.on('fillAtc', function(event, data) {
  proxyCart.val(data.proxy);
  splashUrlCart.val(data.splashUrl);
  skuCart.val(data.sku);
  cookies.val(data.cookies);
  tabSelectAddTasks.click();
})

/* Setup UI */
ipcRenderer.on('setupUi', function(event, data) {
  let apiKeysStr = '';
  for (var i = 0; i < data.apiKeys.length; i++) {
    apiKeysStr += data.apiKeys[i] + '\n';
  }
  apiKeys.val(apiKeysStr);
  gCookies.val(JSON.stringify(data.gCookies));
  hmacName.val(data.hmacName);
  userAgent.val(data.userAgent);
  sitekeyUS.val(data.sitekeyUS);
  sitekeyUK.val(data.sitekeyUK);
  clientIdUS.val(data.clientIdUS);
  clientIdUK.val(data.clientIdUK);
  capdupUS.val(data.capdupUS);
  capdupUK.val(data.capdupUK);
})

ipcRenderer.send('setupUi', {});

ipcRenderer.on('copy', function(event, data) {
  copyToClipboard(data);
})

String.prototype.replaceAll = function(search, replacement) {
    var target = this;
    return target.replace(new RegExp(search, 'g'), replacement);
};

Array.prototype.clean = function(deleteValue) {
  for (var i = 0; i < this.length; i++) {
    if (this[i] == deleteValue) {
      this.splice(i, 1);
      i--;
    }
  }
  return this;
};

Array.prototype.random = function() {
  return this[Math.floor(Math.random() *this.length)];
}

JSON.parseNoErr = function (str) {
  try {
    let parsed = this.parse(str);
    return parsed;
  }
  catch (e) {
    return [];
  }
};

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
