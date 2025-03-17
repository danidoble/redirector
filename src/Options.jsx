import { useEffect, useRef, useState } from "react";
import { ReactSortable } from "react-sortablejs";
import { GripHorizontal, Trash2 } from "./Icons.jsx";
import { toast } from "sonner";

export const Options = ({ mini = false }) => {
  const inputFile = useRef(null);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState({
    enabled: true,
    openNewTab: false,
    notifyEvent: false,
    rules: [],
  });

  const exportConfig = () => {
    setSaving(true);
    const configurationStringify = JSON.stringify(config, null, 2);
    const blob = new Blob([configurationStringify], {
      type: "application/json",
    });
    const anchor = document.createElement("a");
    anchor.download = "redirector-configuration.json";
    anchor.href = window.URL.createObjectURL(blob);
    anchor.click();
    setSaving(false);
  };

  const importConfig = () => {
    if (!inputFile.current) return;

    setSaving(true);
    const file = inputFile.current.files[0];

    if (!file || file.type !== "application/json") {
      toast.error(chrome.i18n.getMessage("app_import_error"));
      setSaving(false);
      return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
      const content = e.target.result;
      try {
        const newConfig = JSON.parse(content);
        let hasError = false;
        if (typeof newConfig.enabled !== "boolean") hasError = true;
        if (typeof newConfig.notifyEvent !== "boolean") hasError = true;
        if (typeof newConfig.openNewTab !== "boolean") hasError = true;
        if (
          typeof newConfig.rules !== "object" ||
          !(newConfig.rules instanceof Array)
        )
          hasError = true;
        if (hasError) {
          toast.error(chrome.i18n.getMessage("app_import_error"));
          setSaving(false);
          return;
        }
        newConfig.rules.map((rule) => {
          if (typeof rule.src !== "string" || rule.src.trim() === "")
            hasError = true;
          if (typeof rule.dest !== "string" || rule.dest.trim() === "")
            hasError = true;
          if (typeof rule.enabled !== "boolean") hasError = true;
          if (typeof rule.regex !== "boolean") hasError = true;
        });
        if (hasError) {
          toast.error(chrome.i18n.getMessage("app_import_error"));
          setSaving(false);
          return;
        }

        const safeConfig = {
          enabled: newConfig.enabled,
          openNewTab: newConfig.openNewTab,
          notifyEvent: newConfig.notifyEvent,
          rules: [],
        };
        newConfig.rules.map((rule) => {
          safeConfig.rules.push({
            dest: rule.dest,
            enabled: rule.enabled,
            id: crypto.randomUUID(),
            regex: rule.regex,
            src: rule.src,
          });
        });

        setConfig(safeConfig);
        await chrome.storage.sync.set({ options: safeConfig });
        await chrome.runtime.sendMessage({
          type: "syncOptions",
          options: safeConfig,
        });
        toast.success(chrome.i18n.getMessage("app_import_success"));
        setSaving(false);
      } catch (error) {
        console.warn(error);
        toast.error(chrome.i18n.getMessage("app_import_error"));
        setSaving(false);
      }
    };
    reader.readAsText(file);
  };

  function getOptions() {
    if (chrome.runtime.lastError) {
      console.log(chrome.runtime.lastError);
    }
    chrome.storage.sync.get("options", function (data) {
      setConfig({
        enabled: data.options.enabled,
        openNewTab: data.options.openNewTab,
        notifyEvent: data.options.notifyEvent,
        rules: data.options.rules,
      });
    });
  }

  useEffect(() => {
    const fn = function (request, _sender, _sendResponse) {
      if (typeof _sendResponse === "function") {
        _sendResponse();
      }
      if (request.type === "reloadOptions") {
        getOptions();
      }
    };

    getOptions();
    chrome.runtime.onMessage.addListener(fn);

    return () => {
      chrome.runtime.onMessage.removeListener(fn);
    };
  }, []);

  const handleEnabledChange = (e) => {
    setConfig({
      ...config,
      enabled: e.target.value === "true",
    });
  };
  const handleTabChange = (e) => {
    setConfig({
      ...config,
      openNewTab: e.target.value === "true",
    });
  };
  const handleNotifyChange = (e) => {
    setConfig({
      ...config,
      notifyEvent: e.target.checked,
    });
  };
  const addRule = () => {
    const rules = [
      ...config.rules,
      {
        id: crypto.randomUUID(),
        name: null,
        enabled: true,
        regex: false,
        src: "",
        dest: "",
      },
    ];
    setConfig({
      ...config,
      rules,
    });
  };

  const handleRuleSrc = (e, index) => {
    setConfig((prev) => {
      const newRules = [...prev.rules];
      newRules[index].src = e.target.value;
      return { ...config, rules: newRules };
    });
  };
  const handleRuleDest = (e, index) => {
    setConfig((prev) => {
      const newRules = [...prev.rules];
      newRules[index].dest = e.target.value;
      return { ...config, rules: newRules };
    });
  };
  const handleRuleRegex = (e, index) => {
    setConfig((prev) => {
      const newRules = [...prev.rules];
      newRules[index].regex = e.target.checked;
      return { ...config, rules: newRules };
    });
  };
  const handleRuleEnabled = (e, index) => {
    setConfig((prev) => {
      const newRules = [...prev.rules];
      newRules[index].enabled = e.target.checked;
      return { ...config, rules: newRules };
    });
  };
  const handleRuleDelete = (index) => {
    setConfig((prev) => {
      const newRules = [...prev.rules].filter((_, i) => i !== index);
      return { ...config, rules: newRules };
    });
  };

  const saveData = async () => {
    setSaving(true);

    // check if source and destination are not empty
    const rules = config.rules.filter(
      (rule) => rule.src.trim() !== "" && rule.dest.trim() !== "",
    );
    const newConfig = { ...config, rules };
    setConfig(newConfig);

    await chrome.storage.sync.set({ options: newConfig });
    await chrome.runtime.sendMessage({
      type: "syncOptions",
      options: newConfig,
    });
    toast.success(chrome.i18n.getMessage("app_saved"));
    setSaving(false);
  };

  const resetData = async () => {
    setSaving(true);
    await chrome.runtime.sendMessage({ type: "resetRules" });
    toast.success(chrome.i18n.getMessage("app_config_reset"));
    setSaving(false);
  };

  const clearRules = async () => {
    setSaving(true);
    const newConfig = { ...config, rules: [] };
    setConfig(newConfig);
    await chrome.storage.sync.set({ options: newConfig });
    await chrome.runtime.sendMessage({
      type: "syncOptions",
      options: newConfig,
    });
    toast.success(chrome.i18n.getMessage("app_saved"));
    setSaving(false);
  };

  return (
    <>
      <div className="bg-base-300 w-full flex items-center justify-center">
        <div className="w-full max-w-7xl inline-flex items-center justify-between">
          <h1 className="px-6 text-2xl sm:text-3xl flex-1">
            {chrome.i18n.getMessage("app_name")}
          </h1>
          <img
            src="/img/icon-64.png"
            alt="Redirector"
            className="mx-auto my-4 size-12 sm:size-14"
          />
        </div>
      </div>

      <section className="mt-6 max-w-7xl mx-auto px-2">
        <h2 className="my-2 text-xl sm:text-2xl">
          {chrome.i18n.getMessage("app_configuration")}
        </h2>
        <div className="flex flex-wrap gap-2 items-center justify-between">
          <div className="gap-1 items-center p-2 sm:p-4 bg-base-200 rounded-lg">
            <div className="text-sm">
              {chrome.i18n.getMessage("app_import_data")}
            </div>
            <div className="inline-flex gap-x-1 items-center">
              <input
                type="file"
                className="file-input"
                accept="application/json"
                ref={inputFile}
              />
              <button
                type="button"
                disabled={saving}
                onClick={importConfig}
                className="btn btn-info"
              >
                {chrome.i18n.getMessage("app_import_btn")}
              </button>
            </div>
          </div>

          <button
            type="button"
            disabled={saving}
            onClick={exportConfig}
            className="btn btn-info"
          >
            {chrome.i18n.getMessage("app_export_data")}
          </button>
        </div>

        <div className="divider max-w-7xl mx-auto"></div>

        <div className="flex flex-col gap-4">
          <article className="flex flex-wrap items-center gap-4">
            <label className="text-lg cursor-pointer inline-flex items-center gap-x-2">
              <input
                type="radio"
                value="true"
                name="enabled"
                className="radio radio-xl"
                checked={config.enabled}
                onChange={handleEnabledChange}
              />
              {chrome.i18n.getMessage("app_enable")}
            </label>
            <label className="text-lg cursor-pointer inline-flex items-center gap-x-2">
              <input
                type="radio"
                value="false"
                name="enabled"
                className="radio radio-xl"
                checked={!config.enabled}
                onChange={handleEnabledChange}
              />
              {chrome.i18n.getMessage("app_disable")}
            </label>
          </article>

          <article className="flex flex-wrap items-center gap-4">
            <label className="text-lg cursor-pointer inline-flex items-center gap-x-2">
              <input
                type="radio"
                value="false"
                name="tab"
                className="radio radio-xl"
                checked={!config.openNewTab}
                onChange={handleTabChange}
              />
              {chrome.i18n.getMessage("app_redirect_inline")}
            </label>
            <label className="text-lg cursor-pointer inline-flex items-center gap-x-2">
              <input
                type="radio"
                value="true"
                name="tab"
                className="radio radio-xl"
                checked={config.openNewTab}
                onChange={handleTabChange}
              />
              {chrome.i18n.getMessage("app_redirect_new_tab")}
            </label>
          </article>

          <article>
            <label className="text-lg cursor-pointer inline-flex items-center gap-x-2">
              <input
                type="checkbox"
                onChange={handleNotifyChange}
                checked={config.notifyEvent}
                className="toggle toggle-xl toggle-primary"
              />
              {chrome.i18n.getMessage("app_notify_event")}
            </label>
          </article>
        </div>
      </section>

      <div className="divider max-w-7xl mx-auto"></div>

      <section className="max-w-7xl mx-auto px-2 flex flex-col gap-4">
        <h2 className="my-2 text-xl sm:text-2xl">
          {chrome.i18n.getMessage("app_rules")}
        </h2>
        <div
          className={`${!mini ? "min-w-[50rem]" : ""} w-full overflow-x-auto`}
        >
          {!mini && (
            <ul className="grid grid-cols-1 gap-2">
              <li
                className={`w-full grid grid-cols-10 items-center gap-4 text-sm font-semibold uppercase`}
              >
                <div className={`w-full col-span-1`}>
                  {chrome.i18n.getMessage("app_rule_header_sort")}
                </div>
                <div className="w-full col-span-3">
                  {chrome.i18n.getMessage("app_rule_header_source")}{" "}
                  <span className="text-rose-600 font-semibold text-lg">*</span>
                </div>
                <div className="w-full col-span-3">
                  {chrome.i18n.getMessage("app_rule_header_destination")}{" "}
                  <span className="text-rose-600 font-semibold text-lg">*</span>
                </div>
                <div className="w-full text-center">
                  {chrome.i18n.getMessage("app_rule_header_regex")}
                </div>
                <div className="w-full text-center">
                  {chrome.i18n.getMessage("app_rule_header_enable")}
                </div>
                <div className="w-full text-center">
                  {chrome.i18n.getMessage("app_rule_header_delete")}
                </div>
              </li>
            </ul>
          )}
          <ReactSortable
            handle=".drag-handle"
            list={config.rules}
            setList={(newRules) => setConfig({ ...config, rules: newRules })}
            className="grid grid-cols-1 gap-2 "
            tag="ul"
          >
            {config.rules.map((item, index) => (
              <li
                key={item.id}
                className={`w-full grid ${!mini ? "grid-cols-10" : "mb-1 pb-3 border-b"} items-center gap-4`}
              >
                {!mini && (
                  <div className="col-span-1">
                    <button className="btn btn-ghost btn-sm drag-handle cursor-grab">
                      <GripHorizontal className="size-6" />
                    </button>
                  </div>
                )}
                <div className={`${!mini ? "col-span-3" : "flex flex-col"}`}>
                  {mini && (
                    <label className="text-xs">
                      {chrome.i18n.getMessage("app_rule_source")}
                    </label>
                  )}
                  <input
                    type="text"
                    placeholder={chrome.i18n.getMessage("app_rule_source")}
                    className={`input`}
                    onChange={(e) => {
                      handleRuleSrc(e, index);
                    }}
                    value={item.src || ""}
                  />
                </div>
                <div className={`${!mini ? "col-span-3" : "flex flex-col"}`}>
                  {mini && (
                    <label className="text-xs">
                      {chrome.i18n.getMessage("app_rule_destination")}
                    </label>
                  )}
                  <input
                    type="text"
                    placeholder={chrome.i18n.getMessage("app_rule_destination")}
                    className={`input`}
                    onChange={(e) => {
                      handleRuleDest(e, index);
                    }}
                    value={item.dest || ""}
                  />
                </div>
                <div
                  className={`${!mini ? "col-span-3 grid grid-cols-3 gap-4 items-center" : "flex flex-wrap items-center"}`}
                >
                  <div
                    className={`col-span-1 ${!mini ? "inline-flex justify-center" : "flex-1 flex flex-col justify-center items-center text-center"}`}
                  >
                    {mini && (
                      <label className="text-xs">
                        {chrome.i18n.getMessage("app_rule_header_regex")}
                      </label>
                    )}
                    <input
                      type="checkbox"
                      checked={item.regex}
                      onChange={(e) => handleRuleRegex(e, index)}
                      className="checkbox checkbox-lg checkbox-primary"
                    />
                  </div>
                  <div
                    className={`col-span-1 ${!mini ? "inline-flex justify-center" : "flex-1 flex flex-col justify-center items-center text-center"}`}
                  >
                    {mini && (
                      <label className="text-xs">
                        {chrome.i18n.getMessage("app_rule_header_enable")}
                      </label>
                    )}
                    <input
                      type="checkbox"
                      checked={item.enabled}
                      onChange={(e) => handleRuleEnabled(e, index)}
                      className="checkbox checkbox-lg checkbox-primary"
                    />
                  </div>
                  <div
                    className={`col-span-1 ${!mini ? "inline-flex justify-center" : "flex-1 flex flex-col justify-center items-center text-center"}`}
                  >
                    {mini && (
                      <label className="text-xs">
                        {chrome.i18n.getMessage("app_rule_header_delete")}
                      </label>
                    )}
                    <button
                      type={"button"}
                      onClick={() => {
                        handleRuleDelete(index);
                      }}
                      className="btn btn-error btn-circle"
                    >
                      <Trash2 />
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ReactSortable>
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          <button type="button" onClick={addRule} className="btn btn-soft">
            {chrome.i18n.getMessage("app_add_rule")}
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={saveData}
            className="btn btn-primary"
          >
            {chrome.i18n.getMessage("app_save_data")}
          </button>
        </div>
      </section>

      <div className="divider max-w-7xl mx-auto"></div>

      <div
        className={`mx-auto w-full max-w-7xl grid ${!mini ? "grid-cols-2" : "grid-cols-1"} gap-4 my-6`}
      >
        <section
          className={`bg-base-200 w-full ${!mini ? "order-1" : "order-2"}`}
        >
          <div className="card">
            <div className="card-body">
              <div className="card-title">
                {chrome.i18n.getMessage("app_reset_data")}
              </div>
              <button
                type="button"
                disabled={saving}
                onClick={resetData}
                className="btn btn-error"
              >
                {chrome.i18n.getMessage("app_reset_btn")}
              </button>
            </div>
          </div>
        </section>
        <section
          className={`bg-base-200 w-full ${!mini ? "order-2" : "order-1"}`}
        >
          <div className="card">
            <div className="card-body">
              <div className="card-title">
                {chrome.i18n.getMessage("app_clear_rules")}
              </div>
              <button
                type="button"
                disabled={saving}
                onClick={clearRules}
                className="btn btn-error"
              >
                {chrome.i18n.getMessage("app_clear_rules_btn")}
              </button>
            </div>
          </div>
        </section>
      </div>

      <div className="bg-base-300 text-center text-xs py-1.5">
        Created by danidoble. (c){new Date().getFullYear()}
      </div>
    </>
  );
};
