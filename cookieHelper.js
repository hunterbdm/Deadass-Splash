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

function fixCookies(cookies) {
  for (var i = 0; i < cookies.length; i++) {
    if(Object.keys(cookies[i]).indexOf('url') < 0) {
      cookies[i].url = fixDomain(cookies[i].domain);
    }
  }
  return cookies;
}

module.exports = {
    nightmareToRequest: nightmareToRequest,
    fixDomain: fixDomain,
    fixCookies: fixCookies
}