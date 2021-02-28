import { getWAR } from './constants.js';

export async function importFontAwesome() {
  document.head.innerHTML += `
    <link 
     rel="stylesheet"
     href="https://cdn.jsdelivr.net/npm/fork-awesome@1.1.7/css/fork-awesome.min.css"
     integrity="sha256-gsmEoJAws/Kd3CjuOQzLie5Q3yshhvmo7YNtBG7aaEY="
     crossorigin="anonymous">
        `;
}

export async function importCSS(url) {
  const frameCSSURL = getWAR(url);
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = await frameCSSURL;
  link.type = 'text/css';
  document.head.appendChild(link);
}

export async function importStyle() {
  return await importCSS('css/frame.css');
}

// module.exports = { importCSS, importFontAwesome, importStyle };
