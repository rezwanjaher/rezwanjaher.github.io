// assets/visitors/visitors.js
// Visitor map for the site footer.
// Calls the Cloudflare Worker once per browser per day to record a visit,
// otherwise only reads the totals. Draws a world map with one dot per country
// and a row of the top countries with flags and counts.

(function () {
  // Set this to your Worker's address after deploying it (no trailing slash).
  var WORKER_URL = "https://visitor-counter.rezwan-plabon.workers.dev";

  var MAP_URL = "assets/visitors/world-map.json";
  var TOP_N = 8;
  var root = document.getElementById("visitor-map");
  if (!root) return;

  function today() {
    return new Date().toISOString().slice(0, 10);
  }

  // Count each browser at most once a day. Storage can fail (private mode),
  // in which case we only read the totals.
  function shouldCount() {
    try {
      if (localStorage.getItem("vm_day") === today()) return false;
      localStorage.setItem("vm_day", today());
      return true;
    } catch (e) {
      return false;
    }
  }

  function svgEl(tag, attrs) {
    var el = document.createElementNS("http://www.w3.org/2000/svg", tag);
    for (var k in attrs) el.setAttribute(k, attrs[k]);
    return el;
  }

  function render(map, counts) {
    var codes = Object.keys(counts).filter(function (c) {
      return counts[c] > 0;
    });
    var total = codes.reduce(function (s, c) { return s + counts[c]; }, 0);
    var max = codes.reduce(function (m, c) { return Math.max(m, counts[c]); }, 1);

    root.innerHTML = "";

    var svg = svgEl("svg", {
      viewBox: "0 0 " + map.W + " " + map.H,
      class: "vm-svg",
      role: "img",
      "aria-label": "World map of site visitors"
    });
    svg.appendChild(svgEl("path", { d: map.sphere, class: "vm-sphere" }));
    svg.appendChild(svgEl("path", { d: map.landPath, class: "vm-land" }));

    // Smaller dots drawn last so they stay visible on top of larger ones.
    codes
      .slice()
      .sort(function (a, b) { return counts[b] - counts[a]; })
      .forEach(function (c) {
        var p = map.pts[c];
        if (!p) return;
        var r = 5 + 13 * Math.sqrt(counts[c] / max);
        var dot = svgEl("circle", { cx: p[0], cy: p[1], r: r.toFixed(1), class: "vm-dot" });
        var title = svgEl("title", {});
        title.textContent = (map.names[c] || c) + ": " + counts[c];
        dot.appendChild(title);
        svg.appendChild(dot);
      });
    root.appendChild(svg);

    var summary = document.createElement("p");
    summary.className = "vm-summary";
    summary.textContent =
      total.toLocaleString() + " visits from " + codes.length +
      (codes.length === 1 ? " country" : " countries");
    root.appendChild(summary);

    var list = document.createElement("ul");
    list.className = "vm-flags";
    codes
      .sort(function (a, b) { return counts[b] - counts[a]; })
      .slice(0, TOP_N)
      .forEach(function (c) {
        var li = document.createElement("li");
        var name = map.names[c] || c;
        li.title = name;
        var img = document.createElement("img");
        img.src = "https://flagcdn.com/24x18/" + c.toLowerCase() + ".png";
        img.width = 24;
        img.height = 18;
        img.alt = name;
        img.loading = "lazy";
        img.onerror = function () {
          var code = document.createElement("span");
          code.className = "vm-code";
          code.textContent = c;
          li.replaceChild(code, img);
        };
        var n = document.createElement("span");
        n.textContent = counts[c].toLocaleString();
        li.appendChild(img);
        li.appendChild(n);
        list.appendChild(li);
      });
    root.appendChild(list);
  }

  function load() {
    var endpoint = WORKER_URL + (shouldCount() ? "/hit" : "/stats");
    Promise.all([
      fetch(MAP_URL).then(function (r) { return r.json(); }),
      fetch(endpoint, { cache: "no-store" }).then(function (r) {
        if (!r.ok) throw new Error("HTTP " + r.status);
        return r.json();
      })
    ])
      .then(function (res) { render(res[0], res[1]); })
      .catch(function () {
        // Hide the widget quietly if the counter cannot be reached.
        root.style.display = "none";
      });
  }

  // Load after the page is idle so the widget never slows the main content.
  if ("requestIdleCallback" in window) requestIdleCallback(load);
  else setTimeout(load, 1500);
})();
