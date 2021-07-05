/* eslint-disable no-undef */
import '../../img/128x128.png';
import '../../img/48x48.png';

window.chrome.browserAction.onClicked.addListener(() => {
  window.chrome.tabs.create({ url: 'https://livetl.app' });
});

window.chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason != 'update')
    window.chrome.tabs.create({ url: window.chrome.runtime.getURL('welcome.html') });
});

window.chrome.runtime.onMessage.addListener((request, sender, callback) => {
  switch (request.type) {
  case 'tabid': {
    callback(sender.frameId || sender.tab.id);
    break;
  } case 'message': {
    try {
      window.chrome.tabs.query({
        url: [
          'https://www.youtube.com/live_chat*',
          'https://www.youtube.com/live_chat_replay*'
        ]
      }, (tabs) => {
        tabs.forEach(tab => {
          window.chrome.tabs.sendMessage(tab.id, request.data);
        });
      });
    // eslint-disable-next-line no-empty
    } catch (e) { }
    break;
  } case 'window': {
    (window.browser || window.chrome).windows.create({
      url: request.url,
      type: 'popup',
      height: 300,
      width: 600
    });
  }
    // can't break here, callback breaks
  }
});

const stripHeaders = (headers)=> {
  return headers.filter(header => {
    let headerName = header.name.toLowerCase();
    return !(headerName === 'content-security-policy'
      || headerName === 'x-frame-options');
  });
};

window.chrome.webRequest.onHeadersReceived.addListener(
  details => {
    return {
      responseHeaders: stripHeaders(details.responseHeaders)
    };
  }, {
    urls: [
      '<all_urls>'
    ]
  }, ['blocking', 'responseHeaders']);
