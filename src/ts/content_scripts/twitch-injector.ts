import { isVod, parseMessageElement } from '../twitch-parser';
import { nodeIsElement } from '../utils';
import { getFrameInfoAsync, createPopup, isValidFrameInfo } from '../../submodules/chat/src/ts/chat-utils';

const liveChatSelector = '.chat-room .chat-scrollable-area__message-container';
const vodChatSelector = '.video-chat .video-chat__message-list-wrapper ul';

const clients: chrome.runtime.Port[] = [];

function registerClient(port: chrome.runtime.Port): void {
  if (clients.some((client) => client.name === port.name)) {
    console.debug('Client already registered', { port, clients });
    return;
  }

  port.onDisconnect.addListener(() => {
    const i = clients.findIndex((clientPort) => clientPort.name === port.name);
    if (i < 0) {
      console.error('Failed to unregister client', { port, clients });
      return;
    }
    clients.splice(i, 1);
    console.debug('Unregister client successful', { port, clients });
  });

  clients.push(port);
}

function createButton(text: string, callback: () => void): HTMLButtonElement {
  const b = document.createElement('button');
  b.innerText = text;
  b.style.flexGrow = '1';
  b.style.textAlign = 'center';
  b.addEventListener('click', callback);
  return b;
}

function injectLtlButtons(frameInfo: Chat.FrameInfo): void {
  const chat = document.querySelector(isVod() ? '.video-chat' : '.stream-chat');
  if (chat == null) {
    console.error('Could not find chat');
    return;
  }

  const wrapper = document.createElement('div');
  wrapper.id = 'ltl-wrapper';
  wrapper.style.display = 'flex';
  wrapper.style.flexDirection = 'row';

  const params = new URLSearchParams();
  params.set('tabid', frameInfo.tabId.toString());
  params.set('frameid', frameInfo.frameId.toString());
  params.set('twitchPath', window.location.pathname);
  params.set('title', document.title);
  const url = chrome.runtime.getURL(`popout.html?${params.toString()}`);

  const popoutButton = createButton('TL Popout', () => createPopup(url));
  const embedButton = createButton('Embed TLs', () => {
    const iframe = document.createElement('iframe');
    iframe.src = url;
    iframe.style.width = '100%';
    iframe.style.height = '70%';
    wrapper.style.display = 'none';
    chat.appendChild(iframe);
  });

  wrapper.appendChild(popoutButton);
  wrapper.appendChild(embedButton);
  chat.append(wrapper);
}

function load(): void {
  if (document.getElementById('ltl-wrapper') != null) return;

  const messageContainer = document.querySelector(isVod() ? vodChatSelector : liveChatSelector);
  // console.debug({ messageContainer });
  if (messageContainer == null) return;

  const observer = new MutationObserver((mutationRecords) => {
    mutationRecords.forEach((record) => {
      const added = record.addedNodes;
      if (added.length < 1) return;
      added.forEach((node) => {
        if (!nodeIsElement(node)) return;
        const message = parseMessageElement(node);
        if (message == null) return;
        console.debug({ message });
        clients.forEach((client) => client.postMessage({ type: 'message', message }));
      });
    });
  });

  chrome.runtime.onConnect.addListener((port) => {
    port.onMessage.addListener((message) => {
      switch (message.type) {
        case 'registerClient':
          registerClient(port);
          break;
        default:
          console.error('Unknown message type', port, message);
          break;
      }
    });
  });

  observer.observe(messageContainer, { childList: true });

  getFrameInfoAsync()
    .then((frameInfo) => {
      if (!isValidFrameInfo(frameInfo)) {
        console.error('Invalid frame info', frameInfo);
        return;
      }
      injectLtlButtons(frameInfo);
    })
    .catch((e) => console.error(e));
}

/**
 * Recursive setTimeout to keep injecting whenever chat unloads/reloads when
 * navigating thru the site.
 */
function keepLoaded(): void {
  setTimeout(() => {
    load();
    keepLoaded();
  }, 3000);
}

keepLoaded();
