const defaultSettings = {
  options: {
    enabled: true,
    openNewTab: false,
    notifyEvent: false,
    rules: [
      {
        id: null,
        enabled: false,
        regex: true,
        src: "^https?://(?!localhost|bar.test)([^/]+)(.*)$",
        dest: "https://localhost/",
      },
      {
        id: null,
        enabled: false,
        regex: true,
        src: "^https?://(?!localhost|foo.test)([^/]+)(.*)$",
        dest: "http://localhost/",
      },
      {
        id: null,
        enabled: true,
        regex: false,
        src: "https://example.com/",
        dest: "https://example.org/",
      },
      {
        id: null,
        enabled: false,
        regex: true,
        src: "https?://example.org/",
        dest: "https://google.com/",
      },
    ],
  },
};

let config = {
  enabled: true,
  openNewTab: false,
  notifyEvent: true,
  rules: [],
  lastTabId: 0,
};

chrome.runtime.onInstalled.addListener(async function (details) {
  if (details.reason === "install") {
    defaultSettings.options.rules.forEach((rule) => {
      if (!rule.id) {
        rule.id = crypto.randomUUID();
      }
    });
    await chrome.storage.sync.set(defaultSettings);
    config = {
      ...config,
      ...defaultSettings.options,
    };
    await chrome.runtime.openOptionsPage();
    return;
  }

  if (details.reason === "update") {
    // await chrome.runtime.openOptionsPage();
    chrome.storage.sync.get("options", function (data) {
      if (!data.options) {
        defaultSettings.options.rules.forEach((rule) => {
          if (!rule.id) {
            rule.id = crypto.randomUUID();
          }
        });
        chrome.storage.sync.set(defaultSettings);
        return;
      }

      if (data.options && data.options.rules && data.options.rules.length > 0) {
        chrome.storage.sync.get("options", async function (syncData) {
          const existingRules = syncData.options.rules || [];
          const newRules = data.options.rules.filter(
            (newRule) =>
              !existingRules.some(
                (existingRule) =>
                  existingRule.src === newRule.src &&
                  existingRule.dest === newRule.dest,
              ),
          );

          const mergedData = {
            ...syncData,
            options: {
              ...syncData.options,
              rules: [...existingRules, ...newRules],
            },
          };
          mergedData.options.rules.forEach((rule) => {
            if (!rule.id) {
              rule.id = crypto.randomUUID();
            }
          });

          await chrome.storage.sync.clear();
          await chrome.storage.sync.set(mergedData);
        });
      }
    });
  }
});

chrome.tabs.onUpdated.addListener(async function (tabId, change, _tab) {
  if (!config.enabled) return;

  if (change.status === "loading") {
    let newUrl = matchUrl(_tab.url || change.url);
    if (newUrl) {
      if (config.openNewTab === false) {
        config.lastTabId = tabId;
        await chrome.tabs.update({ url: newUrl });
      } else {
        chrome.tabs.create({ url: newUrl }, function () {
          notify();
        });
      }
    }
  }

  if (change.status === "complete" && tabId === config.lastTabId) {
    notify();
    config.lastTabId = 0;
  }
});

chrome.runtime.onMessage.addListener(
  function (request, _sender, _sendResponse) {
    console.debug({ request, _sender, _sendResponse });
    if (request.type === "syncOptions") {
      config.enabled = request.options.enabled;
      config.openNewTab = request.options.openNewTab;
      config.notifyEvent = request.options.notifyEvent;
      config.rules = request.options.rules;
      return;
    }
    if (request.type === "resetRules") {
      config = {
        ...config,
        ...defaultSettings.options,
      };

      defaultSettings.options.rules.forEach((rule) => {
        if (!rule.id) {
          rule.id = crypto.randomUUID();
        }
      });

      chrome.storage.sync.set(defaultSettings, function () {
        const msg = {
          type: "reloadOptions",
        };
        chrome.runtime.sendMessage(msg, function (_response) {
          console.debug(_response);
        });
      });
    }
  },
);

function getOptions() {
  chrome.storage.sync.get("options", function (data) {
    if (data.options) {
      config.openNewTab = data.options.openNewTab;
      config.notifyEvent = data.options.notifyEvent;
      config.rules = data.options.rules;
    }
  });
}

getOptions();

function matchUrl(url) {
  if (!config.rules || !url) return false;

  for (let i = 0; i < config.rules.length; i++) {
    if (!config.rules[i].enabled) {
      continue;
    }

    const src = config.rules[i].src;
    const destination = config.rules[i].dest;

    if (!config.rules[i].regex) {
      if (url === src) {
        return destination;
      }
      continue;
    }

    const re = new RegExp(src);
    if (url.search(re) !== -1) {
      const newUrl = url.replace(re, destination);
      if (url !== newUrl) {
        return newUrl;
      }
    }
  }

  return false;
}

function notify() {
  if (!config.notifyEvent) return;

  chrome.notifications.create({
    type: "basic",
    iconUrl: chrome.runtime.getURL("img/icon-48.png"),
    title: chrome.i18n.getMessage("app_name"),
    message: chrome.i18n.getMessage("notification_event"),
  });
}
