(function () {
  var dataEl = document.getElementById("reading-data");
  var stream = document.getElementById("stream");
  var statusEl = document.getElementById("reader-status");
  var emptyEl = document.getElementById("reader-empty");
  var moreBtn = document.getElementById("reader-more");
  var endEl = document.getElementById("reader-end");
  var hintEl = document.getElementById("reader-hint");
  var sentinel = document.getElementById("reader-sentinel");
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

  function paintMore() {
    var list = filtered();
    var shown = Math.min(state.shown, list.length);
    var already = parseInt(stream.getAttribute("data-count") || "0", 10);
    var prevMonth = "";
    if (already > 0) {
      var prev = list[already - 1];
      prevMonth = prev.y + "-" + prev.mo;
    }
    for (var i = already; i < shown; i++) {
      var item = list[i];
      var month = item.y + "-" + item.mo;
      if (month !== prevMonth) {
        stream.appendChild(monthHeading(item));
        prevMonth = month;
      }
      stream.appendChild(card(item));
    }
    stream.setAttribute("data-count", String(shown));
  }

  function updateChrome() {
    var list = filtered();
    var shown = Math.min(state.shown, list.length);
    var prefix = (state.year ? state.year + " 年 · " : "") + sourceLabel();
    var done = list.length > 0 && shown >= list.length;
    if (!list.length) statusEl.textContent = prefix + " · 共 0 条";
    else if (done) statusEl.textContent = prefix + " · 共 " + list.length + " 条，已全部显示";
    else statusEl.textContent = prefix + " · 共 " + list.length + " 条，已显示 " + shown;
    emptyEl.hidden = list.length !== 0;
    emptyEl.textContent = emptyCopy();
    if (endEl) endEl.hidden = !done;
    if (hintEl) hintEl.hidden = !(autoload && list.length > shown);
    if (shown < list.length) {
      var step = Math.min(BATCH, list.length - shown);
      moreBtn.textContent = "再看 " + step + " 条";
    }
    moreBtn.hidden = autoload || shown >= list.length;
    document.querySelectorAll("[data-source]").forEach(function (btn) {
      btn.setAttribute("aria-pressed", btn.getAttribute("data-source") === state.source ? "true" : "false");
    });
    document.querySelectorAll("[data-year]").forEach(function (btn) {
      btn.setAttribute("aria-pressed", btn.getAttribute("data-year") === state.year ? "true" : "false");
    });
  }

  function render() {
    stream.textContent = "";
    stream.setAttribute("data-count", "0");
    paintMore();
    updateChrome();
  }

  var autoload = false;
  var loading = false;
  var epoch = 0;
  var seenInside = false;
  var io = null;

  function loadMore() {
    if (loading) return;
    var total = filtered().length;
    if (state.shown >= total) return;
    loading = true;
    var ticket = epoch;
    state.shown = Math.min(total, state.shown + BATCH);
    paintMore();
    updateChrome();
    if (ticket === epoch) loading = false;
  }

  function armObserver() {
    seenInside = false;
    if (!io || !sentinel) return;
    io.unobserve(sentinel);
    io.observe(sentinel);
  }

  moreBtn.addEventListener("click", loadMore);

  function nearSentinel() {
    if (!sentinel) return false;
    return sentinel.getBoundingClientRect().top <= window.innerHeight + 320;
  }

  function onScroll() {
    if (!nearSentinel()) {
      seenInside = false;
      return;
    }
    if (seenInside || loading) return;
    seenInside = true;
    loadMore();
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll);

  if (sentinel && window.IntersectionObserver) {
    try {
      io = new IntersectionObserver(function (entries) {
        var hit = false;
        for (var i = 0; i < entries.length; i++) {
          if (entries[i].isIntersecting) hit = true;
        }
        if (!hit) {
          seenInside = false;
          return;
        }
        if (seenInside) return;
        seenInside = true;
        loadMore();
      }, { root: null, rootMargin: "320px 0px", threshold: 0 });
      io.observe(sentinel);
      autoload = true;
      moreBtn.hidden = true;
      moreBtn.setAttribute("tabindex", "-1");
    } catch (err) {
      autoload = false;
      moreBtn.hidden = false;
      moreBtn.removeAttribute("tabindex");
    }
  }

  var sourceButtons = document.querySelectorAll("[data-source]");
  sourceButtons.forEach(function (btn) {
    btn.addEventListener("click", function () {
      epoch += 1;
      loading = false;
      state.source = btn.getAttribute("data-source");
      state.shown = BATCH;
      render();
      armObserver();
    });
  });
  document.querySelectorAll("[data-year]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      epoch += 1;
      loading = false;
      state.year = btn.getAttribute("data-year");
      state.shown = BATCH;
      render();
      armObserver();
    });
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
    assert("button not primary", autoload && moreBtn.hidden === true);
    moreBtn.click();
    assert("more 60", stream.querySelectorAll(".card").length === 60);
    moreBtn.click();
    assert("more 90", stream.querySelectorAll(".card").length === 90);
    var seen = {};
    var dup = 0;
    Array.prototype.forEach.call(stream.querySelectorAll(".card"), function (card) {
      var link = card.querySelector("a");
      var key = link ? link.getAttribute("href") : "";
      if (seen[key]) dup += 1;
      seen[key] = 1;
    });
    assert("no dups", dup === 0);
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
    assert("blogbus rest", stream.querySelectorAll(".card").length === 38 && endEl.hidden === false);
    moreBtn.click();
    assert("blogbus stop", stream.querySelectorAll(".card").length === 38);
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
    assert("2006 fanfou empty", stream.querySelector(".card") === null && emptyEl.hidden === false && endEl.hidden === true);
    document.querySelector('[data-source="博客大巴"]').click();
    assert("2006 blogbus empty", stream.querySelector(".card") === null && emptyEl.hidden === false);
    document.querySelector('[data-source="新浪博客"]').click();
    assert("2006 sina", stream.querySelectorAll(".card").length === 30 && statusEl.textContent.indexOf("已显示 30") !== -1);
    document.querySelector('[data-year="2026"]').click();
    document.querySelector('[data-source="all"]').click();
    assert("2026 one", stream.querySelectorAll(".card").length === 1 && endEl.hidden === false);
    moreBtn.click();
    assert("2026 stop", stream.querySelectorAll(".card").length === 1);
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

  if (new URLSearchParams(location.search).get("selftest") === "scroll") {
    var log = [];
    function cards() { return stream.querySelectorAll(".card").length; }
    function finish() {
      var pre = document.createElement("pre");
      pre.id = "selftest";
      pre.textContent = log.join("\n");
      document.body.appendChild(pre);
    }
    window.__log = log;
    log.push("start " + cards() + " h=" + window.innerHeight);
    setTimeout(function () {
      window.scrollTo(0, document.documentElement.scrollHeight);
      window.dispatchEvent(new Event("scroll"));
      setTimeout(function () {
        log.push("after1 " + cards() + " top=" + Math.round(sentinel.getBoundingClientRect().top));
        window.scrollTo(0, document.documentElement.scrollHeight);
        window.dispatchEvent(new Event("scroll"));
        setTimeout(function () {
          log.push("after2 " + cards() + " top=" + Math.round(sentinel.getBoundingClientRect().top) + " y=" + Math.round(window.scrollY));
          var seen = {};
          var dup = 0;
          Array.prototype.forEach.call(stream.querySelectorAll(".card"), function (card) {
            var link = card.querySelector("a");
            var key = link ? link.getAttribute("href") : "";
            if (seen[key]) dup += 1;
            seen[key] = 1;
          });
          log.push("dups " + dup);
          log.push("months " + stream.querySelectorAll("h3.month").length);
          finish();
        }, 300);
      }, 300);
    }, 50);
  }
})();
