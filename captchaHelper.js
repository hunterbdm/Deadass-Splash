let captchaResponses = []

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

function startHarvester(apikey, sitekey, url, threads) {
    let i = setInterval(() => {
        for(let c = 0; c < threads; c++) {
            getCaptcha(apikey, sitekey, url, (captchaResponse) => {
                captchaResponses.push(captchaResponse);
                setTimeout(() => {
                    if (captchaResponses.indexOf(captchaResponse) > 0) {
                        captchaResponses.splice(captchaResponses.indexOf(captchaResponse), 1);
                    }
                }, 115000)
            })
        }
    }, 15000)
    return i;
}