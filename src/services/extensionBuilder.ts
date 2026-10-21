import JSZip from 'jszip';

export interface ExtensionFile {
  name: string;
  content: string;
  language: string;
}

export function getManifestV3Files(): ExtensionFile[] {
  const manifest = {
    manifest_version: 3,
    name: 'TaskMaster - Voice & Meeting Task AI',
    version: '1.0.0',
    description: 'AI-powered Audio & Meeting Task Management for Chrome Side Panel and Popup.',
    action: {
      default_popup: 'popup.html',
      default_title: 'TaskMaster Quick Capture',
    },
    side_panel: {
      default_path: 'sidepanel.html',
    },
    permissions: [
      'sidePanel',
      'storage',
      'activeTab',
      'scripting',
      'offscreen',
    ],
    host_permissions: [
      '<all_urls>',
    ],
    background: {
      service_worker: 'background.js',
    },
    content_scripts: [
      {
        matches: ['<all_urls>'],
        js: ['content.js'],
        run_at: 'document_idle',
      },
    ],
  };

  const backgroundJs = `// TaskMaster Manifest V3 Background Service Worker
chrome.runtime.onInstalled.addListener(() => {
  console.log('TaskMaster Chrome Extension installed.');
  // Enable opening side panel when clicking action icon
  if (chrome.sidePanel && chrome.sidePanel.setPanelBehavior) {
    chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch((error) => console.error(error));
  }
  // Create context menu for quick capture
  chrome.contextMenus.create({
    id: 'taskmaster-extract-selection',
    title: 'TaskMaster: Extract tasks from selection',
    contexts: ['selection'],
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'taskmaster-extract-selection' && info.selectionText) {
    chrome.storage.local.get(['taskmaster_pending_script'], (result) => {
      chrome.storage.local.set({
        taskmaster_pending_script: info.selectionText,
      }, () => {
        if (tab && tab.id) {
          chrome.sidePanel.open({ tabId: tab.id });
        }
      });
    });
  }
});

// Relay audio capture requests to offscreen document
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'START_OFFSCREEN_RECORDING') {
    handleOffscreenRecording(true).then(() => sendResponse({ status: 'started' }));
    return true;
  }
  if (message.type === 'STOP_OFFSCREEN_RECORDING') {
    handleOffscreenRecording(false).then(() => sendResponse({ status: 'stopped' }));
    return true;
  }
  if (message.type === 'SCRAPE_ACTIVE_MEETING') {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.id) {
        chrome.tabs.sendMessage(tabs[0].id, { type: 'GET_MEETING_TRANSCRIPT' }, (response) => {
          sendResponse(response || { text: '', source: 'tab' });
        });
      } else {
        sendResponse({ text: '', source: 'error' });
      }
    });
    return true;
  }
});

async function handleOffscreenRecording(start) {
  const existingContexts = await chrome.runtime.getContexts({
    contextTypes: ['OFFSCREEN_DOCUMENT'],
  });
  if (start) {
    if (existingContexts.length === 0) {
      await chrome.offscreen.createDocument({
        url: 'offscreen.html',
        reasons: ['USER_MEDIA'],
        justification: 'Record voice input for AI task extraction',
      });
    }
  }
}
`;

  const contentJs = `// TaskMaster Content Script: Scrapes meeting subtitles and text notes
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'GET_MEETING_TRANSCRIPT') {
    const transcript = extractMeetingText();
    sendResponse({ text: transcript, title: document.title, url: window.location.href });
  }
  return true;
});

function extractMeetingText() {
  let gathered = [];

  // Google Meet captions selectors
  const meetCaptions = document.querySelectorAll('div[jsname="YSvyfd"], div[aria-live="polite"] span, .iTTPOb');
  if (meetCaptions.length > 0) {
    meetCaptions.forEach((el) => {
      const text = el.innerText.trim();
      if (text && !gathered.includes(text)) gathered.push(text);
    });
    if (gathered.length > 0) return gathered.join('\\n');
  }

  // Microsoft Teams closed captions & chat selectors
  const teamsCaptions = document.querySelectorAll('span[data-tid="closed-caption-text"], .ui-chat__item__message');
  if (teamsCaptions.length > 0) {
    teamsCaptions.forEach((el) => {
      const text = el.innerText.trim();
      if (text && !gathered.includes(text)) gathered.push(text);
    });
    if (gathered.length > 0) return gathered.join('\\n');
  }

  // User highlighted text selection on active page
  const selection = window.getSelection()?.toString();
  if (selection && selection.trim().length > 10) {
    return selection.trim();
  }

  // Fallback: grab main body paragraphs / notes
  const articles = document.querySelectorAll('article, main, [role="main"], .notes-body, #meeting-notes');
  if (articles.length > 0) {
    return articles[0].innerText.slice(0, 4000);
  }

  return document.body.innerText.slice(0, 2500);
}
`;

  const offscreenHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>TaskMaster Audio Offscreen</title>
</head>
<body>
  <script src="offscreen.js"></script>
</body>
</html>
`;

  const offscreenJs = `// Web Audio / Web Speech API offscreen handler for Manifest V3
let recognition = null;

if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
  const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
  recognition = new SpeechRec();
  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.lang = 'en-US';

  recognition.onresult = (event) => {
    let transcript = '';
    for (let i = event.resultIndex; i < event.results.length; i++) {
      transcript += event.results[i][0].transcript;
    }
    chrome.runtime.sendMessage({ type: 'VOICE_TRANSCRIPT_CHUNK', transcript });
  };
}
`;

  const popupHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>TaskMaster Quick Capture</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      width: 380px;
      height: 560px;
      background: #09090b;
      color: #fafafa;
      font-family: system-ui, -apple-system, sans-serif;
      overflow: hidden;
    }
    iframe {
      width: 100%;
      height: 100%;
      border: none;
    }
  </style>
</head>
<body>
  <iframe src="sidepanel.html"></iframe>
</body>
</html>
`;

  const sidepanelHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>TaskMaster Side Panel</title>
  <link rel="stylesheet" href="styles.css">
  <style>
    body {
      margin: 0;
      background: #09090b;
      color: #f4f4f5;
      font-family: system-ui, -apple-system, sans-serif;
    }
  </style>
</head>
<body>
  <div id="root">
    <!-- TaskMaster Full App Mount -->
    <div style="padding: 20px; text-align: center; color: #a1a1aa;">
      <h3 style="color: #fff; margin-bottom: 8px;">TaskMaster Voice & Meeting AI</h3>
      <p style="font-size: 13px;">Chrome Side Panel Workspace loaded.</p>
    </div>
  </div>
  <script type="module" src="app.js"></script>
</body>
</html>
`;

  const readmeMd = `# TaskMaster - Voice & Meeting Task AI (Chrome Extension Manifest V3)

## How to Install in Google Chrome:
1. Unzip the downloaded \`taskmaster-chrome-extension.zip\` into a folder.
2. Open Google Chrome and navigate to \`chrome://extensions\`.
3. In the top-right corner, turn on **Developer mode** toggle.
4. Click **Load unpacked** in the top-left corner.
5. Select the unzipped folder containing \`manifest.json\`.
6. Click the extension puzzle icon in Chrome and pin **TaskMaster**.
7. Click the extension icon to open the **Chrome Side Panel** or **Action Popup** alongside any meeting (Google Meet, Microsoft Teams, Zoom, or web notes)!

## Key Features:
- **Audio & Voice Parser**: Interactive pulsing microphone interface with automatic urgency word detection.
- **Meeting Script Analysis**: Action item checklist extraction with approval review modal.
- **5 Priority Levels**: Critical (Red), High (Orange), Medium (Yellow/Blue), Low (Gray/Green), None.
- **4 Lifecycle Statuses**: To Do, In Progress, Completed, Missed / Late with timestamp history.
- **Interactive Analytics**: Numerical counts with hyperlinked filter triggers.
- **Bot Quick-Actions**: EMEA Notification Bot ("Retrieve Team Contacts") & CX Renewal Bot ("Track Deals Linked to APs").
`;

  return [
    { name: 'manifest.json', content: JSON.stringify(manifest, null, 2), language: 'json' },
    { name: 'background.js', content: backgroundJs, language: 'javascript' },
    { name: 'content.js', content: contentJs, language: 'javascript' },
    { name: 'offscreen.html', content: offscreenHtml, language: 'html' },
    { name: 'offscreen.js', content: offscreenJs, language: 'javascript' },
    { name: 'popup.html', content: popupHtml, language: 'html' },
    { name: 'sidepanel.html', content: sidepanelHtml, language: 'html' },
    { name: 'README.md', content: readmeMd, language: 'markdown' },
  ];
}

export async function downloadExtensionZip(): Promise<void> {
  const zip = new JSZip();
  const files = getManifestV3Files();

  files.forEach((file) => {
    zip.file(file.name, file.content);
  });

  const blob = await zip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'taskmaster-chrome-extension-mv3.zip';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
