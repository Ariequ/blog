(function () {
  var dataEl = document.getElementById("reading-data");
  var stream = document.getElementById("stream");
  var statusEl = document.getElementById("reader-status");
  var emptyEl = document.getElementById("reader-empty");
  var moreBtn = document.getElementById("reader-more");
  var reader = document.getElementById("reader");
  if (!dataEl || !stream || !reader) return;

  var items = JSON.parse(dataEl.textContent);
  var base = reader.getAttribute("data-base") || "";
  if (base && base.charAt(base.length - 1) !== "/") base += "/";
  var BATCH = 30;
  var state = { source: "all", year: "", shown: BATCH };

  function readInitial() {
    var q = new URLSearchParams(location.search);
    var source = q.get("source");
    if (source !== "新浪博客" && source !== "博客大巴" && source !== "饭否") source = "all";
    var year = q.get("year") || "";
    if (year && !/^\d{4}$/.test(year)) year = "";
    var hash = /^#y(\d{4})$/.exec(location.hash || "");
    if (!year && hash) year = hash[1];
    return { source: source, year: year };
  }

  function filtered() {
    return items.filter(function (item) {
      if (state.source !== "all" && item.src !== state.source) return false;
      if (state.year && String(item.y) !== String(state.year)) return false;
      return true;
    });
  }

  function path(href) {
    if (!href) return base || "/";
    if (/^https?:\/\//.test(href)) return href;
    return base.replace(/\/$/, "") + href;
  }

  function el(tag, attrs, text) {
    var node = document.createElement(tag);
    if (attrs) {
      Object.keys(attrs).forEach(function (key) {
        if (key === "className") node.className = attrs[key];
        else node.setAttribute(key, attrs[key]);
      });
    }
    if (text != null) node.textContent = text;
    return node;
  }

  function monthHeading(item) {
    return el("h3", { className: "month" }, item.y + "年" + item.mo + "月");
  }

  function card(item) {
    var article = el("article", {
      className: "card",
      "data-kind": item.kind,
      "data-src": item.src,
      "data-year": String(item.y)
    });
    var kicker = el("p", { className: "card-kicker" });
    var time = el("time", { datetime: item.dt }, item.label);
    kicker.appendChild(time);
    kicker.appendChild(el("span", { className: "badge" }, item.src));
    if (item.missing) kicker.appendChild(el("span", { className: "badge" }, "图片缺失"));
    article.appendChild(kicker);

    if (item.kind === "fanfou") {
      article.appendChild(el("p", { className: "card-text" }, item.text));
      if (item.photo) {
        var img = el("img", {
          className: "card-photo",
          src: path(item.photo.src),
          alt: "照片",
          width: String(item.photo.w),
          height: String(item.photo.h),
          loading: "lazy",
          decoding: "async"
        });
        article.appendChild(img);
      }
      var actions = el("p", { className: "card-actions" });
      actions.appendChild(el("a", { href: path(item.href) }, "在归档中看这条"));
      actions.appendChild(document.createTextNode(" · "));
      actions.appendChild(el("a", { href: item.origin }, "原文"));
      article.appendChild(actions);
    } else {
      var title = el("h2", { className: "card-title" });
      title.appendChild(el("a", { href: path(item.href) }, item.title));
      article.appendChild(title);
      if (item.excerpt) article.appendChild(el("p", { className: "excerpt" }, item.excerpt));
      var more = el("p", { className: "card-actions" });
      more.appendChild(el("a", { href: path(item.href) }, "阅读全文"));
      if (item.origin) {
        more.appendChild(document.createTextNode(" · "));
        more.appendChild(el("a", { href: item.origin }, "原文"));
      }
      article.appendChild(more);
    }
    return article;
  }

  function sourceLabel() {
    return state.source === "all" ? "全部" : state.source;
  }

  function emptyCopy() {
    if (state.year && state.source !== "all") return "这一年没有" + state.source + "。";
    if (state.year) return "这一年没有条目。";
    return "没有符合的条目。";
  }

  function render() {
    var list = filtered();
    var shown = Math.min(state.shown, list.length);
    stream.textContent = "";
    var prevMonth = "";
    for (var i = 0; i < shown; i++) {
      var item = list[i];
      var month = item.y + "-" + item.mo;
      if (month !== prevMonth) {
        stream.appendChild(monthHeading(item));
        prevMonth = month;
      }
      stream.appendChild(card(item));
    }
    var prefix = (state.year ? state.year + " 年 · " : "") + sourceLabel();
    statusEl.textContent = prefix + " · 共 " + list.length + " 条" + (list.length ? "，已显示 " + shown : "");
    emptyEl.hidden = list.length !== 0;
    emptyEl.textContent = emptyCopy();
    if (shown < list.length) {
      moreBtn.hidden = false;
      var step = Math.min(BATCH, list.length - shown);
      moreBtn.textContent = "再看 " + step + " 条";
    } else {
      moreBtn.hidden = true;
    }
    document.querySelectorAll("[data-source]").forEach(function (btn) {
      btn.setAttribute("aria-pressed", btn.getAttribute("data-source") === state.source ? "true" : "false");
    });
    document.querySelectorAll("[data-year]").forEach(function (btn) {
      btn.setAttribute("aria-pressed", btn.getAttribute("data-year") === state.year ? "true" : "false");
    });
  }

  document.querySelectorAll("[data-source]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      state.source = btn.getAttribute("data-source");
      state.shown = BATCH;
      render();
      reader.scrollIntoView();
    });
  });
  document.querySelectorAll("[data-year]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      state.year = btn.getAttribute("data-year");
      state.shown = BATCH;
      render();
      reader.scrollIntoView();
    });
  });
  moreBtn.addEventListener("click", function () {
    state.shown += BATCH;
    render();
  });

  var initial = readInitial();
  state.source = initial.source;
  state.year = initial.year;
  render();

  if (new URLSearchParams(location.search).get("selftest") === "1") {
    var out = [];
    function assert(name, cond) {
      out.push((cond ? "PASS " : "FAIL ") + name);
    }
    assert("default-or-query", true);
    state.source = "all";
    state.year = "";
    state.shown = BATCH;
    render();
    assert("default 30", stream.querySelectorAll(".card").length === 30);
    assert("four filters", document.querySelectorAll(".filter-row [data-source]").length === 4);
    assert("no overflow", document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1);
    moreBtn.click();
    assert("more 60", stream.querySelectorAll(".card").length === 60);
    assert("counts", items.filter(function (i) { return i.src === "新浪博客"; }).length === 319 && items.filter(function (i) { return i.src === "博客大巴"; }).length === 38 && items.filter(function (i) { return i.src === "饭否"; }).length === 574 && items.length === 931);
    document.querySelector('[data-source="饭否"]').click();
    assert("fanfou only", Array.prototype.every.call(stream.querySelectorAll(".card"), function (c) {
      return c.getAttribute("data-src") === "饭否";
    }) && stream.querySelectorAll(".card").length === 30);
    assert("fanfou total", statusEl.textContent.indexOf("共 574 条") !== -1);
    document.querySelector('[data-source="新浪博客"]').click();
    assert("sina only", Array.prototype.every.call(stream.querySelectorAll(".card"), function (c) {
      return c.getAttribute("data-src") === "新浪博客";
    }) && stream.querySelectorAll(".card").length === 30);
    assert("sina total", statusEl.textContent.indexOf("共 319 条") !== -1 && statusEl.textContent.indexOf("已显示 30") !== -1);
    assert("sina pressed", document.querySelector('[data-source="新浪博客"]').getAttribute("aria-pressed") === "true" && document.querySelector('[data-source="all"]').getAttribute("aria-pressed") === "false");
    document.querySelector('[data-source="博客大巴"]').click();
    assert("blogbus only", Array.prototype.every.call(stream.querySelectorAll(".card"), function (c) {
      return c.getAttribute("data-src") === "博客大巴";
    }) && stream.querySelectorAll(".card").length === 30);
    assert("blogbus total", statusEl.textContent.indexOf("共 38 条") !== -1);
    moreBtn.click();
    assert("blogbus rest", stream.querySelectorAll(".card").length === 38 && moreBtn.hidden === true);
    document.querySelector('[data-year="2011"]').click();
    assert("2011 blogbus", stream.querySelectorAll(".card").length > 0 && Array.prototype.every.call(stream.querySelectorAll(".card"), function (c) {
      return c.getAttribute("data-year") === "2011" && c.getAttribute("data-src") === "博客大巴";
    }));
    document.querySelector('[data-source="新浪博客"]').click();
    assert("2011 sina empty", stream.querySelector(".card") === null && emptyEl.hidden === false);
    document.querySelector('[data-year="2008"]').click();
    assert("2008 sina", stream.querySelectorAll(".card").length === 30 && Array.prototype.every.call(stream.querySelectorAll(".card"), function (c) {
      return c.getAttribute("data-year") === "2008" && c.getAttribute("data-src") === "新浪博客";
    }));
    document.querySelector('[data-year="2011"]').click();
    document.querySelector('[data-source="饭否"]').click();
    assert("2011 fanfou", stream.querySelectorAll(".card").length === 30 && Array.prototype.every.call(stream.querySelectorAll(".card"), function (c) {
      return c.getAttribute("data-year") === "2011" && c.getAttribute("data-src") === "饭否";
    }));
    var img = stream.querySelector("img.card-photo");
    assert("2011 photo", !!(img && img.getAttribute("src").indexOf("/assets/fanfou/") !== -1 && img.getAttribute("loading") === "lazy"));
    document.querySelector('[data-year="2006"]').click();
    assert("2006 fanfou empty", stream.querySelector(".card") === null && emptyEl.hidden === false);
    document.querySelector('[data-source="博客大巴"]').click();
    assert("2006 blogbus empty", stream.querySelector(".card") === null && emptyEl.hidden === false);
    document.querySelector('[data-source="新浪博客"]').click();
    assert("2006 sina", stream.querySelectorAll(".card").length === 30 && statusEl.textContent.indexOf("已显示 30") !== -1);
    document.querySelector('[data-year="2026"]').click();
    document.querySelector('[data-source="all"]').click();
    assert("2026 one", stream.querySelectorAll(".card").length === 1 && stream.querySelector(".card").getAttribute("data-year") === "2026");
    document.querySelector('[data-source="新浪博客"]').click();
    assert("2026 sina empty", stream.querySelector(".card") === null);
    document.querySelector('[data-source="博客大巴"]').click();
    assert("2026 blogbus empty", stream.querySelector(".card") === null);
    document.querySelector('[data-source="all"]').click();
    document.querySelector('[data-year=""]').click();
    assert("reset 30", stream.querySelectorAll(".card").length === 30 && statusEl.textContent.indexOf("共 931 条") !== -1);
    var pre = document.createElement("pre");
    pre.id = "selftest";
    pre.textContent = out.join("\n");
    document.body.appendChild(pre);
  }
})();
