// ==UserScript==
// @name           dlsite_rj_code_preview
// @author         SettingDust
// @description    Make RJ code great again! 悬停 RJ 码时检查本地 Kikoeru 是否已收录（含日文/简中/繁中版本）。
// @grant          GM_xmlhttpRequest
// @grant          GM_setValue
// @grant          GM_getValue
// @grant          GM_registerMenuCommand
// @inject-into    auto
// @match          *://*/*
// @match          *://dlsite.com/*
// @name:zh-CN     DLSite_RJ_码预览
// @namespace      SettingDust
// @run-at         document-end
// @version        3.2.1
// @connect        dlsite.com
// @connect        *
// ==/UserScript==

// src/fetch-rj.ts
var productPage = (rj) => `https://www.dlsite.com/maniax/work/=/product_id/${rj.toUpperCase()}.html`, agings = {
  adult: "18 \u7981",
  general: "\u5168\u5E74\u9F84"
};
function productInfo(rj) {
  return new Promise((resolve, reject) => {
    GM_xmlhttpRequest({
      url: `https://www.dlsite.com/maniax/api/=/product.json?workno=${rj}`,
      responseType: "json",
      onload: function(resp) {
        resp.readyState === 4 && resp.status === 200 && resp.response && resp.response[0] ? (resolve(resp.response[0]), console.debug("[rj-code-preview/product]", resp.response[0])) : reject(resp);
      }
    });
  });
}
function productRatingInfo(rj) {
  return new Promise((resolve, reject) => {
    GM_xmlhttpRequest({
      url: `https://www.dlsite.com/maniax/product/info/ajax?product_id=${rj}`,
      responseType: "json",
      onload: function(resp) {
        resp.readyState === 4 && resp.status === 200 ? (resolve(resp.response[rj]), console.debug("[rj-code-preview/rating]", resp.response[rj])) : reject(resp);
      }
    });
  });
}
function fetch_rj_default(rj) {
  return new Promise((resolve, reject) => {
    Promise.all([productInfo(rj), productRatingInfo(rj)]).then(
      ([product, rating]) => {
        var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k, _l, _m, _n, _o, _p, _q, _r, _s, _t, _u, _v, _w, _x;
        return {
          name: product.work_name,
          image: (_a = product.image_main) == null ? void 0 : _a.url,
          type: product.work_type_string,
          group: product.maker_name,
          date: product.regist_date,
          series: product.title_name,
          age: (_b = agings[product.age_category_string]) != null ? _b : product.age_category_string,
          voices: (_d = (_c = product.creaters) == null ? void 0 : _c.voice_by) == null ? void 0 : _d.map((it) => it.name),
          illusts: (_f = (_e = product.creaters) == null ? void 0 : _e.illust_by) == null ? void 0 : _f.map((it) => it.name),
          scenarios: (_h = (_g = product.creaters) == null ? void 0 : _g.scenario_by) == null ? void 0 : _h.map((it) => it.name),
          creators: (_j = (_i = product.creaters) == null ? void 0 : _i.created_by) == null ? void 0 : _j.map((it) => it.name),
          musics: (_l = (_k = product.creaters) == null ? void 0 : _k.music_by) == null ? void 0 : _l.map((it) => it.name),
          hasCreators: (_n = (_m = product.creaters) == null ? void 0 : _m.created_by) == null ? void 0 : _n.length,
          hasScenarios: (_p = (_o = product.creaters) == null ? void 0 : _o.scenario_by) == null ? void 0 : _p.length,
          hasIllusts: (_r = (_q = product.creaters) == null ? void 0 : _q.illust_by) == null ? void 0 : _r.length,
          hasVoices: (_t = (_s = product.creaters) == null ? void 0 : _s.voice_by) == null ? void 0 : _t.length,
          hasMusics: (_v = (_u = product.creaters) == null ? void 0 : _u.music_by) == null ? void 0 : _v.length,
          tags: (_w = product.genres) == null ? void 0 : _w.map((it) => it.name),
          hasTags: (_x = product.genres) == null ? void 0 : _x.length,
          // 多语言版本信息：供 Kikoeru 本地库检查使用（同作品的日文/简中/繁中版本）
          editions: product.language_editions || null,
          translation: product.translation_info || null,
          rating: rating == null ? void 0 : rating.rate_average_2dp,
          sale: rating == null ? void 0 : rating.dl_count
        };
      }
    ).then((it) => {
      GM_setValue(`v2:${rj}`, it), resolve(it);
    }).catch(reject);
    let cache = GM_getValue(`v2:${rj}`);
    cache && (console.debug(`[rj-code-preview/cached/${rj}]`), resolve(cache));
  });
}

// src/hack-rj-code.ts
var RJ_CODE_LINK_CLASS = "rj-code", RJ_CODE_ATTRIBUTE = "rjCode", RJ_REGEX = new RegExp("R[JE][0-9]{6,8}", "gi");
function wrapRJCode(rj) {
  let a = document.createElement("a");
  return a.classList.add(RJ_CODE_LINK_CLASS), a.href = productPage(rj), a.innerHTML = rj, a.target = "_blank", a.rel = "noreferrer", a.dataset[RJ_CODE_ATTRIBUTE] = rj.toUpperCase(), a;
}
function injectRJCode(node) {
  var _a;
  let text = node.nodeValue, matches = [], match;
  for (; match = RJ_REGEX.exec(text); )
    matches.push({
      index: match.index,
      value: match[0]
    });
  matches.length && console.debug("[rj-code-preview/matches]", text, matches), node.nodeValue = text.substring(0, matches[0].index);
  let prev = null;
  for (let i = 0; i < matches.length; i++) {
    let match2 = matches[i], a = wrapRJCode(match2.value);
    node.parentNode.insertBefore(a, prev ? prev.nextSibling : node.nextSibling);
    let nextIndex = (_a = matches[i + 1]) == null ? void 0 : _a.index, afterText = text.substring(
      match2.index + match2.value.length,
      nextIndex
    );
    if (afterText) {
      let afterNode = document.createTextNode(afterText);
      node.parentNode.insertBefore(afterNode, a.nextElementSibling), prev = afterNode;
    } else
      prev = a;
  }
}
function hack_rj_code_default(root) {
  let walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      if (node.parentElement.classList.contains(RJ_CODE_LINK_CLASS) || node.nodeValue.match(RJ_REGEX))
        return NodeFilter.FILTER_ACCEPT;
    }
  });
  for (; walker.nextNode(); ) {
    let node = walker.currentNode;
    node.parentElement.classList.contains(RJ_CODE_LINK_CLASS) || injectRJCode(node);
  }
}

// node_modules/.pnpm/mustache@4.2.0/node_modules/mustache/mustache.mjs
var objectToString = Object.prototype.toString, isArray = Array.isArray || function(object) {
  return objectToString.call(object) === "[object Array]";
};
function isFunction(object) {
  return typeof object == "function";
}
function typeStr(obj) {
  return isArray(obj) ? "array" : typeof obj;
}
function escapeRegExp(string) {
  return string.replace(/[\-\[\]{}()*+?.,\\\^$|#\s]/g, "\\$&");
}
function hasProperty(obj, propName) {
  return obj != null && typeof obj == "object" && propName in obj;
}
function primitiveHasOwnProperty(primitive, propName) {
  return primitive != null && typeof primitive != "object" && primitive.hasOwnProperty && primitive.hasOwnProperty(propName);
}
var regExpTest = RegExp.prototype.test;
function testRegExp(re, string) {
  return regExpTest.call(re, string);
}
var nonSpaceRe = /\S/;
function isWhitespace(string) {
  return !testRegExp(nonSpaceRe, string);
}
var entityMap = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
  "/": "&#x2F;",
  "`": "&#x60;",
  "=": "&#x3D;"
};
function escapeHtml(string) {
  return String(string).replace(/[&<>"'`=\/]/g, function(s) {
    return entityMap[s];
  });
}
var whiteRe = /\s*/, spaceRe = /\s+/, equalsRe = /\s*=/, curlyRe = /\s*\}/, tagRe = /#|\^|\/|>|\{|&|=|!/;
function parseTemplate(template2, tags) {
  if (!template2)
    return [];
  var lineHasNonSpace = !1, sections = [], tokens = [], spaces = [], hasTag = !1, nonSpace = !1, indentation = "", tagIndex = 0;
  function stripSpace() {
    if (hasTag && !nonSpace)
      for (; spaces.length; )
        delete tokens[spaces.pop()];
    else
      spaces = [];
    hasTag = !1, nonSpace = !1;
  }
  var openingTagRe, closingTagRe, closingCurlyRe;
  function compileTags(tagsToCompile) {
    if (typeof tagsToCompile == "string" && (tagsToCompile = tagsToCompile.split(spaceRe, 2)), !isArray(tagsToCompile) || tagsToCompile.length !== 2)
      throw new Error("Invalid tags: " + tagsToCompile);
    openingTagRe = new RegExp(escapeRegExp(tagsToCompile[0]) + "\\s*"), closingTagRe = new RegExp("\\s*" + escapeRegExp(tagsToCompile[1])), closingCurlyRe = new RegExp("\\s*" + escapeRegExp("}" + tagsToCompile[1]));
  }
  compileTags(tags || mustache.tags);
  for (var scanner = new Scanner(template2), start, type, value, chr, token, openSection; !scanner.eos(); ) {
    if (start = scanner.pos, value = scanner.scanUntil(openingTagRe), value)
      for (var i = 0, valueLength = value.length; i < valueLength; ++i)
        chr = value.charAt(i), isWhitespace(chr) ? (spaces.push(tokens.length), indentation += chr) : (nonSpace = !0, lineHasNonSpace = !0, indentation += " "), tokens.push(["text", chr, start, start + 1]), start += 1, chr === `
` && (stripSpace(), indentation = "", tagIndex = 0, lineHasNonSpace = !1);
    if (!scanner.scan(openingTagRe))
      break;
    if (hasTag = !0, type = scanner.scan(tagRe) || "name", scanner.scan(whiteRe), type === "=" ? (value = scanner.scanUntil(equalsRe), scanner.scan(equalsRe), scanner.scanUntil(closingTagRe)) : type === "{" ? (value = scanner.scanUntil(closingCurlyRe), scanner.scan(curlyRe), scanner.scanUntil(closingTagRe), type = "&") : value = scanner.scanUntil(closingTagRe), !scanner.scan(closingTagRe))
      throw new Error("Unclosed tag at " + scanner.pos);
    if (type == ">" ? token = [type, value, start, scanner.pos, indentation, tagIndex, lineHasNonSpace] : token = [type, value, start, scanner.pos], tagIndex++, tokens.push(token), type === "#" || type === "^")
      sections.push(token);
    else if (type === "/") {
      if (openSection = sections.pop(), !openSection)
        throw new Error('Unopened section "' + value + '" at ' + start);
      if (openSection[1] !== value)
        throw new Error('Unclosed section "' + openSection[1] + '" at ' + start);
    } else
      type === "name" || type === "{" || type === "&" ? nonSpace = !0 : type === "=" && compileTags(value);
  }
  if (stripSpace(), openSection = sections.pop(), openSection)
    throw new Error('Unclosed section "' + openSection[1] + '" at ' + scanner.pos);
  return nestTokens(squashTokens(tokens));
}
function squashTokens(tokens) {
  for (var squashedTokens = [], token, lastToken, i = 0, numTokens = tokens.length; i < numTokens; ++i)
    token = tokens[i], token && (token[0] === "text" && lastToken && lastToken[0] === "text" ? (lastToken[1] += token[1], lastToken[3] = token[3]) : (squashedTokens.push(token), lastToken = token));
  return squashedTokens;
}
function nestTokens(tokens) {
  for (var nestedTokens = [], collector = nestedTokens, sections = [], token, section, i = 0, numTokens = tokens.length; i < numTokens; ++i)
    switch (token = tokens[i], token[0]) {
      case "#":
      case "^":
        collector.push(token), sections.push(token), collector = token[4] = [];
        break;
      case "/":
        section = sections.pop(), section[5] = token[2], collector = sections.length > 0 ? sections[sections.length - 1][4] : nestedTokens;
        break;
      default:
        collector.push(token);
    }
  return nestedTokens;
}
function Scanner(string) {
  this.string = string, this.tail = string, this.pos = 0;
}
Scanner.prototype.eos = function() {
  return this.tail === "";
};
Scanner.prototype.scan = function(re) {
  var match = this.tail.match(re);
  if (!match || match.index !== 0)
    return "";
  var string = match[0];
  return this.tail = this.tail.substring(string.length), this.pos += string.length, string;
};
Scanner.prototype.scanUntil = function(re) {
  var index = this.tail.search(re), match;
  switch (index) {
    case -1:
      match = this.tail, this.tail = "";
      break;
    case 0:
      match = "";
      break;
    default:
      match = this.tail.substring(0, index), this.tail = this.tail.substring(index);
  }
  return this.pos += match.length, match;
};
function Context(view, parentContext) {
  this.view = view, this.cache = { ".": this.view }, this.parent = parentContext;
}
Context.prototype.push = function(view) {
  return new Context(view, this);
};
Context.prototype.lookup = function(name) {
  var cache = this.cache, value;
  if (cache.hasOwnProperty(name))
    value = cache[name];
  else {
    for (var context = this, intermediateValue, names, index, lookupHit = !1; context; ) {
      if (name.indexOf(".") > 0)
        for (intermediateValue = context.view, names = name.split("."), index = 0; intermediateValue != null && index < names.length; )
          index === names.length - 1 && (lookupHit = hasProperty(intermediateValue, names[index]) || primitiveHasOwnProperty(intermediateValue, names[index])), intermediateValue = intermediateValue[names[index++]];
      else
        intermediateValue = context.view[name], lookupHit = hasProperty(context.view, name);
      if (lookupHit) {
        value = intermediateValue;
        break;
      }
      context = context.parent;
    }
    cache[name] = value;
  }
  return isFunction(value) && (value = value.call(this.view)), value;
};
function Writer() {
  this.templateCache = {
    _cache: {},
    set: function(key, value) {
      this._cache[key] = value;
    },
    get: function(key) {
      return this._cache[key];
    },
    clear: function() {
      this._cache = {};
    }
  };
}
Writer.prototype.clearCache = function() {
  typeof this.templateCache != "undefined" && this.templateCache.clear();
};
Writer.prototype.parse = function(template2, tags) {
  var cache = this.templateCache, cacheKey = template2 + ":" + (tags || mustache.tags).join(":"), isCacheEnabled = typeof cache != "undefined", tokens = isCacheEnabled ? cache.get(cacheKey) : void 0;
  return tokens == null && (tokens = parseTemplate(template2, tags), isCacheEnabled && cache.set(cacheKey, tokens)), tokens;
};
Writer.prototype.render = function(template2, view, partials, config) {
  var tags = this.getConfigTags(config), tokens = this.parse(template2, tags), context = view instanceof Context ? view : new Context(view, void 0);
  return this.renderTokens(tokens, context, partials, template2, config);
};
Writer.prototype.renderTokens = function(tokens, context, partials, originalTemplate, config) {
  for (var buffer = "", token, symbol, value, i = 0, numTokens = tokens.length; i < numTokens; ++i)
    value = void 0, token = tokens[i], symbol = token[0], symbol === "#" ? value = this.renderSection(token, context, partials, originalTemplate, config) : symbol === "^" ? value = this.renderInverted(token, context, partials, originalTemplate, config) : symbol === ">" ? value = this.renderPartial(token, context, partials, config) : symbol === "&" ? value = this.unescapedValue(token, context) : symbol === "name" ? value = this.escapedValue(token, context, config) : symbol === "text" && (value = this.rawValue(token)), value !== void 0 && (buffer += value);
  return buffer;
};
Writer.prototype.renderSection = function(token, context, partials, originalTemplate, config) {
  var self = this, buffer = "", value = context.lookup(token[1]);
  function subRender(template2) {
    return self.render(template2, context, partials, config);
  }
  if (value) {
    if (isArray(value))
      for (var j = 0, valueLength = value.length; j < valueLength; ++j)
        buffer += this.renderTokens(token[4], context.push(value[j]), partials, originalTemplate, config);
    else if (typeof value == "object" || typeof value == "string" || typeof value == "number")
      buffer += this.renderTokens(token[4], context.push(value), partials, originalTemplate, config);
    else if (isFunction(value)) {
      if (typeof originalTemplate != "string")
        throw new Error("Cannot use higher-order sections without the original template");
      value = value.call(context.view, originalTemplate.slice(token[3], token[5]), subRender), value != null && (buffer += value);
    } else
      buffer += this.renderTokens(token[4], context, partials, originalTemplate, config);
    return buffer;
  }
};
Writer.prototype.renderInverted = function(token, context, partials, originalTemplate, config) {
  var value = context.lookup(token[1]);
  if (!value || isArray(value) && value.length === 0)
    return this.renderTokens(token[4], context, partials, originalTemplate, config);
};
Writer.prototype.indentPartial = function(partial, indentation, lineHasNonSpace) {
  for (var filteredIndentation = indentation.replace(/[^ \t]/g, ""), partialByNl = partial.split(`
`), i = 0; i < partialByNl.length; i++)
    partialByNl[i].length && (i > 0 || !lineHasNonSpace) && (partialByNl[i] = filteredIndentation + partialByNl[i]);
  return partialByNl.join(`
`);
};
Writer.prototype.renderPartial = function(token, context, partials, config) {
  if (partials) {
    var tags = this.getConfigTags(config), value = isFunction(partials) ? partials(token[1]) : partials[token[1]];
    if (value != null) {
      var lineHasNonSpace = token[6], tagIndex = token[5], indentation = token[4], indentedValue = value;
      tagIndex == 0 && indentation && (indentedValue = this.indentPartial(value, indentation, lineHasNonSpace));
      var tokens = this.parse(indentedValue, tags);
      return this.renderTokens(tokens, context, partials, indentedValue, config);
    }
  }
};
Writer.prototype.unescapedValue = function(token, context) {
  var value = context.lookup(token[1]);
  if (value != null)
    return value;
};
Writer.prototype.escapedValue = function(token, context, config) {
  var escape = this.getConfigEscape(config) || mustache.escape, value = context.lookup(token[1]);
  if (value != null)
    return typeof value == "number" && escape === mustache.escape ? String(value) : escape(value);
};
Writer.prototype.rawValue = function(token) {
  return token[1];
};
Writer.prototype.getConfigTags = function(config) {
  return isArray(config) ? config : config && typeof config == "object" ? config.tags : void 0;
};
Writer.prototype.getConfigEscape = function(config) {
  if (config && typeof config == "object" && !isArray(config))
    return config.escape;
};
var mustache = {
  name: "mustache.js",
  version: "4.2.0",
  tags: ["{{", "}}"],
  clearCache: void 0,
  escape: void 0,
  parse: void 0,
  render: void 0,
  Scanner: void 0,
  Context: void 0,
  Writer: void 0,
  /**
   * Allows a user to override the default caching strategy, by providing an
   * object with set, get and clear methods. This can also be used to disable
   * the cache by setting it to the literal `undefined`.
   */
  set templateCache(cache) {
    defaultWriter.templateCache = cache;
  },
  /**
   * Gets the default or overridden caching object from the default writer.
   */
  get templateCache() {
    return defaultWriter.templateCache;
  }
}, defaultWriter = new Writer();
mustache.clearCache = function() {
  return defaultWriter.clearCache();
};
mustache.parse = function(template2, tags) {
  return defaultWriter.parse(template2, tags);
};
mustache.render = function(template2, view, partials, config) {
  if (typeof template2 != "string")
    throw new TypeError('Invalid template! Template should be a "string" but "' + typeStr(template2) + '" was given as the first argument for mustache#render(template, view, partials)');
  return defaultWriter.render(template2, view, partials, config);
};
mustache.escape = escapeHtml;
mustache.Scanner = Scanner;
mustache.Context = Context;
mustache.Writer = Writer;
var mustache_default = mustache;

// node_modules/.pnpm/delegate-it@5.0.0/node_modules/delegate-it/index.js
var ledger = /* @__PURE__ */ new WeakMap();
function editLedger(wanted, baseElement, callback, setup) {
  var _a, _b;
  if (!wanted && !ledger.has(baseElement))
    return !1;
  let elementMap = (_a = ledger.get(baseElement)) != null ? _a : /* @__PURE__ */ new WeakMap();
  if (ledger.set(baseElement, elementMap), !wanted && !ledger.has(baseElement))
    return !1;
  let setups = (_b = elementMap.get(callback)) != null ? _b : /* @__PURE__ */ new Set();
  elementMap.set(callback, setups);
  let existed = setups.has(setup);
  return wanted ? setups.add(setup) : setups.delete(setup), existed && wanted;
}
function isEventTarget(elements) {
  return typeof elements.addEventListener == "function";
}
function safeClosest(event, selector) {
  let target = event.target;
  if (target instanceof Text && (target = target.parentElement), target instanceof Element && event.currentTarget instanceof Element) {
    let closest = target.closest(selector);
    if (closest && event.currentTarget.contains(closest))
      return closest;
  }
}
function delegate(base, selector, type, callback, options) {
  let listenerOptions = typeof options == "object" ? options : { capture: options };
  delete listenerOptions.once;
  let { signal } = listenerOptions;
  if (signal != null && signal.aborted)
    return;
  if (typeof base == "string" && (base = document.querySelectorAll(base)), !isEventTarget(base)) {
    for (let element of base)
      delegate(element, selector, type, callback, listenerOptions);
    return;
  }
  let baseElement = base instanceof Document ? base.documentElement : base, capture = Boolean(typeof options == "object" ? options.capture : options), listenerFn = (event) => {
    let delegateTarget = safeClosest(event, selector);
    if (delegateTarget) {
      let delegateEvent = Object.assign(event, { delegateTarget });
      callback.call(baseElement, delegateEvent);
    }
  }, setup = JSON.stringify({ selector, type, capture });
  editLedger(!0, baseElement, callback, setup) || baseElement.addEventListener(type, listenerFn, listenerOptions), signal == null || signal.addEventListener("abort", () => {
    editLedger(!1, baseElement, callback, setup);
  });
}
var delegate_it_default = delegate;

// src/popup.ts
var linkSelector = `a.${RJ_CODE_LINK_CLASS}`, template = `
  <img src="{{ image }}">
  <div class="info">
    <h3>{{ name }}</h3>
    {{ #rating }}<p><span>\u8BC4\u4EF7\uFF1A</span><span>{{ rating }}</span></p>{{ /rating }}
    {{ #sale }}<p><span>\u8D29\u5356\u6570\uFF1A</span><span>{{ sale }}</span></p>{{ /sale }}
    {{ #group }}<p><span>\u793E\u56E2\u540D\uFF1A</span><span>{{ group }}</span></p>{{ /group }}
    {{ #date }}<p><span>\u8D29\u5356\u65E5\uFF1A</span><span>{{ date }}</span></p>{{ /date }}
    {{ #series }}<p><span>\u7CFB\u5217\u540D\uFF1A</span><span>{{ series }}</span></p>{{ /series }}
    {{ #hasCreators }}<p><span>\u4F5C\u8005\uFF1A</span>{{ #creators }}<span>{{ . }} / </span>{{ /creators }}</p>{{ /hasCreators }}
    {{ #hasScenarios }}<p><span>\u5267\u60C5\uFF1A</span>{{ #scenarios }}<span>{{ . }} / </span>{{ /scenarios }}</p>{{ /hasScenarios }}
    {{ #hasIllusts }}<p><span>\u63D2\u753B\uFF1A</span>{{ #illusts }}<span>{{ . }} / </span>{{ /illusts }}</p>{{ /hasIllusts }}
    {{ #hasVoices }}<p><span>\u58F0\u4F18\uFF1A</span>{{ #voices }}<span>{{ . }} / </span>{{ /voices }}</p>{{ /hasVoices }}
    {{ #hasMusics }}<p><span>\u97F3\u4E50\uFF1A</span>{{ #musics }}<span>{{ . }} / </span>{{ /musics }}</p>{{ /hasMusics }}
    {{ #age }}<p><span>\u5E74\u9F84\u6307\u5B9A\uFF1A</span><span>{{ age }}</span></p>{{ /age }}
    {{ #type }}<p><span>\u4F5C\u54C1\u7C7B\u578B\uFF1A</span><span>{{ type }}</span></p>{{ /type }}
    {{ #hasTags }}<p><span>\u5206\u7C7B\uFF1A</span>{{ #tags }}<span>{{ . }} </span>{{ /tags }}</p>{{ /hasTags }}
  </div>`, currentWork, currentRj;
async function show(x, y) {
  cancelHide();
  let popup = document.getElementById("rj-popup"), tempRj = currentRj;
  popup.dataset.rj && popup.dataset.rj !== tempRj && (popup.innerHTML = "");
  let temp = await fetch_rj_default(tempRj);
  if ((currentRj === tempRj || !currentWork) && (currentWork = temp), console.debug("[rj-code-preview/work]", currentWork), !hided && currentWork) {
    let rendered = mustache_default.render(template, currentWork, null, {
      escape: (it) => it
    });
    console.debug("[rj-code-preview/rendered]", rendered), popup.innerHTML = rendered, popup.dataset.rj = tempRj, move(x, y);
    let img = popup.getElementsByTagName("img").item(0);
    img.onload = () => setTimeout(() => move(x, y)), img.onerror = () => setTimeout(() => move(x, y));
    // 渲染后追加“本地 Kikoeru 是否已有该 RJ / 其多语言版本”的检查行
    renderKikoeruLocal(popup, tempRj, temp);
  }
  hided = !1;
}
var hided = !1;
var hideTimer = 0;
function cancelHide() {
  hideTimer && (clearTimeout(hideTimer), hideTimer = 0);
}
function scheduleHide() {
  cancelHide(), hideTimer = setTimeout(() => {
    hideTimer = 0, hide();
  }, 400);
}
function hide() {
  cancelHide(), hided = !0, currentRj = void 0, currentWork = void 0, document.getElementById("rj-popup").innerHTML = "";
}
var lastMouseX = 0, lastMouseY = 0;
function move(x, y) {
  lastMouseX = x, lastMouseY = y;
  let popup = document.getElementById("rj-popup");
  // 放不下时贴到鼠标另一侧，保证弹窗始终紧邻指针、可以移入点击
  let left = x + popup.offsetWidth + 16 < window.innerWidth ? x + 8 : Math.max(8, x - popup.offsetWidth - 8);
  let top = y + popup.offsetHeight + 16 < window.innerHeight ? y + 8 : Math.max(8, y - popup.offsetHeight - 8);
  popup.style.left = left + "px", popup.style.top = top + "px";
}
delegate_it_default(document.body, linkSelector, "mouseout", () => scheduleHide());
delegate_it_default(document.body, linkSelector, "mouseover", (event) => {
  currentRj = event.target.dataset[RJ_CODE_ATTRIBUTE], console.debug("[rj-code-preview/rj]", currentRj), currentRj && (hided = !1, show(event.clientX, event.clientY).then());
});
delegate_it_default(
  document.body,
  linkSelector,
  "mousemove",
  (event) => move(event.clientX, event.clientY)
);
function initPopup() {
  let popup = document.createElement("div");
  popup.id = "rj-popup", document.body.append(popup);
  // 弹窗可停留：移入弹窗时取消隐藏，移出后再关闭，便于点击「打开 / 未配置」
  popup.addEventListener("mouseenter", cancelHide);
  popup.addEventListener("mouseover", cancelHide);
  popup.addEventListener("mousemove", cancelHide);
  popup.addEventListener("mouseleave", () => hide());
  let style2 = document.createElement("style");
  style2.innerHTML = `
  #rj-popup {
    max-width: min(calc(100vw - 16px), 360px);
    max-height: calc(100vh - 32px);
    position: fixed;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    color: #fff;
    background-color: #424242;
    border-radius: 12px;
    z-index: 99999;
  }
  #rj-popup > img {
    width: 100%;
    height: auto;
    border-radius: 0;
  }
  
  #rj-popup > .info {
    padding: 12px 16px;
    font-size: 0.88rem;
    line-height: 1.2;
    display: grid;
    grid-gap: 6px;
    box-sizing: border-box;
  }
  
  #rj-popup > .info > * {
    margin: 0;
  }
  
  #rj-popup > .info > h3 {
    color: inherit;
    font-size: 1.1rem;
    font-weight: bold;
    line-height: 1;
  }
  /* ---- Kikoeru 本地库检查行（新增） ---- */
  #rj-popup > .info > .rj-local {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    gap: 4px;
    padding-top: 6px;
    border-top: 1px solid rgba(255, 255, 255, 0.14);
  }
  #rj-popup .rj-local .v {
    flex: 1 1 auto;
  }
  #rj-popup .rj-local .state-ok { color: #7ee787; }
  #rj-popup .rj-local .state-miss { color: #cfcfcf; }
  #rj-popup .rj-local .state-err { color: #ff8a80; }
  #rj-popup .rj-local .state-loading { color: #a0a0a0; }
  #rj-popup .rj-local a {
    color: #82b1ff;
    text-decoration: none;
  }
  #rj-popup .rj-local a:hover { text-decoration: underline; }
  #rj-popup .rj-local[data-state="unconfigured"],
  #rj-popup .rj-local[data-state="error"] { cursor: pointer; }
  /* ---- Kikoeru 设置弹窗（新增） ---- */
  #rj-kikoeru-settings {
    position: fixed;
    inset: 0;
    z-index: 100000;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(0, 0, 0, 0.55);
    color: #eee;
    font-size: 0.9rem;
  }
  #rj-kikoeru-settings .panel {
    width: min(92vw, 400px);
    max-height: calc(100vh - 32px);
    overflow: auto;
    box-sizing: border-box;
    background: #333;
    border-radius: 10px;
    padding: 16px 18px;
    display: grid;
    gap: 10px;
    box-shadow: 0 8px 30px rgba(0, 0, 0, 0.5);
  }
  #rj-kikoeru-settings h3 {
    margin: 0;
    font-size: 1rem;
    font-weight: bold;
  }
  #rj-kikoeru-settings .desc {
    margin: 0;
    color: #b8b8b8;
    font-size: 0.8rem;
    line-height: 1.4;
  }
  #rj-kikoeru-settings label {
    display: grid;
    gap: 4px;
  }
  #rj-kikoeru-settings input {
    box-sizing: border-box;
    width: 100%;
    padding: 6px 8px;
    border: 1px solid #555;
    border-radius: 6px;
    background: #262626;
    color: #eee;
    font-size: 0.9rem;
  }
  #rj-kikoeru-settings .msg {
    margin: 0;
    min-height: 1.2em;
    font-size: 0.8rem;
    color: #9be89b;
  }
  #rj-kikoeru-settings .msg.err { color: #ff8a80; }
  #rj-kikoeru-settings .actions {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
  }
  #rj-kikoeru-settings button {
    padding: 6px 12px;
    border: 0;
    border-radius: 6px;
    background: #555;
    color: #eee;
    cursor: pointer;
    font-size: 0.85rem;
  }
  #rj-kikoeru-settings button.primary { background: #1976d2; }
  #rj-kikoeru-settings button:hover { filter: brightness(1.15); }`, document.head.append(style2);
}

// src/kikoeru-local.ts
// 新增：检查本地 Kikoeru 是否已收录该 RJ，以及同作品的日文版 / 简体中文版 / 繁体中文版。
// 多语言版本来自 DLSite product.json 的 language_editions（逻辑同 prekikoeru dlrenamer.getLanguageEdition）。
// 本地检索走 Kikoeru 的 GET /api/search?keyword=RJxxxxxx&nsfw=0，登录走 POST /api/auth/me。
var KIKOERU_CONFIG_KEY = "kikoeru.config";
var KIKOERU_TOKEN_KEY = "kikoeru.token";
var KIKOERU_LANG_LABEL = {
  ja_jp: "日文版",
  zh_cn: "简体中文版",
  zh_tw: "繁体中文版"
};
var KIKOERU_LANG_ORDER = ["ja_jp", "zh_cn", "zh_tw"];
var KIKOERU_LANG_KEY = {
  JPN: "ja_jp",
  CHI_HANS: "zh_cn",
  CHI_HANT: "zh_tw"
};
var kikoeruTokenState = null;
var kikoeruCheckSeq = 0;
var kikoeruResultCache = Object.create(null);
function kikoeruNormalizeBaseUrl(value) {
  var url = String(value || "").trim().replace(/\/+$/, "");
  if (!url)
    return "";
  if (!/^https?:\/\//i.test(url))
    url = "http://" + url;
  return url;
}
function kikoeruReadConfig() {
  var saved = GM_getValue(KIKOERU_CONFIG_KEY, null);
  if (!saved || typeof saved !== "object")
    saved = {};
  return {
    baseUrl: kikoeruNormalizeBaseUrl(saved.baseUrl),
    username: String(saved.username || "").trim(),
    password: String(saved.password || "")
  };
}
function kikoeruSaveConfig(config) {
  GM_setValue(KIKOERU_CONFIG_KEY, {
    baseUrl: kikoeruNormalizeBaseUrl(config.baseUrl),
    username: String(config.username || "").trim(),
    password: String(config.password || "")
  });
  kikoeruTokenState = null;
  kikoeruResultCache = Object.create(null);
  GM_setValue(KIKOERU_TOKEN_KEY, null);
}
function kikoeruError(code, message) {
  var err = new Error(message || code);
  err.code = code;
  return err;
}
function kikoeruRequest(options) {
  return new Promise(function(resolve, reject) {
    if (typeof GM_xmlhttpRequest !== "function") {
      reject(kikoeruError("unsupported", "\u5F53\u524D\u811A\u672C\u7BA1\u7406\u5668\u4E0D\u652F\u6301 GM_xmlhttpRequest"));
      return;
    }
    GM_xmlhttpRequest({
      method: options.method || "GET",
      url: options.url,
      headers: options.headers || {},
      data: options.data,
      timeout: options.timeout || 8e3,
      responseType: "json",
      onload: function(resp) {
        resolve(resp);
      },
      onerror: function() {
        reject(kikoeruError("network", "\u7F51\u7EDC\u9519\u8BEF"));
      },
      ontimeout: function() {
        reject(kikoeruError("timeout", "\u8BF7\u6C42\u8D85\u65F6"));
      },
      onabort: function() {
        reject(kikoeruError("abort", "\u8BF7\u6C42\u5DF2\u53D6\u6D88"));
      }
    });
  });
}
function kikoeruJson(resp) {
  if (!resp)
    return null;
  var body = resp.response;
  if (body && typeof body === "object")
    return body;
  try {
    return JSON.parse(resp.responseText || body || "null");
  } catch (e) {
    return null;
  }
}
function kikoeruConnect(config, persist) {
  if (!config.baseUrl || !config.username || !config.password)
    return Promise.reject(kikoeruError("unconfigured", "\u672A\u914D\u7F6E Kikoeru"));
  return kikoeruRequest({
    method: "POST",
    url: config.baseUrl + "/api/auth/me",
    headers: { "Content-Type": "application/json" },
    data: JSON.stringify({ name: config.username, password: config.password })
  }).then(function(resp) {
    var data = kikoeruJson(resp);
    if (resp.status !== 200 || !data || !data.token) {
      if (resp.status === 401)
        throw kikoeruError("auth", "\u7528\u6237\u540D\u6216\u5BC6\u7801\u9519\u8BEF");
      if (resp.status === 422)
        throw kikoeruError("auth", "\u7528\u6237\u540D/\u5BC6\u7801\u683C\u5F0F\u4E0D\u6B63\u786E");
      throw kikoeruError("login", "\u767B\u5F55\u5931\u8D25\uFF08HTTP " + resp.status + "\uFF09");
    }
    if (persist) {
      kikoeruTokenState = { baseUrl: config.baseUrl, token: data.token, time: Date.now() };
      GM_setValue(KIKOERU_TOKEN_KEY, kikoeruTokenState);
    }
    return data.token;
  });
}
function kikoeruLogin(force) {
  var config = kikoeruReadConfig();
  if (!config.baseUrl || !config.username || !config.password)
    return Promise.reject(kikoeruError("unconfigured", "\u672A\u914D\u7F6E Kikoeru"));
  if (!force && kikoeruTokenState && kikoeruTokenState.baseUrl === config.baseUrl)
    return Promise.resolve(kikoeruTokenState.token);
  if (!force) {
    var saved = GM_getValue(KIKOERU_TOKEN_KEY, null);
    if (saved && saved.baseUrl === config.baseUrl && saved.token && Date.now() - (saved.time || 0) < 7 * 24 * 3600 * 1e3) {
      kikoeruTokenState = saved;
      return Promise.resolve(saved.token);
    }
  }
  return kikoeruConnect(config, true);
}
function kikoeruNormalizeWorkNo(value) {
  return String(value == null ? "" : value).trim().toUpperCase().replace(/^[A-Z]+/, "").replace(/^0+/, "");
}
function kikoeruSearch(rjCode) {
  var config = kikoeruReadConfig();
  var digits = String(rjCode || "").toUpperCase().replace(/^[A-Z]+/, "");
  var target = kikoeruNormalizeWorkNo(rjCode);
  var attempt = 0;
  function run(forceLogin) {
    return kikoeruLogin(forceLogin).then(function(token) {
      return kikoeruRequest({
        url: config.baseUrl + "/api/search?keyword=" + encodeURIComponent("RJ" + digits) + "&nsfw=0&page=1",
        headers: { Authorization: "Bearer " + token, Accept: "application/json" }
      }).then(function(resp) {
        if (resp.status === 401 && attempt === 0) {
          attempt += 1;
          kikoeruTokenState = null;
          GM_setValue(KIKOERU_TOKEN_KEY, null);
          return run(true);
        }
        var data = kikoeruJson(resp);
        if (resp.status !== 200 || !data)
          throw kikoeruError("http", "\u67E5\u8BE2\u5931\u8D25\uFF08HTTP " + resp.status + "\uFF09");
        var works = data.works || [];
        for (var i = 0; i < works.length; i++) {
          if (kikoeruNormalizeWorkNo(works[i].id) === target)
            return { id: works[i].id, rj: String(rjCode).toUpperCase(), title: works[i].title || "" };
        }
        return null;
      });
    });
  }
  return run(false);
}
function kikoeruCandidates(rjCode, work) {
  var self = String(rjCode || "").toUpperCase();
  var editions = work && Array.isArray(work.editions) ? work.editions : [];
  var translation = work && work.translation && typeof work.translation === "object" ? work.translation : {};
  var slots = { ja_jp: null, zh_cn: null, zh_tw: null };
  var selfLang = null;
  var ordered = [];
  editions.forEach(function(edition) {
    if (edition && String(edition.workno || "").toUpperCase() === self)
      ordered.push(edition);
  });
  editions.forEach(function(edition) {
    ordered.push(edition);
  });
  var seen = {};
  ordered.forEach(function(edition) {
    if (!edition)
      return;
    var workno = String(edition.workno || "").toUpperCase();
    if (!workno || seen[workno])
      return;
    seen[workno] = true;
    var langKey = KIKOERU_LANG_KEY[String(edition.lang || "").toUpperCase()] || null;
    if (workno === self && langKey && !selfLang)
      selfLang = langKey;
    if (langKey && !slots[langKey])
      slots[langKey] = workno;
  });
  if (!slots.ja_jp) {
    var original = String(translation.original_workno || "").toUpperCase();
    if (original)
      slots.ja_jp = original;
  }
  if (!selfLang) {
    var translationLang = String(translation.lang || "").toUpperCase();
    selfLang = translationLang ? KIKOERU_LANG_KEY[translationLang] || null : "ja_jp";
  }
  var list = [{ rj: self, lang: selfLang }];
  KIKOERU_LANG_ORDER.forEach(function(langKey) {
    var workno = slots[langKey];
    if (workno && workno !== self)
      list.push({ rj: workno, lang: langKey });
  });
  return list;
}
function kikoeruErrorText(err) {
  if (!err)
    return "\u67E5\u8BE2\u5931\u8D25\uFF08\u70B9\u51FB\u8BBE\u7F6E\uFF09";
  if (err.code === "network" || err.code === "timeout")
    return "\u65E0\u6CD5\u8FDE\u63A5\uFF08\u70B9\u51FB\u8BBE\u7F6E\uFF09";
  if (err.code === "auth" || err.code === "login")
    return "\u767B\u5F55\u5931\u8D25\uFF08\u70B9\u51FB\u8BBE\u7F6E\uFF09";
  return "\u67E5\u8BE2\u5931\u8D25\uFF08\u70B9\u51FB\u8BBE\u7F6E\uFF09";
}
function kikoeruRow(popup) {
  var row = popup.querySelector(".rj-local");
  if (!row) {
    row = document.createElement("p");
    row.className = "rj-local";
    row.innerHTML = '<span class="k"></span><span class="v"></span>';
    row.addEventListener("click", function(event) {
      if (event.target && event.target.tagName === "A")
        return;
      if (row.dataset.state === "unconfigured" || row.dataset.state === "error")
        kikoeruOpenSettings();
    });
    var info = popup.querySelector(".info");
    (info || popup).appendChild(row);
  }
  return row;
}
function kikoeruSetRow(popup, state, text, options) {
  options = options || {};
  var row = kikoeruRow(popup);
  row.dataset.state = state;
  row.title = options.title || "";
  row.querySelector(".k").textContent = "\u672C\u5730\u5E93\uFF1A";
  var value = row.querySelector(".v");
  var className = state === "found" ? "ok" : state === "missing" ? "miss" : state === "unconfigured" ? "err" : state;
  value.className = "v state-" + className;
  value.textContent = text;
  if (options.link) {
    value.appendChild(document.createTextNode(" "));
    var link = document.createElement("a");
    link.href = options.link.href;
    link.target = "_blank";
    link.rel = "noreferrer";
    link.textContent = options.link.text;
    value.appendChild(link);
  }
  // 内容变化会改变弹窗高度，重新贴住指针，避免遮住/远离鼠标导致无法点击
  move(lastMouseX, lastMouseY);
  return row;
}
function kikoeruRenderResults(popup, seq, rjCode, results) {
  if (seq !== kikoeruCheckSeq || currentRj !== rjCode)
    return;
    var hits = results.filter(function(result) {
      return result.hit;
    });
    var errors = results.filter(function(result) {
      return result.error;
    });
    if (hits.length) {
      var labels = [];
      hits.forEach(function(hit) {
        var label = KIKOERU_LANG_LABEL[hit.lang] || "\u8BE5\u7248\u672C";
        if (labels.indexOf(label) < 0)
          labels.push(label);
      });
      var detail = results.map(function(result) {
        return (KIKOERU_LANG_LABEL[result.lang] || "\u8BE5\u7248\u672C") + "\uFF1A" + result.rj + " " + (result.hit ? "\u5DF2\u6536\u5F55" : result.error ? "\u67E5\u8BE2\u5931\u8D25" : "\u672A\u6536\u5F55");
      }).join("\n");
      var base = kikoeruReadConfig().baseUrl;
      var link = hits[0].hit.id != null && base ? {
        href: base + "/work/" + encodeURIComponent(hits[0].hit.id),
        text: "\u6253\u5F00"
      } : null;
      kikoeruSetRow(popup, "found", "\u5DF2\u6536\u5F55\uFF08" + labels.join("\u3001") + "\uFF09", {
        title: detail,
        link
      });
      return;
    }
    if (errors.length) {
      if (errors[0].error.code === "unconfigured") {
        kikoeruSetRow(popup, "unconfigured", "\u672A\u914D\u7F6E\uFF08\u70B9\u51FB\u8BBE\u7F6E\uFF09", { title: "\u586B\u5199\u672C\u5730 Kikoeru \u5730\u5740\u4E0E\u8D26\u53F7\u540E\u5373\u53EF\u68C0\u67E5\u6536\u85CF" });
      } else {
        kikoeruSetRow(popup, "error", kikoeruErrorText(errors[0].error), { title: errors[0].error.message });
      }
      return;
    }
    var names = results.map(function(result) {
      return KIKOERU_LANG_LABEL[result.lang] || "\u8BE5\u7248\u672C";
    });
    var uniqueNames = names.filter(function(name, index) {
      return names.indexOf(name) === index;
    });
    kikoeruSetRow(popup, "missing", "\u672A\u6536\u5F55", { title: "\u5DF2\u68C0\u67E5\uFF1A" + uniqueNames.join(" / ") });
}
function kikoeruRunCheck(popup, rjCode, work) {
  var seq = ++kikoeruCheckSeq;
  var cached = kikoeruResultCache[rjCode];
  if (cached && Date.now() - cached.time < 3e5) {
    kikoeruRenderResults(popup, seq, rjCode, cached.results);
    return;
  }
  kikoeruSetRow(popup, "loading", "检查中…");
  var candidates = kikoeruCandidates(rjCode, work);
  kikoeruLogin(false).then(function() {
    return Promise.all(candidates.map(function(candidate) {
      return kikoeruSearch(candidate.rj).then(function(hit) {
        return { lang: candidate.lang, rj: candidate.rj, hit: hit };
      }, function(err) {
        return { lang: candidate.lang, rj: candidate.rj, error: err };
      });
    }));
  }).then(function(results) {
    if (!results.some(function(result) {
      return result.error;
    }))
      kikoeruResultCache[rjCode] = { time: Date.now(), results: results };
    kikoeruRenderResults(popup, seq, rjCode, results);
  }).catch(function(err) {
    if (seq !== kikoeruCheckSeq || currentRj !== rjCode)
      return;
    if (err && err.code === "unconfigured")
      kikoeruSetRow(popup, "unconfigured", "未配置（点击设置）", { title: "填写本地 Kikoeru 地址与账号后即可检查收藏" });
    else
      kikoeruSetRow(popup, "error", kikoeruErrorText(err), { title: err ? err.message : "" });
  });
}
function renderKikoeruLocal(popup, rjCode, work) {
  if (!popup || !rjCode)
    return;
  kikoeruRunCheck(popup, rjCode, work);
}
function kikoeruOpenSettings() {
  var existing = document.getElementById("rj-kikoeru-settings");
  if (existing) {
    existing.style.display = "flex";
    return;
  }
  var config = kikoeruReadConfig();
  var overlay = document.createElement("div");
  overlay.id = "rj-kikoeru-settings";
  overlay.innerHTML = '<div class="panel"><h3>Kikoeru \u672C\u5730\u5E93\u8BBE\u7F6E</h3><p class="desc">\u7528\u4E8E\u68C0\u67E5 RJ \u4F5C\u54C1\u662F\u5426\u5DF2\u6536\u5F55\u5230\u672C\u5730 Kikoeru\uFF08\u540C\u65F6\u68C0\u67E5\u540C\u4F5C\u54C1\u7684\u65E5\u6587\u7248\u3001\u7B80\u4F53\u4E2D\u6587\u7248\u3001\u7E41\u4F53\u4E2D\u6587\u7248\uFF09\u3002\u8D26\u53F7\u5BC6\u7801\u4EC5\u4FDD\u5B58\u5728\u811A\u672C\u5B58\u50A8\u4E2D\uFF08\u660E\u6587\uFF09\u3002</p><label>\u5730\u5740<input name="baseUrl" type="text" placeholder="http://192.168.1.10:9087"></label><label>\u7528\u6237\u540D<input name="username" type="text" autocomplete="username"></label><label>\u5BC6\u7801<input name="password" type="password" autocomplete="current-password"></label><p class="msg"></p><div class="actions"><button type="button" data-action="test">\u6D4B\u8BD5\u8FDE\u63A5</button><button type="button" class="primary" data-action="save">\u4FDD\u5B58</button><button type="button" data-action="close">\u5173\u95ED</button></div></div>';
  document.body.appendChild(overlay);
  var panel = overlay.querySelector(".panel");
  var inputBase = panel.querySelector('[name="baseUrl"]');
  var inputUser = panel.querySelector('[name="username"]');
  var inputPass = panel.querySelector('[name="password"]');
  var msg = panel.querySelector(".msg");
  inputBase.value = config.baseUrl;
  inputUser.value = config.username;
  inputPass.value = config.password;
  function showMessage(text, isError) {
    msg.textContent = text;
    msg.className = "msg" + (isError ? " err" : "");
  }
  function close() {
    overlay.remove();
  }
  function readInputs() {
    return {
      baseUrl: inputBase.value,
      username: inputUser.value,
      password: inputPass.value
    };
  }
  panel.querySelector('[data-action="close"]').addEventListener("click", close);
  overlay.addEventListener("click", function(event) {
    if (event.target === overlay)
      close();
  });
  overlay.addEventListener("keydown", function(event) {
    if (event.key === "Escape")
      close();
  });
  panel.querySelector('[data-action="save"]').addEventListener("click", function() {
    var next = readInputs();
    if (!kikoeruNormalizeBaseUrl(next.baseUrl) || !next.username.trim() || !next.password) {
      showMessage("\u8BF7\u586B\u5199\u5730\u5740\u3001\u7528\u6237\u540D\u548C\u5BC6\u7801", true);
      return;
    }
    kikoeruSaveConfig(next);
    showMessage("\u5DF2\u4FDD\u5B58\uFF0C\u4E0B\u6B21\u60AC\u505C RJ \u7801\u65F6\u751F\u6548");
  });
  panel.querySelector('[data-action="test"]').addEventListener("click", function() {
    var next = readInputs();
    var config2 = {
      baseUrl: kikoeruNormalizeBaseUrl(next.baseUrl),
      username: next.username.trim(),
      password: next.password
    };
    showMessage("\u6B63\u5728\u8FDE\u63A5\u2026");
    kikoeruConnect(config2, false).then(function() {
      showMessage("\u8FDE\u63A5\u6210\u529F");
    }).catch(function(err) {
      showMessage(err && err.message ? err.message : "\u8FDE\u63A5\u5931\u8D25", true);
    });
  });
  if (document.activeElement && document.activeElement.blur)
    document.activeElement.blur();
  inputBase.focus();
}
if (typeof GM_registerMenuCommand === "function") {
  try {
    GM_registerMenuCommand("Kikoeru \u672C\u5730\u5E93\u8BBE\u7F6E\u2026", kikoeruOpenSettings);
  } catch (e) {
  }
}

// src/index.ts
var observer = new MutationObserver((records) => {
  for (let { addedNodes } of records)
    for (let node of addedNodes)
      hack_rj_code_default(node);
});
observer.observe(document.body, { childList: !0, subtree: !0 });
hack_rj_code_default(document.body);
var style = document.createElement("style");
style.innerHTML = `
.${RJ_CODE_LINK_CLASS} {
  color: inherit;
  -webkit-text-stroke-width: 1px;
  
  /* \u5E7B\u60F3\u6B21\u5143\u9996\u9875\u5217\u8868\u4F1A\u8BA9\u5BBD\u5EA6\u53D8\u6210 70% */
  width: fit-content !important;
  
  /* \u5E7B\u60F3\u6B21\u5143\u548C\u7EC5\u58EB\u4E4B\u5EAD\u4F1A\u8BA9 a \u6807\u7B7E\u6362\u884C */
  display: inline-flex !important;
  line-height: 1;
  
  /* [[\u7EC5\u58EB\u4E4B\u5EAD]] \u9996\u9875\u6807\u9898\u7684 [[RJ \u7801]] \u4F1A\u53D8\u5F97\u5F88\u5927 */
  font-size: inherit !important;
  
  /* [[\u5357+]] \u7684\u5E16\u5B50\u5217\u8868\u4F1A\u7ED9 a \u6807\u7B7E\u4E00\u4E2A\u53F3\u4FA7 [[margin]] */
  margin: 0;
  
  align-items: center;
}`;
document.head.append(style);
initPopup();
document.addEventListener("securitypolicyviolation", (e) => {
  e.blockedURI.includes("img.dlsite.jp") && document.querySelector(`img[src="${e.blockedURI}"]`).remove();
});
/*! Bundled license information:

mustache/mustache.mjs:
  (*!
   * mustache.js - Logic-less {{mustache}} templates with JavaScript
   * http://github.com/janl/mustache.js
   *)
*/
