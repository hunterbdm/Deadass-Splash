const electron = require('electron');
const {app, BrowserWindow} = electron;
const ipcMain = electron.ipcMain
const Nightmare = require('nightmare');
const electronPath = require('./node_modules/electron');
const request = require('request').defaults({gzip: true});
const fs = require('fs');
const cheerio = require('cheerio')

const userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/61.0.3128.0 Safari/537.36';
const sizeIds = {
    '4.5': '_540',
    '5': '_550',
    '5.5': '_560',
    '6': '_570',
    '6.5': '_580',
    '7': '_590',
    '7.5': '_600',
    '8': '_610',
    '8.5': '_620',
    '9': '_630',
    '9.5': '_640',
    '10': '_650',
    '10.5': '_660',
    '11': '_670',
    '11.5': '_680',
    '12': '_690',
    '12.5': '_700',
    '13': '_710',
    '14': '_730',
    '15': '_750',
}

let mainWin;

let settings = {};
let profiles = {};
let profilesUS = {};
let profilesUK = {};

let loadingTasks = 0;

let captchas = [];

function init() {
  app.on('ready', function() {
    mainWin = new BrowserWindow({width:1300, height:700, icon: __dirname + '/img/favicon.png', showDevTools: true});
    mainWin.loadURL('file://' + __dirname +'/index.html');
    //mainWin.setMenu(null);
    mainWin.addListener('closed', function() {
      app.exit();
      process.exit(1);
    })
  });
}

function nightmareToRequest(cookies, cookieJar) {
  for (var c = 0; c < cookies.length; c++) {
    let cookie = cookies[c];
    if (!cookie)
      continue;
    //mainWin.webContents.send('copy' , cookie.domain);
    let cString = cookie.name + '=' + cookie.value + '; ';
    if (cookie.domain)
      cString += 'Domain=' + cookie.domain + '; ';
    if (cookie.expirationDate)
      cString += 'Expires=' + new Date( cookie.expirationDate * 1000) + '; ';
    if (cookie.path)
      cString += 'Path=' + cookie.path + '; ';
    if (cookie.httpOnly)
      cString += 'HttpOnly'

    //mainWin.webContents.send('copy' , cString);

    if(cookie.domain.startsWith('www')) {
      cookie.domain = 'http://' + cookie.domain;
    }
    else if(cookie.domain.startsWith('.')) {
      cookie.domain = 'http://www' + cookie.domain;
    }
    else {
      cookie.domain = 'http://' + cookie.domain;
    }

    cookieJar.setCookie(request.cookie(cString), cookie.domain);
  }
}

function getCaptcha(apikey, sitekey, url, callback) {
  //mainWin.webContents.send('copy' , apikey + ' ' + sitekey + ' ' + url);
  request({
    method: 'post',
    url: 'http://2captcha.com/in.php',
    qs: {
      'key': apikey,
      'method': 'userrecaptcha',
      'googlekey': sitekey,
      'proxy': 'localhost',
      'proxytype': 'HTTP',
      'pageurl': url,
      'json': 1
    },
    followAllRedirects: true
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
                  if (err)
                    return;
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

function fixDomain(domain) {
  if(domain.startsWith('www')) {
    return 'http://' + domain;
  }
  else if(domain.startsWith('.')) {
    return 'http://www' + domain;
  }
  else {
    return 'http://' + domain;
  }
}

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

/* Load Settings */
ipcMain.on('setupUi', function(event) {
  fs.readFile( __dirname + '/settings.json', (err, data) => {
    settings = JSON.parse(data);
    mainWin.webContents.send('setupUi', JSON.parse(data));
  });
  fs.readFile( __dirname + '/billing.json', (err, data) => {
    profiles = JSON.parse(data);
    for (p in profiles) {
      switch(profiles[p].country) {
        case 'US':
          profilesUS[p] = profiles[p];
          break;
        case 'UK':
          profilesUK[p] = profiles[p];
      }
    }
  });
})

/* Save Settings */
ipcMain.on('saveSettings', function(event, data) {
  settings = data;
  fs.writeFile(__dirname + '/settings.json', JSON.stringify(data));
})

/* Save Billing Profile */
ipcMain.on('saveProfile', function(event, data) {
  let profile = {
    firstName: data.firstName,
    lastName: data.lastName,
    address1: data.address1,
    address2: data.address2,
    city: data.city,
    zip: data.zip,
    country: data.country,
    state: data.state,
    phone: data.phone,
    email: data.email,
    cardName: data.cardName,
    cardNumber: data.cardNumber,
    cvv: data.cvv,
    expiresMonth: data.expiresMonth,
    expiresYear: data.expiresYear,
    giftCards: data.giftCards
  }

  profiles[data.profileName] = profile;

  switch(data.country) {
    case 'US':
      profilesUS[data.profileName] = profile;
      break;
    case 'UK':
      profilesUK[data.profileName] = profile;
  }

  if (settings.profiles.indexOf(data.profileName) < 0)
    settings.profiles.push(data.profileName);
  fs.writeFile(__dirname + '/billing.json', JSON.stringify(profiles));
  fs.writeFile(__dirname + '/settings.json', JSON.stringify(settings));
})

/* Remove Billing Profile */
ipcMain.on('removeProfile', function(event, data) {
  if (data in profiles) {
    delete profiles[data];
    settings.profiles.splice(settings.profiles.indexOf(data), 1);
    if (data in profilesUS)
      delete profilesUS[data];
    else if(data in profilesUK)
      delete profilesUK[data];
    fs.writeFile(__dirname + '/billing.json', JSON.stringify(profiles));
    fs.writeFile(__dirname + '/settings.json', JSON.stringify(settings));
  }
})

/* Load Billing Profile */
ipcMain.on('requestProfile', function(event, data) {
  mainWin.webContents.send(data + 'profileData', profiles[data]);
})

/* New Bruteforce Task */
ipcMain.on('newBruteforceTask', function(event, data) {
  new BruteforceTask(data.id, data.proxy, data.splashUrl, data.sku);
})

/* New Cart Task */
ipcMain.on('newCartTask', function(event, data) {
  new CartTask(data.id, data.proxy, data.splashUrl, data.sku, data.cookies, data.size, data.region);
})

/* Start Harvester */
ipcMain.on('startHarvester', function(event, data) {
  let i = setInterval(() => {
    for (var i = 0; i < data.threads; i++) {
      let sitekey;
      let url;
      switch(data.region) {
        case 'US':
          sitekey = settings.sitekeyUS;
          url = 'http://www.adidas.com';
          break;
        case 'UK':
          sitekey = settings.sitekeyUK;
          url = 'http://www.adidas.co.uk';
          break;
        default:
          sitekey = settings.sitekeyUS;
          url = 'http://www.adidas.com';
          break;
      }
      getCaptcha(settings.apiKeys.random(), sitekey, url, (captchaRes) => {
        captchas.push(captchaRes);
        setTimeout(() => {
          if (captchas.indexOf(captchaRes) > 0) {
            captchas.splice(captchas.indexOf(captchaRes), 1);
          }
        }, 115000);
      })
    }
  }, 15000);
  ipcMain.once('stopHarvester', function(event, data) {
    clearInterval(i);
  })
})

class BruteforceTask {
  constructor(id, proxy, splashUrl, sku) {
    this.id = id;
    this.proxy = proxy;
    this.splashUrl = splashUrl;
    this.sku = sku;
    this.status = '';
    this.showing = false;

    this.setStatus('Idle');
    let waitToStart = () => {
      if(loadingTasks >  10)
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
    /* Setup proxy */
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

    /* Setup task specific eventListeners */

    /* Copy HTML action listener */
    ipcMain.on('bruteforceTask' + this.id + 'CopyHtml', (event, data) => {
      this.getHtml(function(html) {
        mainWin.webContents.send('copy' , html);
      })
    })

    /* Copy cookie action listener */
    ipcMain.on('bruteforceTask' + this.id + 'CopyCookies', (event, data) => {
      this.getCookies(function(cookies) {
        mainWin.webContents.send('copy' , JSON.stringify(cookies));
      })
    })

    /* Fill ATC action listener */
    ipcMain.on('bruteforceTask' + this.id + 'FillAtc', (event, data) => {
      this.fillAtc();
    })

    /* Show/hide action listener */
    ipcMain.on('bruteforceTask' + this.id + 'showHide', (event, data) => {
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
    /* Decrement LoadingTasks after 30 seconds if this one has not finished loading. */
    setTimeout(() => {
      if(!doneLoading) {
        this.setStatus('Timed Out');
        loadingTasks--;
        doneLoading = true;
        //this.end();
      }
    }, 30000);
    this.setStatus('Loading')

    this.nightmare
      .useragent(userAgent)
      .goto(this.splashUrl)
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
            //if (pageSource.includes('data-sitekey')) {
            if (true) {
              this.setStatus('Through Queue');
              this.setColor('green');
              this.enableButton('fillAtc');
            }
            else
              setTimeout(checkForSitekey, 20000);
          });
        }
        checkForSitekey();
      })
      .catch((err) => {
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
    mainWin.webContents.send('bruteforceTask' + this.id + 'SetStatus' , status);
  }

  setColor(color) {
    mainWin.webContents.send('bruteforceTask' + this.id + 'SetColor' , color);
  }

  enableButton(buttonName) {
    mainWin.webContents.send('bruteforceTask' + this.id + 'EnableButton', buttonName);
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

  fillAtc() {
    this.getCookies((cookies) => {
      mainWin.webContents.send('fillAtc', {
        proxy: this.proxy,
        splashUrl: this.splashUrl,
        sku: this.sku,
        cookies: JSON.stringify(cookies)
      });
    })
  }
}

class CartTask {
  constructor(id, proxy, splashUrl, sku, cookies, size, region) {
    this.id = id;
    this.proxy = proxy;
    this.splashUrl = splashUrl;
    this.sku = sku;
    this.cookies = cookies;
    this.size = size;
    this.region = region;

    this.status = '';
    this.cookieJar = request.jar();

    this.init(() => {
      switch(this.region) {
        case 'US':
          this.startUS();
          break;
        case 'UK':
          this.startUK();
          break;
        default:
          this.setStatus('Invalid Region');
          break;
      }
    })
  }

  init(callback=undefined) {
      this.setStatus('Initilizing');
      /* Setup proxy */
      if(this.proxy != 'localhost') {
          const proxySplit = this.proxy.split(':');
          if(proxySplit.length > 3)
              this.proxyFormatted = "http://" + proxySplit[2] + ":" + proxySplit[3] + "@" + proxySplit[0] + ":" + proxySplit[1]
          else
              this.proxyFormatted = "http://" + proxySplit[0] + ":" + proxySplit[1]

      }
      else
          this.proxyFormatted = 'http://localhost';

      /* Copy cookie action listener */
      ipcMain.on('cartTask' + this.id + 'CopyCookies', (event, data) => {
          this.getCookies(function(cookies) {
              mainWin.webContents.send('copy' , JSON.stringify(cookies));
          })
      })

      /* Open In Browser */
      ipcMain.on('cartTask' + this.id + 'OpenBrowser', (event, data) => {
        switch(this.region) {
          case 'US':
            this.openBrowserUS();
            break;
          case 'UK':
            this.openBrowserUK();
            break;
        }
      })

      if(callback) {
          callback();
      }
  }

  startUS() {
    let setCookies = () => {
      /* These cookies define a cart session, and we don't want to transfer cart cookies, only cookies such as hmac */
      const noTransferCookies = [
        'dwsecuretoken_e23325cdedf446c9a41915343e601cde',
        'restoreBasketUrl',
        'RES_SESSIONID',
        'RES_TRACKINGID',
        'sid',
        'dwsid',
        'dm_mi',
        'RT',
        'ak_bmsc',
        'dwac_bcl5MiaaieF4EaaadeoW6TIGjI',
        'dwanonymous_e23325cdedf446c9a41915343e601cde'
      ]
      this.setStatus('Setting Cookies');
      let cookiesToAdd = [];
      for (var i = 0; i < this.cookies.length; i++) {
        if(noTransferCookies.indexOf(this.cookies[i].name) < 0)
          cookiesToAdd.push(this.cookies[i]);
      }
      nightmareToRequest(cookiesToAdd, this.cookieJar);
      atc()
    }

    function waitForCaptcha(callback) {
      if (captchas.length > 1)
        callback(captchas.pop());
      else
        setTimeout(() => {
          waitForCaptcha(callback)
        }, 250)
    }

    let atc = () => {
      this.setStatus('Getting Captcha');
      waitForCaptcha((captchaRes) => {
        this.setStatus('Attempting Atc');
        let sizeSku = this.sku + sizeIds[this.size];
        let formJson = settings['formJsonUS'];
        formJson = formJson.replace('{$sku}', this.sku);
        formJson = formJson.replace('{$captcha}', captchaRes);
        formJson = formJson.replace('{$sizeSku}', sizeSku);
        formJson = JSON.parse(formJson);
        //mainWin.webContents.send('copy' , formJson['action']);
        /* ATC */
        request({
          method: 'post',
          url: formJson['action'],
          jar: this.cookieJar,
          proxy: this.proxy == 'localhost' ? undefined : this.proxyFormatted,
          headers: {
              'Accept': '*/*',
              'Accept-Encoding': 'gzip, deflate',
              'Accept-Language': 'en-US,en;q=0.8',
              'Connection': 'keep-alive',
              'Content-Type' :'application/x-www-form-urlencoded; charset=UTF-8',
              'User-Agent': userAgent,
              'X-Requested-With': 'XMLHttpRequest'
          },
          qs: formJson.form_data,
          followAllRedirects: true
        }, (err, resp, body) => {
          if(err) {
              this.setStatus('ATC Failed: ' + err);
              this.setColor('red');
          }
          else if(resp.statusCode != 200) {
              this.setStatus('ATC Failed: ' + resp.statusCode);
              this.setColor('red');
          }
          else {
            /* Check Cart */
            this.setStatus('Checking Cart');
            this.enableButton('copyCookies');
            this.enableButton('openBrowser');

            request({
              method: 'get',
              url: 'http://www.adidas.com/on/demandware.store/Sites-adidas-US-Site/en_US/Cart-ProductCount',
              jar: this.cookieJar,
              proxy: this.proxy == 'localhost' ? undefined : this.proxyFormatted,
              headers: {
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
                'Accept-Encoding': 'gzip, deflate',
                'Accept-Language': 'en-US,en;q=0.8',
                'Connection': 'keep-alive',
                'Upgrade-Insecure-Requests': '1',
                'User-Agent': userAgent
              }
            }, (err, resp, body) => {
              if(err) {
                this.setStatus('Cart Check Failed: ' + err);
              }
              else if(resp.statusCode != 200) {
                this.setStatus('Cart Check Failed: ' + resp.statusCode);
              }
              else {
                body = body.replace(/\s+/g, " ").trim();
                body = body.replace('"', '').replace('"', '');
                if(body == '1') {
                  this.setStatus('ATC Success');
                  this.setColor('green');
                  /* Disabled For Now */
                  //checkout();
                }
                else {
                  this.setStatus('ATC Failed');
                  this.setColor('red');
                }
              }
            })
          }
        })
      })
    }

    let checkout = () => {
      if (Object.keys(profilesUS).length > 0) {
        let profile = profilesUS[Object.keys(profilesUS)[0]];
        delete profilesUS[Object.keys(profilesUS)[0]];

        this.setStatus('Starting Checkout');

        request({
          method: 'get',
          url: 'https://www.adidas.com/us/delivery-start',
          jar: this.cookieJar,
          proxy: this.proxy == 'localhost' ? undefined : this.proxyFormatted,
          headers: {
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
          	'Accept-Encoding': 'gzip, deflate, br',
          	'Accept-Language': 'en-US,en;q=0.8',
          	'Connection': 'keep-alive',
          	'Host': 'www.adidas.com',
          	'Referer': 'https://www.adidas.com/on/demandware.store/Sites-adidas-US-Site/en_US/Cart-Show',
          	'Upgrade-Insecure-Requests': '1',
          	'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/61.0.3128.0 Safari/537.36'
          }
        }, (err, resp, body) => {
          if (err) {
            this.setStatus('Checkout Failed ' + err.toString())
          }
          else if (resp.statusCode !== 200) {
            this.setStatus('Checkout Failed ' + resp.statusCode)
          }
          else {
            let $ = cheerio.load(body);
            this.setStatus('Sending Shipping Data');

            request({
              method: 'post',
              url: $('#dwfrm_delivery').attr('action'),
              jar: this.cookieJar,
              proxy: this.proxy == 'localhost' ? undefined : this.proxyFormatted,
              headers: {
                'Accept': 'text/html, */*; q=0.01',
                'Accept-Encoding': 'gzip, deflate, br',
                'Accept-Language': 'en-US,en;q=0.8',
                'Connection': 'keep-alive',
                'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                'Host': 'www.adidas.com',
                'Origin': 'https://www.adidas.com',
                'Referer': 'https://www.adidas.com/us/delivery-start',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/61.0.3128.0 Safari/537.36',
                'X-Requested-With': 'XMLHttpRequest'
              },
              formData: {
                'dwfrm_delivery_shippingOriginalAddress' : $('#dwfrm_delivery_shippingOriginalAddress').attr('value'),
                'dwfrm_delivery_shippingSuggestedAddress' : $('#dwfrm_delivery_shippingSuggestedAddress').attr('value'),
                'dwfrm_delivery_singleshipping_shippingAddress_isedited' : $('#dwfrm_delivery_singleshipping_shippingAddress_isedited').attr('value'),
                'dwfrm_delivery_singleshipping_shippingAddress_addressFields_firstName': profile.firstName,
              	'dwfrm_delivery_singleshipping_shippingAddress_addressFields_lastName': profile.lastName,
              	'dwfrm_delivery_singleshipping_shippingAddress_addressFields_address1': profile.address1,
              	'dwfrm_delivery_singleshipping_shippingAddress_addressFields_address2': profile.address2,
              	'dwfrm_delivery_singleshipping_shippingAddress_addressFields_city': profile.city,
              	'dwfrm_delivery_singleshipping_shippingAddress_addressFields_countyProvince': profile.state,
              	'state[]': '',
              	'state[]': '',
              	'dwfrm_delivery_singleshipping_shippingAddress_addressFields_zip': profile.zip,
              	'dwfrm_delivery_singleshipping_shippingAddress_addressFields_phone': profile.phone,
              	'dwfrm_delivery_singleshipping_shippingAddress_useAsBillingAddress': 'true',
                'dwfrm_delivery_securekey': $('[name="dwfrm_delivery_securekey"]').attr('value'),
                'dwfrm_delivery_billingOriginalAddress': 'false',
                'dwfrm_delivery_billingSuggestedAddress': 'false',
                'dwfrm_delivery_billing_billingAddress_isedited': 'false',
                'dwfrm_delivery_billing_billingAddress_addressFields_country': profile.country,
                'dwfrm_delivery_billing_billingAddress_addressFields_firstName': profile.firstName,
                'dwfrm_delivery_billing_billingAddress_addressFields_lastName': profile.lastName,
                'dwfrm_delivery_billing_billingAddress_addressFields_address1': profile.address1,
                'dwfrm_delivery_billing_billingAddress_addressFields_address2': profile.address2,
                'dwfrm_delivery_billing_billingAddress_addressFields_city': profile.city,
                'dwfrm_delivery_billing_billingAddress_addressFields_countyProvince': profile.state,
                'dwfrm_delivery_billing_billingAddress_addressFields_zip': profile.zip,
                'dwfrm_delivery_billing_billingAddress_addressFields_phone': profile.phone,
                'dwfrm_delivery_singleshipping_shippingAddress_email_emailAddress': profile.email,
                'signup_source': $('[name="signup_source"]').attr('value'),
                'dwfrm_delivery_singleshipping_shippingAddress_ageConfirmation': 'true',
                'shipping-group-0': $('#shipping-method-0-0').attr('value'),
                'dwfrm_cart_shippingMethodID_0': $('[name="dwfrm_cart_shippingMethodID_0"]').attr('value'),
                'shippingMethodType_0': $('[name="shippingMethodType_0"]').attr('value'),
                'dwfrm_cart_selectShippingMethod': $('#dwfrm_cart_selectShippingMethod').attr('value'),
                'referer': 'Cart-Show',
                'dwfrm_delivery_savedelivery': $('#dwfrm_delivery_savedelivery').attr('value'),
                'format': 'ajax'
              },
              followAllRedirects: true
            }, (err, resp, body) => {
              if (err) {
                this.setStatus('Checkout Failed 2' + err.toString())
              }
              else if (resp.statusCode !== 200) {
                this.setStatus('Checkout Failed 2' + resp.statusCode)
              }
              else {
                request({
                  method: 'get',
                  url: 'https://www.adidas.com/on/demandware.store/Sites-adidas-US-Site/en_US/COSummary-Start',
                  jar: this.cookieJar,
                  proxy: this.proxy == 'localhost' ? undefined : this.proxyFormatted,
                  headers: {
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
                    'Accept-Encoding': 'gzip, deflate, br',
                    'Accept-Language': 'en-US,en;q=0.8',
                    'Connection': 'keep-alive',
                    'Host': 'www.adidas.com',
                    'Referer': 'https://www.adidas.com/us/delivery-start',
                    'Upgrade-Insecure-Requests': '1',
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/61.0.3128.0 Safari/537.36'
                  }
                }, (err, resp, body) => {
                  if (err) {
                    this.setStatus('Checkout Failed 3' + err.toString())
                  }
                  else if (resp.statusCode !== 200) {
                    this.setStatus('Checkout Failed 3' + resp.statusCode)
                  }
                  else {
                    console.log('To payment screen');
                    console.log(resp.request.href)
                    $ = cheerio.load(body);

                    let addGiftCard = (card, first) => {
                      this.setStatus('Adding Gift Card')
                      console.log('Adding Gift Card ' + card);

                      let s = card.split(':');
                      let cardNum = s[0];
                      let cardPin = s[1];

                      let formData = {
                        'dwfrm_payment_svsGiftCards_newGiftcardNumber': cardNum,
                        'dwfrm_payment_svsGiftCards_newGiftcardPin': cardPin,
                        'dwfrm_payment_applygiftcard': 'Apply',
                        'dwfrm_payment_securekey': $('[name="dwfrm_payment_securekey"]').attr('value')
                      }
                      if(!first)
                        formData['dwfrm_payment_svsGiftCards_usegiftcard'] = 'true';

                      request({
                        method: 'post',
                        url: $('#dwfrm_payment_svsGiftCards').attr('action'),
                        jar: this.cookieJar,
                        proxy: this.proxy == 'localhost' ? undefined : this.proxyFormatted,
                        headers: {
                          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
                          'Accept-Encoding': 'gzip, deflate, br',
                          'Accept-Language': 'en-US,en;q=0.8',
                          'Connection': 'keep-alive',
                          'Content-Type': 'application/x-www-form-urlencoded',
                          'Host': 'www.adidas.com',
                          'Origin': 'https://www.adidas.com',
                          'Upgrade-Insecure-Requests': '1',
                          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/61.0.3128.0 Safari/537.36'
                        },
                        formData: formData,
                        followAllRedirects: true
                      }, (err, resp, body) => {
                        if (err) {
                          this.setStatus('Add Gift Card Failed' + err.toString())
                        }
                        else if (resp.statusCode !== 200) {
                          this.setStatus('Add Gift Card Failed' + resp.statusCode)
                        }
                        else {
                          console.log(resp.request.href);
                          $ = cheerio.load(body);
                          if (profile.giftCards.length > 0)
                            addGiftCard(profile.giftCards.pop(), false)
                          else {
                            this.setStatus('Done Adding Cards')
                            checkoutGiftcards();
                          }
                        }
                      })
                    }

                    let checkoutGiftcards = () => {
                      request({
                        method: 'post',
                        url: $('#dwfrm_payment_svsGiftCards').attr('action'),
                        jar: this.cookieJar,
                        proxy: this.proxy == 'localhost' ? undefined : this.proxyFormatted,
                        headers: {
                          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
                          'Accept-Encoding': 'gzip, deflate, br',
                          'Accept-Language': 'en-US,en;q=0.8',
                          'Connection': 'keep-alive',
                          'Content-Type': 'application/x-www-form-urlencoded',
                          'Host': 'www.adidas.com',
                          'Origin': 'https://www.adidas.com',
                          'Upgrade-Insecure-Requests': '1',
                          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/61.0.3128.0 Safari/537.36'
                        },
                        formData: {
                          'dwfrm_payment_svsGiftCards_usegiftcard': 'true',
                          'selectedPaymentMethodID': $('[name="selectedPaymentMethodID"]').attr('value'),
                          'dwfrm_payment_giftcardpayment': '',
                          'dwfrm_payment_securekey': $('[name="dwfrm_payment_securekey"]').attr('value')
                        }
                      }, (err, resp, body) => {
                        if (err) {
                          this.setStatus('Checkout Failed ' + err.toString())
                        }
                        else if (resp.statusCode !== 200) {
                          this.setStatus('Checkout Failed ' + resp.statusCode)
                        }
                        else {
                          this.setStatus('Checkout Complete');
                          this.setColor('orange');
                        }
                      })
                    }

                    if (profile.giftCards.length > 0)
                      addGiftCard(profile.giftCards.pop(), true);
                  }
                })
              }
            })
          }
        })
      }
    }

    setCookies();
  }

  startUK() {
    let setCookies = () => {
      /* These cookies define a cart session, and we don't want to transfer cart cookies, only cookies such as hmac */
      const noTransferCookies = [
        'dwsecuretoken_d6ba5aaa95d9e677ab103d74c76dc070',
        'restoreBasketUrl',
        'RES_SESSIONID',
        'RES_TRACKINGID',
        'sid',
        'dwsid',
        'dm_mi',
        'RT',
        'ak_bmsc',
        'dwac_bd33EiaagZb1waaacXkXlIATa4',
        'dwanonymous_d6ba5aaa95d9e677ab103d74c76dc070'
      ]
      this.setStatus('Setting Cookies');
      let cookiesToAdd = [];
      for (var i = 0; i < this.cookies.length; i++) {
        if(noTransferCookies.indexOf(this.cookies[i].name) < 0)
          cookiesToAdd.push(this.cookies[i]);
      }

      nightmareToRequest(cookiesToAdd, this.cookieJar);
      atc();
    }

    function waitForCaptcha(callback) {
      if (captchas.length > 1)
        callback(captchas.pop());
      else
        setTimeout(() => {
          waitForCaptcha(callback)
        }, 250)
    }

    let atc = () => {
      this.setStatus('Getting Captcha');
      waitForCaptcha((captchaRes) => {
        this.setStatus('Attempting Atc');
        let sizeSku = this.sku + sizeIds[this.size];
        let formJson = settings['formJsonUK'];
        formJson = formJson.replace('{$sku}', this.sku);
        formJson = formJson.replace('{$captcha}', captchaRes);
        formJson = formJson.replace('{$sizeSku}', sizeSku);
        formJson = JSON.parse(formJson);

        /* ATC */
        request({
          method: 'post',
          url: formJson['action'],
          jar: this.cookieJar,
          headers: {
              'Accept': '*/*',
              'Accept-Encoding': 'gzip, deflate',
              'Accept-Language': 'en-US,en;q=0.8',
              'Connection': 'keep-alive',
              'Content-Type' :'application/x-www-form-urlencoded; charset=UTF-8',
              'User-Agent': userAgent,
              'X-Requested-With': 'XMLHttpRequest'
          },
          qs: formJson.form_data,
          followAllRedirects: true
        }, (err, resp, body) => {
          if(err) {
              this.setStatus('ATC Failed: ' + err);
              this.setColor('red');
          }
          else if(resp.statusCode != 200) {
              this.setStatus('ATC Failed: ' + resp.statusCode);
              this.setColor('red');
          }
          else {
            /* Check Cart */
            this.setStatus('Checking Cart');
            this.enableButton('copyCookies');
            this.enableButton('openBrowser');

            request({
              method: 'get',
              url: 'http://www.adidas.co.uk/on/demandware.store/Sites-adidas-GB-Site/en_GB/Cart-ProductCount',
              jar: this.cookieJar,
              headers: {
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
                'Accept-Encoding': 'gzip, deflate',
                'Accept-Language': 'en-US,en;q=0.8',
                'Connection': 'keep-alive',
                'Upgrade-Insecure-Requests': '1',
                'User-Agent': userAgent
              }
            }, (err, resp, body) => {
              if(err) {
                this.setStatus('Cart Check Failed: ' + err);
              }
              else if(resp.statusCode != 200) {
                this.setStatus('Cart Check Failed: ' + resp.statusCode);
              }
              else {
                body = body.replace(/\s+/g, " ").trim();
                body = body.replace('"', '').replace('"', '');
                if(body == '1') {
                  this.setStatus('ATC Success');
                  this.setStatus(body);
                  this.setColor('green');
                }
                else {
                  this.setStatus('ATC Failed');
                  this.setStatus(body);
                  this.setColor('red');
                }
              }
            })
          }
        })
      })
    }

    let checkout = () => {

    }

    setCookies();
  }

  getCookies(callback) {
    let cookiesJson = [];
    for (let domain in this.cookieJar._jar.store.idx) {
        for(let c in this.cookieJar._jar.store.idx[domain]) {
            for(let name in this.cookieJar._jar.store.idx[domain][c]) {
                let cookie = this.cookieJar._jar.store.idx[domain][c][name];
                if (!cookie.key) {
                  mainWin.webContents.send('copy' , cookie.toString());
                  return;
                }

                cookiesJson.push({
                  'name': cookie.key,
                  'value': cookie.value,
                  'domain': cookie.domain,
                  'url': fixDomain(cookie.domain),
                  'expirationDate': cookie.expires ? new Date(cookie.expires).getTime()/1000.0 : 9912726715,
                  'httpOnly': cookie.httpOnly,
                  'path': cookie.path,
                  'secure': cookie.secure
                })
            }
        }
    }
    callback(cookiesJson);
  }

  openBrowserUS() {
    let nightmare;

    if(this.proxy != 'localhost') {
      const proxySplit = this.proxy.split(':');
      nightmare = new Nightmare({
        show: false,
        electronPath: electronPath,
        switches: {
            'proxy-server': proxySplit[0] + ':' + proxySplit[1]
        }
      });
      /* Add Authentication if proxy used user:pass */
      if (proxySplit.length > 2) {
        nightmare.authentication(proxySplit[2], proxySplit[3]);
      }
    }
    else
      nightmare = new Nightmare({
        show: false,
        electronPath: electronPath
      });

    this.getCookies((cookies) => {
      nightmare
        .useragent(userAgent)
        .goto('about:blank')
        .then(() => {
          setTimeout(() => {
            nightmare
              .show()
              .goto('https://www.adidas.com/on/demandware.store/Sites-adidas-US-Site/en_US/Cart-Show')
              .then(function() {})
          }, 1000)
          nightmare
            .cookies.set(cookies)
            .then(function() {})
        })
    })
  }

  openBrowserUK() {
    let nightmare;

    if(this.proxy != 'localhost') {
      const proxySplit = this.proxy.split(':');
      nightmare = new Nightmare({
        show: false,
        electronPath: electronPath,
        switches: {
            'proxy-server': proxySplit[0] + ':' + proxySplit[1]
        }
      });
      /* Add Authentication if proxy used user:pass */
      if (proxySplit.length > 2) {
        nightmare.authentication(proxySplit[2], proxySplit[3]);
      }
    }
    else
      nightmare = new Nightmare({
        show: false,
        electronPath: electronPath
      });

    this.getCookies((cookies) => {
      nightmare
        .useragent(userAgent)
        .goto('about:blank')
        .then(() => {
          setTimeout(() => {
            nightmare
              .show()
              .goto('https://www.adidas.co.uk/on/demandware.store/Sites-adidas-GB-Site/en_GB/Cart-Show')
              .then(function() {})
          }, 1000)
          nightmare
            .cookies.set(cookies)
            .then(function() {})
        })
    })
  }

  setStatus(status) {
      mainWin.webContents.send('cartTask' + this.id + 'SetStatus' , status);
  }

  setColor(color) {
      mainWin.webContents.send('cartTask' + this.id + 'SetColor' , color);
  }

  enableButton(buttonName) {
      mainWin.webContents.send('cartTask' + this.id + 'EnableButton', buttonName);
  }
}

Array.prototype.random = function() {
  return this[Math.floor(Math.random() * this.length)];
}

Array.prototype.clean = function(deleteValue) {
  for (var i = 0; i < this.length; i++) {
    if (this[i] == deleteValue) {
      this.splice(i, 1);
      i--;
    }
  }
  return this;
};
