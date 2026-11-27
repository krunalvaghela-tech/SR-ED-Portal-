(function () {
  "use strict";

  var TODAY = "2026-11-27";
  var WEEK_OF = "2026-11-23";
  var YEAR = "2026";
  var ORG_NAME = "Tallgrass Robotics Ltd. (sample)";
  var MODE = "demo";            // "demo" or "live"
  var ROLE = "admin";           // admin | staff | advisor | kv
  function canWrite() { return MODE === "demo" || ROLE === "admin" || ROLE === "staff" || ROLE === "kv"; }
  function canManage() { return MODE === "demo" || ROLE === "admin" || ROLE === "kv"; }
  var MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  var TYPES = ["Test data","Lab notes","Meeting minutes","Photo","Version history","Progress report","Receipt","Contract"];
  var SOURCES = ["Upload","Email-in","Photo capture"];
  var ROUTES = ["overview","projects","evidence","time","funding","gaps","export"];
  var NAV = [
    ["overview","00","Overview"],
    ["projects","01","Projects"],
    ["evidence","02","Evidence"],
    ["time","03","Weekly time"],
    ["funding","04","Finance and funding"],
    ["gaps","05","Gap alerts"],
    ["export","06","Export"]
  ];
  // The last three map to the project description on CRA form T661 (Part 2, Section B).
  var FIELDS = [
    {key:"objective", q:"What were you trying to achieve?", tag:"Goal", limit:0},
    {key:"uncertainty", q:"What technological uncertainty could you not resolve with existing knowledge?", tag:"T661 line 242", limit:350},
    {key:"hypothesis", q:"What work did you do to overcome it? Include what you tried and expected.", tag:"T661 line 244", limit:700},
    {key:"results", q:"What advancement did you achieve, or try to achieve? Add dates and numbers.", tag:"T661 line 246", limit:350}
  ];
  var NAV_ICON = {overview:"squares-four", projects:"flask", evidence:"files", time:"clock", funding:"receipt",
                  gaps:"warning-circle", export:"books", team:"users", companies:"buildings"};
  var NAV_GROUP = {overview:"", projects:"Records", gaps:"Review", team:"Admin"};
  function icon(name, cls) {
    var p = (window.SRED_ICONS || {})[name];
    return p ? '<svg class="ico' + (cls ? " " + cls : "") + '" viewBox="0 0 256 256" fill="currentColor" aria-hidden="true">' + p + "</svg>" : "";
  }
  function words(s) { var t = String(s || "").trim(); return t ? t.split(/\s+/).length : 0; }
  function claimDue() { return (Number(YEAR) + 2) + "-06-30"; }   // 18 months after a Dec 31 year end
  function longDate(iso) { return MONTHS[Number(iso.slice(5, 7)) - 1] + " " + Number(iso.slice(8, 10)) + ", " + iso.slice(0, 4); }
  var KEYWORDS = {
    p1: ["mesh","slot","radio","delivery","packet","duty","network"],
    p2: ["grain","camera","image","lighting","bin","vision","model v"],
    p3: ["battery","thermal","chamber","cold","temperature","pack"]
  };
  var money = new Intl.NumberFormat("en-CA", {style:"currency", currency:"CAD", maximumFractionDigits:0});

  function seed() {
    return {
      threshold: 45,
      open: {p1: true},
      filters: {project: "all", type: "all"},
      people: [
        {id:"alex", name:"Alex R.", role:"Firmware developer", payroll:40},
        {id:"jordan", name:"Jordan C.", role:"Controls engineer", payroll:40},
        {id:"morgan", name:"Morgan O.", role:"Data scientist", payroll:37.5},
        {id:"sam", name:"Sam B.", role:"Lab technician", payroll:40}
      ],
      projects: [
        {id:"p1", name:"Low-power mesh for remote sensors", status:"Active",
          objective:"Keep a field sensor network reporting for 12 months on one battery pack at -30 °C.",
          uncertainty:"Known mesh protocols drop packets when radios sleep long enough to hit the power target. No published method we found meets both limits.",
          hypothesis:"A time-slotted schedule with adaptive slot length can keep delivery above 98% at the target power draw.",
          results:"Test run 3 (Sep 11): 96.4% delivery at target power. Slot adaptation under revision for run 4."},
        {id:"p2", name:"Grain bin level from one camera", status:"Active",
          objective:"Estimate grain level in a bin from a single camera image to within 5%.",
          uncertainty:"Dust, glare and uneven grain surfaces defeat standard depth and edge methods. Unclear whether one low-cost camera is enough.",
          hypothesis:"A model trained on augmented bin images, plus a fixed lighting ring, can reach the 5% target.",
          results:""},
        {id:"p3", name:"Battery thermal model for cold starts", status:"Active",
          objective:"Predict battery pack temperature during cold starts to protect the cells.",
          uncertainty:"Existing thermal models assume steady ambient conditions and do not capture heat flow inside our enclosure.",
          hypothesis:"A lumped model with enclosure-specific coefficients, fitted from chamber tests, predicts pack temperature within 2 °C.",
          results:"Chamber tests 1 to 4 complete. Fit error 3.1 °C; refit with door-seal data planned."}
      ],
      evidence: [
        {id:"e1", date:"2026-02-12", title:"Mesh slot schedule design notes", type:"Lab notes", project:"p1", person:"jordan", source:"Upload"},
        {id:"e2", date:"2026-03-04", title:"Kickoff meeting minutes, mesh project", type:"Meeting minutes", project:"p1", person:"alex", source:"Email-in"},
        {id:"e3", date:"2026-03-21", title:"Cold chamber setup photos", type:"Photo", project:"p3", person:"sam", source:"Photo capture"},
        {id:"e4", date:"2026-04-15", title:"Test run 1 delivery log", type:"Test data", project:"p1", person:"alex", source:"Upload"},
        {id:"e5", date:"2026-05-09", title:"Camera rig lighting trials", type:"Photo", project:"p2", person:"sam", source:"Photo capture"},
        {id:"e6", date:"2026-05-28", title:"Chamber tests 1 to 2 data", type:"Test data", project:"p3", person:"sam", source:"Upload"},
        {id:"e7", date:"2026-06-17", title:"Grain image model v0.3 results", type:"Version history", project:"p2", person:"morgan", source:"Upload"},
        {id:"e8", date:"2026-07-08", title:"Q2 progress report, mesh project", type:"Progress report", project:"p1", person:"jordan", source:"Upload"},
        {id:"e9", date:"2026-07-30", title:"Model v0.5 training notes", type:"Lab notes", project:"p2", person:"morgan", source:"Upload"},
        {id:"e10", date:"2026-08-19", title:"Thermal model fit v2", type:"Version history", project:"p3", person:"morgan", source:"Upload"},
        {id:"e11", date:"2026-09-11", title:"Test run 3 delivery log", type:"Test data", project:"p1", person:"alex", source:"Upload"},
        {id:"e12", date:"2026-10-06", title:"Lighting ring comparison data", type:"Test data", project:"p2", person:"sam", source:"Upload"},
        {id:"e13", date:"2026-10-22", title:"Chamber tests 3 to 4 data", type:"Test data", project:"p3", person:"sam", source:"Upload"},
        {id:"e14", date:"2026-11-12", title:"Slot adaptation review minutes", type:"Meeting minutes", project:"p1", person:"jordan", source:"Email-in"}
      ],
      hours: {
        alex:   {p1:22, p2:8,  p3:0,  other:10},
        jordan: {p1:18, p2:0,  p3:14, other:8},
        morgan: {p1:0,  p2:28, p3:8,  other:5},
        sam:    {p1:6,  p2:10, p3:16, other:8}
      },
      weekSubmitted: false,
      history: {
        alex:   [1,1,1,1,1,1,1,1],
        jordan: [1,1,1,1,0,1,1,1],
        morgan: [1,0,1,1,1,0,1,1],
        sam:    [1,1,1,1,1,1,1,1]
      },
      records: [
        {id:"f1", label:"Payroll register, Jan to Nov 2026", status:"ok", note:""},
        {id:"f2", label:"Year-end T4 summary", status:"pending", note:"Issued after the tax year ends."},
        {id:"f3", label:"Material receipts (3)", status:"ok", note:""},
        {id:"f4", label:"Cold-chamber test lab: signed contract", status:"missing", note:"Invoices are on file, but the signed subcontract is not."},
        {id:"f5", label:"Cold-chamber test lab: invoices (4)", status:"ok", note:""},
        {id:"f6", label:"General ledger report, Jan to Oct 2026", status:"ok", note:""}
      ],
      funding: [
        {id:"g1", program:"YESP wage subsidy", amount:14000, period:"Apr 2026 to Mar 2027"},
        {id:"g2", program:"NRC IRAP contribution", amount:30000, period:"Jan to Dec 2026"}
      ],
      flash: null,
      generated: false,
      copied: ""
    };
  }

  var state = seed();
  var route = "overview";

  /* ---------- helpers ---------- */
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c];
    });
  }
  function addDays(iso, n) { var d = new Date(iso + "T12:00:00Z"); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); }
  function pastWeeks(n) { var out = []; for (var i = n; i >= 1; i--) out.push(addDays(WEEK_OF, -7 * i)); return out; }
  function uuid() { return (window.crypto && crypto.randomUUID) ? crypto.randomUUID() : "id-" + Date.now() + "-" + Math.round(Math.random() * 1e9); }
  function days(a, b) { return Math.round((Date.parse(b) - Date.parse(a)) / 864e5); }
  function fmt(n) { return (Math.round(n * 10) / 10).toString(); }
  function plural(n, one, many) { return n + " " + (n === 1 ? one : many); }
  function person(id) { return state.people.find(function (p) { return p.id === id; }) || {name:"Unknown"}; }
  function project(id) { return state.projects.find(function (p) { return p.id === id; }) || {name:"Unassigned"}; }
  function lastEvidence(pid) {
    var ds = state.evidence.filter(function (e) { return e.project === pid; }).map(function (e) { return e.date; }).sort();
    return ds.length ? ds[ds.length - 1] : null;
  }
  function personTotal(pid) {
    var h = state.hours[pid] || {}; var t = 0;
    Object.keys(h).forEach(function (k) { t += Number(h[k]) || 0; });
    return t;
  }
  function rdHours() {
    var t = 0;
    state.people.forEach(function (p) {
      state.projects.forEach(function (pr) { t += Number((state.hours[p.id] || {})[pr.id]) || 0; });
    });
    return t;
  }
  function completion() {
    var done = 0, total = 0;
    Object.keys(state.history).forEach(function (k) {
      state.history[k].forEach(function (v) { total++; done += v; });
    });
    return {done: done, total: total, pct: total ? Math.round(done / total * 100) : 0};
  }
  function answered(pr) {
    return FIELDS.filter(function (f) { return String(pr[f.key] || "").trim(); }).length;
  }
  function fundingTotal() {
    return state.funding.reduce(function (s, g) { return s + (Number(g.amount) || 0); }, 0);
  }
  function recordCounts() {
    var c = {ok:0, pending:0, missing:0};
    state.records.forEach(function (r) { c[r.status]++; });
    return c;
  }

  function gaps() {
    var out = [];
    state.people.forEach(function (p) {
      var logged = personTotal(p.id);
      var diff = logged - p.payroll;
      if (Math.abs(diff) > 1) {
        out.push({id:"hrs-" + p.id, sev:"high", go:"time", label:"Fix timesheet",
          title: p.name + ": timesheet does not match payroll",
          detail: "This week's timesheet totals " + fmt(logged) + " h. Payroll paid " + fmt(p.payroll) + " h."});
      }
    });
    state.records.forEach(function (r) {
      if (r.status === "missing") {
        out.push({id:"rec-" + r.id, sev:"high", go:"funding", label:"Add record",
          title: "Missing: " + r.label, detail: r.note || "This record is not on file."});
      }
    });
    state.projects.forEach(function (pr) {
      var last = lastEvidence(pr.id);
      var d = last ? days(last, TODAY) : null;
      if (pr.status === "Active" && (d === null || d > state.threshold)) {
        out.push({id:"stale-" + pr.id, sev:"med", go:"evidence", label:"Add a record", open: pr.id,
          title: pr.name + ": no recent records",
          detail: d === null ? "No records filed for this project yet." :
            "Last record " + last + ", " + d + " days ago. Your alert level is " + state.threshold + " days."});
      }
      if (!String(pr.results || "").trim()) {
        out.push({id:"res-" + pr.id, sev:"med", go:"projects", label:"Open project", open: pr.id,
          title: pr.name + ": results not written up",
          detail: "The project sheet has no results yet. Add dates and numbers while they are fresh."});
      }
    });
    out.sort(function (a, b) { return (a.sev === "high" ? 0 : 1) - (b.sev === "high" ? 0 : 1); });
    return out;
  }

  var ICON_CHEV = '<svg class="chev" viewBox="0 0 20 20" aria-hidden="true"><path d="M7 4l6 6-6 6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  var ICON_LOCK = '<svg viewBox="0 0 16 16" aria-hidden="true"><rect x="3" y="7" width="10" height="7" rx="1.5" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M5.5 7V5a2.5 2.5 0 0 1 5 0v2" fill="none" stroke="currentColor" stroke-width="1.6"/></svg>';

  function sevPill(s) {
    return s === "high" ? '<span class="pill crit">Fix first</span>' : '<span class="pill warn">Fix soon</span>';
  }
  function gapsH1(g) {
    return g.length ? '<span class="soft">' + plural(g.length, "gap", "gaps") + ".</span> Fix them before a reviewer asks." :
      '<span class="soft">No gaps.</span> Nothing a reviewer would chase.';
  }
  function gapItem(x, i) {
    return '<li class="gap rv" style="transition-delay:' + ((i || 0) * 0.06).toFixed(2) + 's" data-cursor="Open">' + sevPill(x.sev) +
      '<div><p class="t">' + esc(x.title) + '</p><p class="d">' + esc(x.detail) + "</p></div>" +
      '<a class="btn small alt go" href="#' + x.go + '"' + (x.open ? ' data-open="' + x.open + '"' : "") + ">" + esc(x.label) + "</a></li>";
  }
  function flashHtml() {
    if (!state.flash) return "";
    var f = state.flash; state.flash = null;
    return '<p class="flash' + (f.bad ? " bad" : "") + '" role="status">' + esc(f.text) + "</p>";
  }
  function options(list, selected, valueKey, labelKey) {
    return list.map(function (it) {
      var v = valueKey ? it[valueKey] : it, l = labelKey ? it[labelKey] : it;
      return '<option value="' + esc(v) + '"' + (v === selected ? " selected" : "") + ">" + esc(l) + "</option>";
    }).join("");
  }

  /* ---------- views ---------- */
  function vOverview() {
    var g = gaps(), total = state.evidence.length, c = completion();
    var high = g.filter(function (x) { return x.sev === "high"; }).length;

    var counts = MONTHS.map(function () { return 0; });
    state.evidence.forEach(function (e) {
      if (e.date.slice(0, 4) === YEAR) counts[Number(e.date.slice(5, 7)) - 1]++;
    });
    var max = Math.max.apply(null, counts.concat([1]));
    var W = 640, base = 128, top = 30, step = W / 12, bw = 30;
    var curMonth = Number(TODAY.slice(5, 7)) - 1;
    var grid = "";
    for (var i = 1; i <= max; i++) {
      var gy = base - (i / max) * (base - top);
      grid += '<line class="grid" x1="0" x2="' + W + '" y1="' + gy + '" y2="' + gy + '"/>';
    }
    var bars = counts.map(function (n, idx) {
      var x = idx * step + (step - bw) / 2;
      var h = (n / max) * (base - top);
      var cls = "bar" + (idx === curMonth ? " now" : "");
      var out = "";
      if (n > 0) {
        out += '<rect class="' + cls + '" x="' + x + '" y="' + (base - h) + '" width="' + bw + '" height="' + h + '" rx="3"/>';
        out += '<text class="val" x="' + (x + bw / 2) + '" y="' + (base - h - 8) + '" text-anchor="middle">' + n + "</text>";
      }
      out += '<text class="lbl" x="' + (x + bw / 2) + '" y="' + (base + 22) + '" text-anchor="middle">' + MONTHS[idx] + "</text>";
      return out;
    }).join("");
    var aria = "Records filed per month in " + YEAR + ": " + MONTHS.map(function (m, idx) { return m + " " + counts[idx]; }).join(", ");

    var actions = g.slice(0, 4).map(gapItem).join("");
    var first = g[0];
    var heroH1 = g.length ?
      '<span class="soft">' + plural(g.length, "gap", "gaps") + " to close.</span> Then your " + YEAR + ' binder is <span class="hot">ready</span>.' :
      '<span class="soft">Nothing missing.</span> Your ' + YEAR + ' binder is <span class="hot">ready</span>.';
    var cta = first ?
      '<a class="btn" href="#' + first.go + '"' + (first.open ? ' data-open="' + first.open + '"' : "") + '>Fix the first gap <span class="arr" aria-hidden="true">&rarr;</span></a>' :
      '<a class="btn" href="#export">Export the binder <span class="arr" aria-hidden="true">&rarr;</span></a>';

    var recent = state.evidence.slice().sort(function (a, b) { return a.date < b.date ? 1 : -1; }).slice(0, 8);
    var mqItems = function (dup) {
      return recent.map(function (e) {
        return '<span class="mq-item' + (dup ? " mq-dup" : "") + '"' + (dup ? ' aria-hidden="true"' : "") + '><span class="stamp">' + e.date + "</span>" + esc(e.title) + "</span>";
      }).join("");
    };

    return '<section class="stack" aria-labelledby="h-main">' +
      '<div class="hero">' +
        '<div class="stack-sm" style="gap:20px">' +
          '<p class="badge rv in"><span class="dot" aria-hidden="true"></span>Checked today, ' + TODAY + "</p>" +
          '<h1 id="h-main" class="rv">' + heroH1 + "</h1>" +
          '<p class="lead rv" style="transition-delay:.08s">' + plural(total, "record", "records") + " filed across " + plural(state.projects.length, "project", "projects") + ", each dated the day it went in. Close the gaps and hand it over.</p>" +
          '<div class="row rv" style="transition-delay:.16s;margin-top:6px">' + cta + '<a class="btn alt" href="#evidence">File a record</a></div>' +
        "</div>" +
        '<figure class="hero-media rv" style="transition-delay:.12s">' +
          '<div class="hero-frame"><img src="https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=1400&amp;q=78&amp;auto=format&amp;fit=crop" width="1400" height="933" alt="An engineer working at a laptop beside test equipment in a lab" fetchpriority="high">' +
          '<span class="hero-light" aria-hidden="true"></span><span class="hero-light glow" aria-hidden="true"></span><span class="hero-light b" aria-hidden="true"></span></div>' +
          '<figcaption>Stand-in photo from <a href="https://unsplash.com" rel="noopener" target="_blank">Unsplash</a>, not a member of your team.</figcaption>' +
        "</figure>" +
      "</div>" +
      flashHtml() +
      '<div class="tiles">' +
        '<div class="tile solid rv"><span class="big" data-count>' + total + '</span><span class="label">Records filed</span><span class="sub">Across ' + plural(state.projects.length, "project", "projects") + "</span></div>" +
        '<div class="tile rv" style="transition-delay:.06s"><span class="big" data-count>' + fmt(rdHours()) + '</span><span class="label">R&amp;D hours this week</span><span class="sub">Week of ' + WEEK_OF + ", " + plural(state.people.length, "person", "people") + "</span></div>" +
        '<div class="tile rv" style="transition-delay:.12s"><span class="big" data-count>' + c.pct + '%</span><span class="label">Timesheets done</span><span class="sub">' + c.done + " of " + c.total + " over 8 weeks. Target 80%.</span></div>" +
        '<div class="tile rv' + (g.length ? " alert" : "") + '" style="transition-delay:.18s"><span class="big" data-count>' + g.length + '</span><span class="label">Gaps to close</span><span class="sub">' + high + " to fix first, " + (g.length - high) + " to fix soon</span></div>" +
      "</div>" +
      '<div class="dash-row">' + readinessHtml() + timelineHtml() + "</div>" +
      projectTableHtml() +
      (g.length ? '<div class="stack-sm"><h2 class="rv">Start with these.</h2><ul class="gaps">' + actions + "</ul>" +
                  (g.length > 4 ? '<p><a href="#gaps">' + plural(g.length - 4, "more gap", "more gaps") + " in Gap alerts</a></p>" : "") + "</div>"
                : '<p class="flash">All checks pass. <a href="#export">Export the binder</a>.</p>') +
      '<div class="stack-sm rv"><h2>Recently filed</h2><div class="marquee"><div class="mq-track">' + mqItems(false) + mqItems(true) + "</div></div></div>" +
      '<div class="card chart stack-sm rv"><h2>A steady trail, month by month.</h2>' +
      '<p class="hint">Reviewers want to see work recorded as it happened, not pieced together at year end.</p>' +
      '<svg viewBox="0 0 ' + W + ' 160" role="img" aria-label="' + esc(aria) + '">' + grid +
      '<line class="axis" x1="0" x2="' + W + '" y1="' + base + '" y2="' + base + '"/>' + bars + "</svg></div>" +
      "</section>";
  }

  /* ---------- overview panels ---------- */
  function readiness() {
    var checks = [];
    state.projects.forEach(function (pr) {
      FIELDS.forEach(function (f) { checks.push({ok: !!String(pr[f.key] || "").trim(), area: "Project sheets"}); });
      var last = lastEvidence(pr.id);
      checks.push({ok: !!last && days(last, TODAY) <= state.threshold, area: "Recent records"});
    });
    state.people.forEach(function (p) { checks.push({ok: Math.abs(personTotal(p.id) - p.payroll) <= 1, area: "Timesheets"}); });
    state.records.forEach(function (r) { checks.push({ok: r.status !== "missing", area: "Financial records"}); });
    var areas = {};
    checks.forEach(function (c) { var a = areas[c.area] || (areas[c.area] = {ok: 0, all: 0}); a.all++; if (c.ok) a.ok++; });
    var ok = checks.filter(function (c) { return c.ok; }).length;
    return {pct: checks.length ? Math.round(ok / checks.length * 100) : 100, ok: ok, all: checks.length, areas: areas};
  }
  function readinessHtml() {
    var r = readiness(), R = 52, C = 2 * Math.PI * R, off = C * (1 - r.pct / 100);
    var rows = Object.keys(r.areas).map(function (k) {
      var a = r.areas[k], done = a.ok === a.all;
      return '<li><span class="ar-name">' + (done ? icon("check-circle", "ok") : '<span class="ar-dot" aria-hidden="true"></span>') + esc(k) + '</span><span class="num">' + a.ok + "/" + a.all + "</span></li>";
    }).join("");
    return '<div class="card ready rv"><div class="ring" role="img" aria-label="Binder ' + r.pct + ' percent ready">' +
      '<svg viewBox="0 0 120 120"><circle class="ring-bg" cx="60" cy="60" r="' + R + '"/><circle class="ring-fg" cx="60" cy="60" r="' + R + '" stroke-dasharray="' + C.toFixed(1) + '" stroke-dashoffset="' + off.toFixed(1) + '" style="--c:' + C.toFixed(1) + '"/></svg>' +
      '<span class="ring-num"><b data-count>' + r.pct + '%</b><small>ready</small></span></div>' +
      '<div class="ready-body"><h2>Binder readiness</h2><p class="hint">' + r.ok + " of " + r.all + ' checks pass.</p><ul class="areas">' + rows + "</ul></div></div>";
  }
  function timelineHtml() {
    var start = YEAR + "-01-01", end = YEAR + "-12-31", due = claimDue();
    var span = days(start, due), pos = function (d) { return Math.max(0, Math.min(100, days(start, d) / span * 100)); };
    var left = days(TODAY, due);
    var stop = function (d, label, cls) {
      return '<li class="ms ' + (cls || "") + '" style="--x:' + pos(d).toFixed(2) + '%"><span class="ms-dot" aria-hidden="true"></span><b>' + label + "</b><span>" + longDate(d) + "</span></li>";
    };
    return '<div class="card tl rv" style="transition-delay:.06s"><div class="row between"><h2>Claim timeline</h2>' +
      '<span class="chip strong">' + (left >= 0 ? plural(left, "day", "days") + " to file" : "Deadline passed") + "</span></div>" +
      '<p class="hint">The T661 is due 18 months after the tax year ends. Records are strongest when they are written during the year, not after it.</p>' +
      '<div class="track" aria-hidden="true"><span class="track-done" style="width:' + pos(TODAY).toFixed(2) + '%"></span><span class="track-year" style="width:' + pos(end).toFixed(2) + '%"></span>' +
        '<span class="today" style="left:' + pos(TODAY).toFixed(2) + '%"><span>Today</span></span></div>' +
      '<ol class="milestones">' + stop(start, "Tax year starts") + stop(end, "Year end", "mid") + stop(due, "Claim due", "end") + "</ol></div>";
  }
  function projectTableHtml() {
    if (!state.projects.length) return '<div class="card rv empty"><h2>No projects yet.</h2><p class="hint">Add your first project and the binder starts filling in.</p><p><a class="btn small" href="#projects">Add a project</a></p></div>';
    var rows = state.projects.map(function (pr) {
      var n = state.evidence.filter(function (e) { return e.project === pr.id; }).length;
      var hrs = state.people.reduce(function (s, p) { return s + (Number((state.hours[p.id] || {})[pr.id]) || 0); }, 0);
      var lines = FIELDS.filter(function (f) { return f.limit && String(pr[f.key] || "").trim(); }).length;
      var last = lastEvidence(pr.id);
      var dots = FIELDS.filter(function (f) { return f.limit; }).map(function (f) {
        return '<span class="ldot' + (String(pr[f.key] || "").trim() ? " on" : "") + '" title="' + f.tag + '"></span>';
      }).join("");
      return '<tr data-cursor="Open"><td><a class="row-link" href="#projects" data-open="' + pr.id + '">' + icon("flask") + esc(pr.name) + "</a></td>" +
        '<td><span class="ldots" aria-label="' + lines + ' of 3 T661 lines written">' + dots + "</span> " + lines + "/3</td>" +
        '<td class="r num">' + n + '</td><td class="r num">' + fmt(hrs) + "</td><td>" + (last ? '<span class="stamp">' + last + "</span>" : '<span class="muted">None yet</span>') + "</td></tr>";
    }).join("");
    return '<div class="stack-sm rv"><div class="row between"><h2>Projects at a glance.</h2><a href="#projects">Open projects</a></div>' +
      '<div class="table-wrap"><table class="glance"><thead><tr><th>Project</th><th>T661 lines</th><th class="r">Records</th><th class="r">Hours this week</th><th>Last record</th></tr></thead><tbody>' + rows + "</tbody></table></div></div>";
  }

  function vProjects() {
    var cards = state.projects.map(function (pr) {
      var n = state.evidence.filter(function (e) { return e.project === pr.id; }).length;
      var last = lastEvidence(pr.id), a = answered(pr);
      var fields = FIELDS.map(function (f) {
        var id = "pf-" + pr.id + "-" + f.key;
        var w = words(pr[f.key]);
        return '<div class="field t661"><div class="t661-head"><span class="t661-tag">' + f.tag + "</span>" +
          (f.limit ? '<span class="wc' + (w > f.limit ? " over" : "") + '" id="wc-' + id + '">' + w + " / " + f.limit + " words</span>" : "") + "</div>" +
          '<label for="' + id + '">' + esc(f.q) + '</label><textarea id="' + id + '" rows="' + (f.limit > 400 ? 5 : 3) + '" data-pid="' + pr.id + '" data-key="' + f.key + '" data-limit="' + f.limit + '">' + esc(pr[f.key]) + "</textarea></div>";
      }).join("");
      return '<details class="card proj" data-det="' + pr.id + '"' + (state.open[pr.id] ? " open" : "") + ">" +
        "<summary>" + ICON_CHEV + '<span class="sname">' + esc(pr.name) + "</span>" +
        '<span class="pill ' + (a === 4 ? "good" : "warn") + '">' + a + " of 4 answered</span>" +
        '<span class="stamp">' + plural(n, "record", "records") + "</span>" +
        (last ? '<span class="stamp">last ' + last + "</span>" : "") + "</summary>" +
        '<div class="body">' + fields + "</div></details>";
    }).join("");
    return '<section class="stack" aria-labelledby="h-main">' +
      '<div class="stack-sm"><p class="eyebrow">Projects</p><h1 id="h-main"><span class="soft">' + plural(state.projects.length, "project", "projects") + ".</span> Written the way CRA reads them.</h1>" +
      '<p class="lead">Three of the four answers line up with the project description on form T661, with the same word limits. Write as the work happens and your advisor starts from real notes, not memory.</p></div>' +
      flashHtml() + '<div class="stack-sm">' + cards + "</div>" +
      '<form class="card form" id="f-project" novalidate><h2>Add a project</h2>' +
      '<div class="field"><label for="np-name">Project name</label><input id="np-name" name="name" placeholder="For example: Sensor enclosure heat test" data-fk="np-name"></div>' +
      '<div class="row"><button class="btn" type="submit" data-fk="np-add">Add project</button></div></form>' +
      "</section>";
  }

  function vEvidence() {
    var f = state.filters;
    var rows = state.evidence.filter(function (e) {
      return (f.project === "all" || e.project === f.project) && (f.type === "all" || e.type === f.type);
    }).sort(function (a, b) { return a.date < b.date ? 1 : a.date > b.date ? -1 : 0; });
    var body = rows.map(function (e) {
      return "<tr><td><span class=\"stamp\">" + e.date + "</span></td>" +
        "<td>" + esc(e.title) + (e.file ? (MODE === "live" && e.filePath ? '<br><button class="linkbtn" type="button" data-act="download" data-path="' + esc(e.filePath) + '">' + esc(e.file) + '</button>' : '<br><span class="mono small muted">' + esc(e.file) + "</span>") : "") + "</td>" +
        "<td>" + esc(e.type) + "</td><td>" + esc(project(e.project).name) + "</td>" +
        "<td>" + esc(person(e.person).name) + "</td><td>" + esc(e.source) + "</td>" +
        '<td><span class="pill quiet">' + ICON_LOCK + "Locked</span></td></tr>";
    }).join("");
    var projOpts = '<option value="all">All projects</option>' + options(state.projects, f.project, "id", "name");
    var typeOpts = '<option value="all">All types</option>' + options(TYPES, f.type);
    return '<section class="stack" aria-labelledby="h-main">' +
      '<div class="stack-sm"><p class="eyebrow">Evidence</p><h1 id="h-main"><span class="soft">' + plural(state.evidence.length, "record", "records") + ".</span> Dated and locked.</h1>" +
      '<p class="lead">Upload a file, forward an email or snap a photo. Each one is tagged to a project and a person, and its date can’t be changed later.</p></div>' +
      flashHtml() +
      '<div class="fields">' +
        '<div class="field"><label for="flt-project">Project</label><select id="flt-project" data-filter="project" data-fk="flt-project">' + projOpts + "</select></div>" +
        '<div class="field"><label for="flt-type">Record type</label><select id="flt-type" data-filter="type" data-fk="flt-type">' + typeOpts + "</select></div>" +
      "</div>" +
      '<p class="hint" role="status">Showing ' + rows.length + " of " + state.evidence.length + " records, newest first.</p>" +
      '<div class="table-wrap"><table><thead><tr><th>Date</th><th>Record</th><th>Type</th><th>Project</th><th>Person</th><th>Source</th><th>Timestamp</th></tr></thead><tbody>' +
      (body || '<tr><td colspan="7" class="muted">No records match these filters.</td></tr>') + "</tbody></table></div>" +
      '<form class="card form" id="f-evidence" novalidate><h2>File a record.</h2>' +
      '<div class="fields">' +
        '<div class="field wide"><label for="ev-title">What is it?</label><input id="ev-title" name="title" placeholder="For example: Chamber test 5 data" data-fk="ev-title"></div>' +
        '<div class="field wide" id="ev-suggest-row" hidden><p class="hint" id="ev-suggest" aria-live="polite"></p><div><button class="btn small alt" type="button" data-act="use-suggest" data-fk="use-suggest">Use this project</button></div></div>' +
        '<div class="field"><label for="ev-type">Type</label><select id="ev-type" name="type">' + options(TYPES, "Test data") + "</select></div>" +
        '<div class="field"><label for="ev-project">Project</label><select id="ev-project" name="project">' + options(state.projects, state.projects[0] && state.projects[0].id, "id", "name") + "</select></div>" +
        '<div class="field"><label for="ev-person">Person</label><select id="ev-person" name="person">' + options(state.people, "sam", "id", "name") + "</select></div>" +
        '<div class="field"><label for="ev-source">Source</label><select id="ev-source" name="source">' + options(SOURCES, "Upload") + "</select></div>" +
        '<div class="field wide"><label for="ev-file">File (optional)</label><input id="ev-file" name="file" type="file"><p class="hint">' + (MODE === "live" ? "Up to 50 MB. Once filed, it can’t be replaced." : "In the demo, only the file name is kept.") + '</p></div>' +
      "</div>" +
      '<div class="row"><button class="btn" type="submit" data-fk="ev-add">File it <span class="arr" aria-hidden="true">&rarr;</span></button><span class="hint">Dated ' + TODAY + ".</span></div></form>" +
      "</section>";
  }

  function checkHtml(p) {
    var diff = personTotal(p.id) - p.payroll;
    if (Math.abs(diff) <= 1) return '<span class="pill good">Matches payroll</span>';
    return '<span class="pill crit">' + fmt(Math.abs(diff)) + " h " + (diff > 0 ? "over" : "under") + " payroll</span>";
  }

  function vTime() {
    var head = state.projects.map(function (pr) { return '<th class="r" title="' + esc(pr.name) + '">' + esc(pr.name) + "</th>"; }).join("");
    var rows = state.people.map(function (p) {
      var h = state.hours[p.id] || {};
      var cells = state.projects.concat([{id:"other", name:"Non-R&D work"}]).map(function (pr) {
        var id = "h-" + p.id + "-" + pr.id;
        return '<td class="r"><label class="sr" for="' + id + '">' + esc(p.name) + ", hours on " + esc(pr.name) + '</label><input id="' + id + '" type="number" min="0" max="80" step="0.5" inputmode="decimal" value="' + esc(h[pr.id] || 0) + '" data-hours="' + p.id + "|" + pr.id + '"></td>';
      }).join("");
      return "<tr><td><strong>" + esc(p.name) + '</strong><br><span class="small muted">' + esc(p.role) + "</span></td>" + cells +
        '<td class="r num"><strong id="tot-' + p.id + '">' + fmt(personTotal(p.id)) + "</strong></td>" +
        '<td class="r num">' + fmt(p.payroll) + '</td><td id="chk-' + p.id + '">' + checkHtml(p) + "</td></tr>";
    }).join("");

    var c = completion();
    // History covers the 8 weeks before the current one.
    var weeks = pastWeeks(8).map(function (d) { return MONTHS[Number(d.slice(5, 7)) - 1] + " " + Number(d.slice(8, 10)); });
    var strip = '<span></span>' + weeks.map(function (w) {
      return '<span class="small muted mono" style="writing-mode:vertical-rl;transform:rotate(180deg);height:52px;line-height:20px">' + w + "</span>";
    }).join("") + '<span class="small muted">Done</span>';
    state.people.forEach(function (p) {
      var hist = state.history[p.id] || [];
      var done = hist.reduce(function (s, v) { return s + v; }, 0);
      strip += "<span>" + esc(p.name) + "</span>" + hist.map(function (v, i) {
        return '<span class="sq' + (v ? "" : " miss") + '" role="img" aria-label="' + esc(p.name) + ", week of " + weeks[i] + ": " + (v ? "completed" : "missed") + '"></span>';
      }).join("") + '<span class="num">' + done + "/8</span>";
    });

    return '<section class="stack" aria-labelledby="h-main">' +
      '<div class="stack-sm"><p class="eyebrow">Weekly time</p><h1 id="h-main"><span class="soft">Week of ' + WEEK_OF + ".</span> <span id=\"wk-total\">" + fmt(rdHours()) + "</span> R&amp;D hours.</h1>" +
      '<p class="lead">Every Monday, each person takes about two minutes to split last week by project. We check the totals against payroll, so the hours and the pay always agree.</p></div>' +
      flashHtml() +
      (state.weekSubmitted ? '<p class="flash">Week of ' + WEEK_OF + " submitted. Edits now show as changes on the record.</p>" : "") +
      '<div class="table-wrap time"><table><thead><tr><th>Person</th>' + head + '<th class="r">Non-R&amp;D</th><th class="r">Total h</th><th class="r">Payroll h</th><th>Check</th></tr></thead><tbody>' + rows + "</tbody></table></div>" +
      '<div class="row"><button class="btn" type="button" data-act="submit-week" data-fk="submit-week">' + (state.weekSubmitted ? "Submit changes" : "Submit week") + "</button></div>" +
      '<div class="card stack-sm"><div class="row between"><h2>The last 8 weeks.</h2><span class="pill ' + (c.pct >= 80 ? "good" : "warn") + '">' + c.pct + "% done, target 80%</span></div>" +
      '<div class="legend"><span><span class="sq"></span>Completed</span><span><span class="sq miss"></span>Missed</span></div>' +
      '<div style="overflow-x:auto"><div class="strip">' + strip + "</div></div></div>" +
      "</section>";
  }

  function vFunding() {
    var rc = recordCounts();
    var recs = state.records.map(function (r) {
      var pill = r.status === "ok" ? '<span class="pill good">On file</span>' :
                 r.status === "pending" ? '<span class="pill quiet">Not yet due</span>' :
                 '<span class="pill crit">Missing</span>';
      return '<li><div class="rl"><span>' + esc(r.label) + "</span>" + (r.note ? '<span class="small muted">' + esc(r.note) + "</span>" : "") + "</div>" +
        '<div class="row">' + pill + (r.status === "missing" ? '<button class="btn small alt" type="button" data-act="add-record" data-id="' + r.id + '" data-fk="rec-' + r.id + '">Mark as added</button>' : "") + "</div></li>";
    }).join("");
    var fund = state.funding.map(function (g) {
      return "<tr><td>" + esc(g.program) + '</td><td class="r num">' + money.format(g.amount) + "</td><td>" + esc(g.period) + "</td></tr>";
    }).join("");
    return '<section class="stack" aria-labelledby="h-main">' +
      '<div class="stack-sm"><p class="eyebrow">Finance and funding</p><h1 id="h-main"><span class="soft">' + rc.ok + " of " + state.records.length + " records on file.</span> Plus every grant.</h1>" +
      '<p class="lead">Payroll, receipts and contracts back up your costs. Grants and wage subsidies go here too, because they reduce what you can claim. Your advisor does the math. This keeps the facts in one place.</p></div>' +
      flashHtml() +
      '<div class="grid2">' +
        '<div class="card stack-sm"><h2>Financial records</h2><ul class="records">' + recs + "</ul></div>" +
        '<div class="card stack-sm"><div class="row between"><h2>Grants and subsidies</h2><span class="stamp">' + money.format(fundingTotal()) + " total</span></div>" +
          '<div class="table-wrap"><table style="min-width:420px"><thead><tr><th>Program</th><th class="r">Amount</th><th>Period</th></tr></thead><tbody>' +
          (fund || '<tr><td colspan="3" class="muted">No funding logged.</td></tr>') + "</tbody></table></div>" +
          '<form class="form" id="f-funding" novalidate><h3>Log funding</h3><div class="fields">' +
            '<div class="field"><label for="fd-program">Program</label><input id="fd-program" name="program" list="programs" placeholder="For example: Manitoba IGP grant" data-fk="fd-program">' +
            '<datalist id="programs"><option value="Manitoba IGP grant"></option><option value="YESP wage subsidy"></option><option value="NRC IRAP contribution"></option><option value="Mitacs internship"></option></datalist></div>' +
            '<div class="field"><label for="fd-amount">Amount (CAD)</label><input id="fd-amount" name="amount" type="number" min="0" step="100" inputmode="numeric"></div>' +
            '<div class="field"><label for="fd-period">Period</label><input id="fd-period" name="period" placeholder="For example: Jan to Jun 2026"></div>' +
          '</div><div class="row"><button class="btn" type="submit" data-fk="fd-add">Log funding</button></div></form>' +
        "</div>" +
      "</div></section>";
  }

  function vGaps() {
    var g = gaps();
    var list = g.map(gapItem).join("");
    return '<section class="stack" aria-labelledby="h-main">' +
      '<div class="stack-sm"><p class="eyebrow">Gap alerts</p><h1 id="h-main">' + gapsH1(g) + "</h1>" +
      '<p class="lead">We check every day: hours against payroll, a signed contract behind every subcontractor invoice, recent records on every active project, and results on every project sheet.</p></div>' +
      flashHtml() +
      '<div class="card stack-sm"><label for="threshold">Alert when an active project has no new record for <span id="thr-out" class="num">' + state.threshold + "</span> days</label>" +
      '<input id="threshold" type="range" min="15" max="90" step="5" value="' + state.threshold + '" data-fk="threshold"><p class="hint">Try 30 days and watch one more project get flagged.</p></div>' +
      '<div id="gap-list">' + (g.length ? '<ul class="gaps">' + list + "</ul>" : '<p class="flash">All checks pass. <a href="#export">Export the binder</a>.</p>') + "</div>" +
      "</section>";
  }

  function indexText() {
    var rc = recordCounts(), g = gaps(), c = completion();
    return [
      YEAR + " SR&ED Binder" + (MODE === "demo" ? " (sample)" : ""),
      ORG_NAME,
      "Prepared " + TODAY,
      "",
      "00 Cover and index: " + plural(g.length, "open gap", "open gaps") + " listed",
      "01 Projects: " + plural(state.projects.length, "project sheet", "project sheets"),
      "02 People and time: " + plural(state.people.length, "person", "people") + ", " + c.done + " weekly entries",
      "03 Evidence: " + plural(state.evidence.length, "record", "records") + ", filed by project and date",
      "04 Financial records: " + rc.ok + " of " + state.records.length + " on file",
      "05 Other funding: " + plural(state.funding.length, "entry", "entries") + ", " + money.format(fundingTotal()) + " total",
      "",
      "This binder organizes records. It does not decide whether work qualifies for SR&ED."
    ].join("\n");
  }

  function vExport() {
    var rc = recordCounts(), g = gaps(), c = completion();
    var secs = [
      ["00", "Cover and index", g.length ? plural(g.length, "open gap", "open gaps") + " listed on the cover" : "No open gaps", g.length ? "warn" : "good", g.length ? "Gaps listed" : "Ready"],
      ["01", "Projects", plural(state.projects.length, "project sheet", "project sheets") + ", one per project", state.projects.every(function (p) { return answered(p) === 4; }) ? "good" : "warn", state.projects.every(function (p) { return answered(p) === 4; }) ? "Complete" : "Incomplete"],
      ["02", "People and time", plural(state.people.length, "person", "people") + ", " + c.done + " weekly entries", c.pct >= 80 ? "good" : "warn", c.pct + "% done"],
      ["03", "Evidence", plural(state.evidence.length, "record", "records") + ", filed by project and date", "good", "Locked"],
      ["04", "Financial records", rc.ok + " of " + state.records.length + " on file" + (rc.pending ? ", " + rc.pending + " not yet due" : ""), rc.missing ? "crit" : "good", rc.missing ? rc.missing + " missing" : "Complete"],
      ["05", "Other funding", plural(state.funding.length, "entry", "entries") + ", " + money.format(fundingTotal()) + " total", "good", "Logged"]
    ];
    var items = secs.map(function (s) {
      return '<li><span class="sec">' + s[0] + '</span><div class="what"><b>' + esc(s[1]) + '</b><span class="small muted">' + esc(s[2]) + '</span></div><span class="pill ' + s[3] + '">' + esc(s[4]) + "</span></li>";
    }).join("");
    var gen = "";
    if (state.generated) {
      gen = '<div class="card stack-sm" role="status"><h2>Sample package built</h2>' +
        '<p>1 cover, ' + plural(state.projects.length, "project sheet", "project sheets") + ", " + c.done + " weekly entries, " + plural(state.evidence.length, "record", "records") + " and " + plural(rc.ok, "financial record", "financial records") + ". " +
        (g.length ? plural(g.length, "open gap is", "open gaps are") + " listed on the cover." : "No open gaps.") + "</p>" +
        '<p class="hint">Downloads are off for now. Soon this builds one indexed folder you can hand to your advisor or to CRA.</p></div>';
    }
    var copyMsg = state.copied === "ok" ? '<span class="hint" role="status">Index copied.</span>' :
                  state.copied === "fail" ? '<span class="hint" role="status">Copy is not available here. Select the text below instead.</span>' : "";
    return '<section class="stack" aria-labelledby="h-main">' +
      '<div class="stack-sm"><p class="eyebrow">Export</p><h1 id="h-main"><span class="soft">The ' + YEAR + ' binder.</span> ' + (g.length ? plural(g.length, "gap", "gaps") + " still open." : "Ready to hand over.") + "</h1>" +
      '<p class="lead">One folder per tax year, in the order a reviewer reads it. Open gaps go on the cover, where everyone can see them.</p></div>' +
      flashHtml() +
      '<div class="binder"><div class="spine"><h2>' + YEAR + ' SR&amp;ED Binder</h2><span class="mono small">' + esc(ORG_NAME) + ' &middot; Jan 1 to Dec 31, ' + YEAR + '</span></div><ol>' + items + "</ol></div>" +
      '<div class="row"><button class="btn" type="button" data-act="generate" data-fk="generate">Build sample package</button><button class="btn alt" type="button" data-act="copy" data-fk="copy">Copy index text</button>' + copyMsg + "</div>" +
      gen +
      '<pre class="index" aria-label="Binder index text">' + esc(indexText()) + "</pre>" +
      '<p class="hint">The portal organizes your records. Your accountant or SR&amp;ED advisor decides what to claim.</p>' +
      "</section>";
  }

  var VIEWS = {overview:vOverview, projects:vProjects, evidence:vEvidence, time:vTime, funding:vFunding, gaps:vGaps, export:vExport,
    team:function () { return vTeam(); }, companies:function () { return vCompanies(); }};

  /* ---------- render ---------- */
  var nav = document.getElementById("nav");
  var app = document.getElementById("app");

  function renderNav() {
    var n = gaps().length;
    nav.innerHTML = NAV.map(function (it) {
      var grp = NAV_GROUP[it[0]];
      return (grp ? '<p class="nav-group">' + grp + "</p>" : "") +
        '<a class="tab" href="#' + it[0] + '" title="' + esc(it[2]) + '"' + (route === it[0] ? ' aria-current="page"' : "") + ">" +
        icon(NAV_ICON[it[0]]) + '<span class="tab-label">' + esc(it[2]) + "</span>" +
        (it[0] === "gaps" && n ? '<span class="count" aria-label="' + plural(n, "open gap", "open gaps") + '">' + n + "</span>" : "") + "</a>";
    }).join("");
    var cur = NAV.find(function (x) { return x[0] === route; });
    var cp = document.getElementById("crumbPage"), co = document.getElementById("crumbOrg");
    if (cp) cp.textContent = cur ? cur[2] : "";
    if (co) co.textContent = ORG_NAME.replace(" (sample)", "");
    var chips = document.getElementById("topChips");
    if (chips) chips.innerHTML = '<span class="chip">' + icon("calendar-blank") + "Tax year " + YEAR + "</span>" +
      '<span class="chip strong" title="T661 filing deadline: 18 months after a December 31 year end">' + icon("clock") + "Claim due " + longDate(claimDue()) + "</span>";
    var so = document.getElementById("sideOrg");
    if (so && MODE === "demo") so.innerHTML = '<p class="org-name">' + esc(ORG_NAME) + '</p><p class="org-sub">Tax year ' + YEAR + "</p>";
  }

  function render(moveFocus) {
    var fk = document.activeElement && document.activeElement.getAttribute && document.activeElement.getAttribute("data-fk");
    renderNav();
    app.innerHTML = VIEWS[route]();
    applyPermissions();
    motion(!!moveFocus || firstAnim);
    firstAnim = false;
    if (moveFocus) {
      try { app.focus({preventScroll: true}); } catch (e) { app.focus(); }
      window.scrollTo(0, 0);
    } else if (fk) {
      var el = app.querySelector('[data-fk="' + fk + '"]') || document.querySelector('[data-fk="' + fk + '"]');
      if (el) el.focus();
    }
  }

  function routeFromHash() {
    var h = (location.hash || "").replace("#", "");
    return ROUTES.indexOf(h) >= 0 ? h : "overview";
  }

  window.addEventListener("hashchange", function () {
    route = routeFromHash();
    state.copied = "";
    state.flash = null;
    render(true);
  });

  /* ---------- events ---------- */
  document.addEventListener("click", function (e) {
    var o = e.target.closest("[data-open]");
    if (o) state.open[o.getAttribute("data-open")] = true;

    var t = e.target.closest("[data-act]");
    if (!t) return;
    var act = t.getAttribute("data-act");

    if (act === "reset") {
      state = seed();
      state.flash = {text: "Sample data restored."};
      render();
      return;
    }
    if (act === "use-suggest") {
      var sel = document.getElementById("ev-project");
      var sug = t.getAttribute("data-pid");
      if (sel && sug) sel.value = sug;
      return;
    }
    if (act === "submit-week") {
      state.weekSubmitted = true;
      persist.submitWeek();
      var issues = state.people.filter(function (p) { return Math.abs(personTotal(p.id) - p.payroll) > 1; });
      state.flash = issues.length ?
        {bad: true, text: "Submitted with " + plural(issues.length, "mismatch", "mismatches") + " against payroll. It stays on the gap list until fixed."} :
        {text: "Week submitted. All timesheets match payroll."};
      render();
      return;
    }
    if (act === "add-record") {
      var id = t.getAttribute("data-id");
      state.records.forEach(function (r) { if (r.id === id) r.status = "ok"; });
      persist.recordOk(id);
      state.flash = {text: "Record marked as on file. The gap alert is cleared."};
      render();
      return;
    }
    if (act === "generate") {
      state.generated = true;
      render();
      return;
    }
    if (act === "copy") {
      var text = indexText();
      var done = function (ok) { state.copied = ok ? "ok" : "fail"; render(); };
      try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(text).then(function () { done(true); }, function () { done(false); });
        } else { done(false); }
      } catch (err) { done(false); }
      return;
    }
  });

  document.addEventListener("input", function (e) {
    var t = e.target;
    if (t.matches("textarea[data-key]")) {
      var pr = state.projects.find(function (p) { return p.id === t.getAttribute("data-pid"); });
      if (pr) { pr[t.getAttribute("data-key")] = t.value; persist.projectField(pr.id, t.getAttribute("data-key"), t.value); }
      var lim = Number(t.getAttribute("data-limit")), wcEl = document.getElementById("wc-" + t.id);
      if (lim && wcEl) { var wn = words(t.value); wcEl.textContent = wn + " / " + lim + " words"; wcEl.classList.toggle("over", wn > lim); }
      renderNav();
      return;
    }
    if (t.matches("input[data-hours]")) {
      var parts = t.getAttribute("data-hours").split("|");
      var v = parseFloat(t.value);
      if (!state.hours[parts[0]]) state.hours[parts[0]] = {};
      state.hours[parts[0]][parts[1]] = isNaN(v) || v < 0 ? 0 : v;
      persist.hours(parts[0], parts[1], state.hours[parts[0]][parts[1]]);
      var p = person(parts[0]);
      var tot = document.getElementById("tot-" + p.id);
      var chk = document.getElementById("chk-" + p.id);
      var wk = document.getElementById("wk-total");
      if (tot) tot.textContent = fmt(personTotal(p.id));
      if (chk) chk.innerHTML = checkHtml(p);
      if (wk) wk.textContent = fmt(rdHours());
      renderNav();
      return;
    }
    if (t.id === "threshold") {
      state.threshold = Number(t.value);
      persist.threshold(state.threshold);
      var out = document.getElementById("thr-out");
      if (out) out.textContent = state.threshold;
      var g = gaps();
      var list = document.getElementById("gap-list");
      var h1 = document.getElementById("h-main");
      if (h1) h1.innerHTML = gapsH1(g);
      if (list) list.innerHTML = g.length ? '<ul class="gaps">' + g.map(function (x) { return gapItem(x).replace(' rv"', ' rv in"'); }).join("") + "</ul>" : '<p class="flash">All checks pass. <a href="#export">Export the binder</a>.</p>';
      renderNav();
      return;
    }
    if (t.id === "ev-title") {
      var text = t.value.toLowerCase();
      var match = null;
      var kw = MODE === "live" ? liveKeywords() : KEYWORDS;
      Object.keys(kw).some(function (pid) {
        var hit = kw[pid].find(function (k) { return text.indexOf(k) >= 0; });
        if (hit && state.projects.some(function (p) { return p.id === pid; })) { match = {pid: pid, word: hit}; return true; }
        return false;
      });
      var row = document.getElementById("ev-suggest-row");
      var msg = document.getElementById("ev-suggest");
      var btn = row && row.querySelector("[data-act='use-suggest']");
      if (!row) return;
      if (match) {
        row.hidden = false;
        msg.textContent = "Suggested project: " + project(match.pid).name + " (matched the word \"" + match.word + "\").";
        btn.setAttribute("data-pid", match.pid);
      } else {
        row.hidden = true;
      }
    }
  });

  document.addEventListener("change", function (e) {
    var t = e.target;
    if (t.matches("select[data-filter]")) {
      state.filters[t.getAttribute("data-filter")] = t.value;
      render();
    }
  });

  document.addEventListener("toggle", function (e) {
    var d = e.target;
    if (d && d.matches && d.matches("details[data-det]")) state.open[d.getAttribute("data-det")] = d.open;
  }, true);

  document.addEventListener("submit", function (e) {
    var form = e.target;
    e.preventDefault();
    if (form.id === "f-evidence") {
      var title = form.elements.title.value.trim();
      if (!title) {
        state.flash = {bad: true, text: "Add a short description of the record, then file it."};
        render();
        var ti = document.getElementById("ev-title"); if (ti) ti.focus();
        return;
      }
      var fileInput = form.elements.file;
      var fileObj = fileInput && fileInput.files && fileInput.files[0] ? fileInput.files[0] : null;
      var rec = {
        id: uuid(),
        date: TODAY, title: title, type: form.elements.type.value, project: form.elements.project.value,
        person: form.elements.person.value, source: form.elements.source.value, file: fileObj ? fileObj.name : ""
      };
      state.evidence.push(rec);
      persist.evidence(rec, fileObj);
      state.filters = {project: "all", type: "all"};
      state.flash = {text: "Filed \"" + title + "\" under " + project(form.elements.project.value).name + ", stamped " + TODAY + "."};
      render();
      return;
    }
    if (form.id === "f-project") {
      var name = form.elements.name.value.trim();
      if (!name) {
        state.flash = {bad: true, text: "Give the project a name, then add it."};
        render();
        var ni = document.getElementById("np-name"); if (ni) ni.focus();
        return;
      }
      var id = uuid();
      var np = {id: id, name: name, status: "Active", objective: "", uncertainty: "", hypothesis: "", results: ""};
      state.projects.push(np);
      persist.addProject(np);
      state.open = {}; state.open[id] = true;
      state.flash = {text: "Added \"" + name + "\". Answer the four prompts as the work starts."};
      render();
      return;
    }
    if (form.id === "f-funding") {
      var program = form.elements.program.value.trim();
      var amount = parseFloat(form.elements.amount.value);
      if (!program || isNaN(amount) || amount <= 0) {
        state.flash = {bad: true, text: "Enter the program name and an amount above zero."};
        render();
        return;
      }
      var fr = {id: uuid(), program: program, amount: amount, period: form.elements.period.value.trim() || "Not given"};
      state.funding.push(fr);
      persist.addFunding(fr);
      state.flash = {text: "Logged " + money.format(amount) + " from " + program + "."};
      render();
      return;
    }
  });

  /* ---------- collapsible sidebar (rail on desktop, drawer on phones) ---------- */
  var appShell = document.getElementById("appShell");
  var scrim = document.getElementById("scrim");
  var mqNarrow = window.matchMedia("(max-width: 959px)");
  function sidePref() { try { return localStorage.getItem("sred-side"); } catch (e) { return null; } }
  function setSide(open, remember) {
    appShell.setAttribute("data-side", open ? "open" : "closed");
    var st = document.getElementById("sideToggle"); if (st) st.setAttribute("aria-expanded", String(open));
    var os = document.getElementById("openSide"); if (os) os.setAttribute("aria-expanded", String(open));
    scrim.hidden = !(open && mqNarrow.matches);
    if (remember && !mqNarrow.matches) { try { localStorage.setItem("sred-side", open ? "open" : "closed"); } catch (e) {} }
  }
  function initSide() {
    [].forEach.call(document.querySelectorAll("[data-icon]"), function (el) { el.outerHTML = icon(el.getAttribute("data-icon")); });
    setSide(mqNarrow.matches ? false : sidePref() !== "closed", false);
  }
  document.getElementById("sideToggle").addEventListener("click", function () { setSide(appShell.getAttribute("data-side") !== "open", true); });
  document.getElementById("openSide").addEventListener("click", function () { setSide(true, true); });
  scrim.addEventListener("click", function () { setSide(false, false); });
  nav.addEventListener("click", function (e) { if (mqNarrow.matches && e.target.closest("a")) setSide(false, false); });
  document.addEventListener("keydown", function (e) {
    if ((e.metaKey || e.ctrlKey) && (e.key === "b" || e.key === "B") && !(e.target.closest && e.target.closest("input,textarea,select"))) { e.preventDefault(); setSide(appShell.getAttribute("data-side") !== "open", true); }
    if (e.key === "Escape" && mqNarrow.matches && appShell.getAttribute("data-side") === "open") setSide(false, false);
  });
  (mqNarrow.addEventListener ? mqNarrow.addEventListener.bind(mqNarrow, "change") : mqNarrow.addListener.bind(mqNarrow))(function () {
    setSide(mqNarrow.matches ? false : sidePref() !== "closed", false);
  });
  initSide();

  /* ---------- motion (ported from the KV WebDesign site) ---------- */
  var firstAnim = false;
  var reduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var io = (!reduced && "IntersectionObserver" in window) ? new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (!e.isIntersecting) return;
      e.target.classList.add("in");
      io.unobserve(e.target);
      if (e.target.matches(".chart")) e.target.classList.add("grow");
      [].forEach.call(e.target.querySelectorAll("[data-count]"), countUp);
      if (e.target.matches("[data-count]")) countUp(e.target);
    });
  }, {threshold: 0.12, rootMargin: "0px 0px -6% 0px"}) : null;

  // Reveal on scroll, staggered, only when a page is first shown.
  // Re-renders caused by typing or filtering show content at once.
  function motion(animate) {
    var auto = app.querySelectorAll("section > :not(.hero):not(.rv), details.proj, .records li");
    [].forEach.call(auto, function (el, i) {
      el.classList.add("rv");
      if (!el.style.transitionDelay) el.style.transitionDelay = Math.min(i * 0.05, 0.3).toFixed(2) + "s";
    });
    var els = app.querySelectorAll(".rv:not(.in)");
    if (!animate || !io) {
      [].forEach.call(els, function (el) { el.classList.add("in"); });
      return;
    }
    app.classList.remove("enter"); void app.offsetWidth; app.classList.add("enter");
    [].forEach.call(els, function (el) { io.observe(el); });
  }

  // Stat counters: count up to the real number, keep any suffix.
  function countUp(el) {
    if (reduced || el.getAttribute("data-counted")) return;
    el.setAttribute("data-counted", "1");
    var m = /^(\d+(?:\.\d+)?)(.*)$/.exec(el.textContent);
    if (!m) return;
    var target = parseFloat(m[1]), suffix = m[2] || "", dec = (m[1].split(".")[1] || "").length;
    if (!target) return;
    var start = null, dur = 1100, done = false;
    function settle() { if (!done) { done = true; el.textContent = m[1] + suffix; } }
    function frame(ts) {
      if (done) return;
      if (start === null) start = ts;
      var p = Math.min((ts - start) / dur, 1);
      el.textContent = (target * (1 - Math.pow(1 - p, 3))).toFixed(dec) + suffix;
      if (p < 1) requestAnimationFrame(frame); else settle();
    }
    setTimeout(settle, dur + 400);
    requestAnimationFrame(frame);
  }

  // Back to top: shown once the banner scrolls away.
  var toTop = document.getElementById("toTop");
  var sentinel = document.getElementById("top-sentinel");
  if (toTop && sentinel && "IntersectionObserver" in window) {
    new IntersectionObserver(function (en) { toTop.classList.toggle("show", !en[0].isIntersecting); }, {rootMargin: "400px 0px 0px 0px"}).observe(sentinel);
    toTop.addEventListener("click", function () { window.scrollTo({top: 0, behavior: reduced ? "auto" : "smooth"}); });
  }

  // Custom cursor and magnetic buttons: mouse users only.
  if (!reduced && window.matchMedia && window.matchMedia("(pointer: fine)").matches) {
    var root = document.documentElement;
    root.classList.add("has-cursor");
    var dot = document.createElement("div"), ring = document.createElement("div"), label = document.createElement("div");
    dot.className = "cursor-dot"; ring.className = "cursor-ring"; label.className = "cursor-label";
    [dot, ring, label].forEach(function (n) { n.setAttribute("aria-hidden", "true"); document.body.appendChild(n); });
    var mx = 0, my = 0, rx = 0, ry = 0, started = false;
    document.addEventListener("mousemove", function (e) {
      mx = e.clientX; my = e.clientY;
      dot.style.transform = "translate(" + mx + "px," + my + "px) translate(-50%,-50%)";
      if (!started) { rx = mx; ry = my; started = true; root.classList.add("cursor-ready"); }
    }, {passive: true});
    (function trail() {
      rx += (mx - rx) * 0.18; ry += (my - ry) * 0.18;
      var t = "translate(" + rx + "px," + ry + "px) translate(-50%,-50%)";
      ring.style.transform = t; label.style.transform = t;
      requestAnimationFrame(trail);
    })();
    var INTERACTIVE = "a,button,input,textarea,select,summary,label,[role='button']";
    document.addEventListener("mouseover", function (e) {
      var t = e.target.closest ? e.target : null; if (!t) return;
      root.classList.toggle("cursor-hover", !!t.closest(INTERACTIVE));
      var c = t.closest("[data-cursor]");
      if (c && !t.closest("input,textarea,select")) { label.textContent = c.getAttribute("data-cursor") + " \u2192"; root.classList.add("cursor-label-on"); }
      else root.classList.remove("cursor-label-on");
    });
    document.addEventListener("mousedown", function () { root.classList.add("cursor-down"); });
    document.addEventListener("mouseup", function () { root.classList.remove("cursor-down"); });
    document.addEventListener("mouseleave", function () { root.classList.remove("cursor-ready"); });
    document.addEventListener("mouseenter", function () { if (started) root.classList.add("cursor-ready"); });

    // Magnetic buttons (delegated, because views re-render).
    var STRENGTH = 0.25, magnet = null;
    document.addEventListener("mousemove", function (e) {
      var b = e.target.closest && e.target.closest(".btn:not(.go), .banner button");
      if (magnet && magnet !== b) { magnet.style.transform = ""; magnet = null; }
      if (!b) return;
      magnet = b;
      var r = b.getBoundingClientRect();
      b.style.transform = "translate(" + (e.clientX - (r.left + r.width / 2)) * STRENGTH + "px," + (e.clientY - (r.top + r.height / 2)) * STRENGTH + "px)";
    }, {passive: true});
  }

  /* ============================================================
     LIVE MODE: Supabase sign-in, saved data, team and companies.
     Without config.js values (or with ?demo), the sample demo runs.
     ============================================================ */
  var CFG = window.SRED_CONFIG || {};
  var sb = null, me = null, myOrgs = [], orgId = null, entryIds = {};
  var gate = document.getElementById("gate");
  var shell = document.getElementById("appShell");
  var banner = document.querySelector(".banner");
  var meta = document.getElementById("sideMeta");
  var DEFAULT_RECORDS = [
    "Payroll register", "Year-end T4 summary", "Material receipts",
    "Subcontractor contracts (signed)", "Subcontractor invoices", "General ledger report"
  ];

  function liveReady() {
    return !!(CFG.supabaseUrl && CFG.supabaseKey && window.supabase && window.supabase.createClient);
  }
  function wantsDemo() {
    try { if (sessionStorage.getItem("sred-demo") === "1") return true; } catch (e) {}
    return /[?&]demo(=1)?(&|$)/.test(location.search);
  }
  function localISO(d) { var z = new Date(d.getTime() - d.getTimezoneOffset() * 6e4); return z.toISOString().slice(0, 10); }
  function mondayOf(iso) { var d = new Date(iso + "T12:00:00Z"); var dow = (d.getUTCDay() + 6) % 7; return addDays(iso, -dow); }

  /* ---------- toast for save errors and confirmations ---------- */
  var toastEl = document.createElement("div");
  toastEl.className = "toast"; toastEl.setAttribute("role", "status"); toastEl.setAttribute("aria-live", "polite");
  document.body.appendChild(toastEl);
  var toastTimer = null;
  function toast(text, bad) {
    toastEl.textContent = text;
    toastEl.className = "toast show" + (bad ? " bad" : "");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.className = "toast"; }, bad ? 7000 : 3500);
  }
  function check(res, what) {
    if (res && res.error) {
      console.error(what, res.error);
      toast("Could not save " + what + ". " + (res.error.message || "Check your connection and try again."), true);
      return false;
    }
    return true;
  }

  /* ---------- persistence: no-ops in demo mode ---------- */
  var timers = {};
  function later(key, fn, ms) { clearTimeout(timers[key]); timers[key] = setTimeout(fn, ms || 600); }
  var persist = {
    projectField: function (pid, key, value) {
      if (MODE !== "live") return;
      var patch = {}; patch[key] = value;
      later("p-" + pid + key, function () { sb.from("projects").update(patch).eq("id", pid).then(function (r) { check(r, "the project"); }); });
    },
    addProject: function (pr) {
      if (MODE !== "live") return;
      sb.from("projects").insert({id: pr.id, org_id: orgId, name: pr.name}).then(function (r) { check(r, "the project"); });
    },
    evidence: function (rec, file) {
      if (MODE !== "live") return;
      var row = {id: rec.id, org_id: orgId, project_id: rec.project || null, person_id: rec.person || null,
                 title: rec.title, record_type: rec.type, source: rec.source};
      var go = function (path) {
        if (path) { row.file_path = path; rec.filePath = path; }
        sb.from("evidence").insert(row).then(function (r) { if (check(r, "the record")) toast("Record saved."); });
      };
      if (!file) return go(null);
      if (file.size > 50 * 1024 * 1024) { toast("That file is over 50 MB. The record was saved without it.", true); return go(null); }
      var path = orgId + "/" + rec.id + "/" + file.name.replace(/[^\w.\- ]+/g, "_");
      toast("Uploading " + file.name + "...");
      sb.storage.from("evidence").upload(path, file, {upsert: false}).then(function (r) {
        if (!check(r, "the file")) return go(null);
        go(path);
      });
    },
    hours: function (personId, projectKey, value) {
      if (MODE !== "live") return;
      var key = personId + "|" + projectKey;
      later("h-" + key, function () {
        var id = entryIds[key];
        var q = id ? sb.from("time_entries").update({hours: value}).eq("id", id) :
          sb.from("time_entries").insert({id: (entryIds[key] = uuid()), org_id: orgId, person_id: personId,
            week_of: WEEK_OF, project_id: projectKey === "other" ? null : projectKey, hours: value});
        q.then(function (r) { if (!check(r, "the hours") && !id) delete entryIds[key]; });
      }, 700);
    },
    submitWeek: function () {
      if (MODE !== "live") return;
      sb.from("time_entries").update({submitted_at: new Date().toISOString()})
        .eq("org_id", orgId).eq("week_of", WEEK_OF).then(function (r) { check(r, "the week"); });
    },
    recordOk: function (id) {
      if (MODE !== "live") return;
      sb.from("financial_records").update({status: "ok"}).eq("id", id).then(function (r) { check(r, "the record"); });
    },
    addFunding: function (f) {
      if (MODE !== "live") return;
      sb.from("funding").insert({id: f.id, org_id: orgId, program: f.program, amount: f.amount, period: f.period})
        .then(function (r) { check(r, "the funding entry"); });
    },
    threshold: function (n) {
      if (MODE !== "live" || !canManage()) return;
      later("thr", function () { sb.from("organizations").update({gap_threshold_days: n}).eq("id", orgId).then(function (r) { check(r, "the alert level"); }); });
    }
  };

  function liveKeywords() {
    var out = {};
    state.projects.forEach(function (p) {
      out[p.id] = p.name.toLowerCase().split(/[^a-z0-9]+/).filter(function (w) { return w.length >= 5; });
    });
    return out;
  }

  /* ---------- permissions: hide what this role cannot do ---------- */
  function applyPermissions() {
    if (canWrite()) {
      var thr = document.getElementById("threshold");
      if (thr && !canManage()) { thr.disabled = true; var hn = thr.nextElementSibling; if (hn) hn.textContent = "Only a company admin can change the alert level."; }
      return;
    }
    [].forEach.call(app.querySelectorAll("form, [data-act='submit-week'], [data-act='add-record'], #ev-suggest-row"), function (el) { el.hidden = true; el.style.display = "none"; });
    [].forEach.call(app.querySelectorAll("textarea, input[data-hours], #threshold"), function (el) { el.readOnly = true; el.disabled = true; });
    var h1 = app.querySelector("h1");
    if (h1 && !app.querySelector(".readonly-note")) h1.insertAdjacentHTML("afterend", '<p class="badge readonly-note">View only: advisors can read everything but not change it.</p>');
  }

  /* ---------- gate screens (sign-in, no company, loading) ---------- */
  function showGate(html) {
    shell.hidden = true; banner.hidden = true;
    document.querySelector(".foot").hidden = true;
    gate.hidden = false;
    gate.innerHTML = '<div class="gate-brand"><span class="brand-mark">' + document.querySelector(".brand-mark").innerHTML + '</span><span>SR&amp;ED Records</span></div>' + html;
    var f = gate.querySelector("input, button, a"); if (f) f.focus();
  }
  function hideGate() { gate.hidden = true; gate.innerHTML = ""; shell.hidden = false; document.querySelector(".foot").hidden = false; }

  function signInHtml(sentTo, err, val) {
    if (sentTo) {
      return '<section class="gate-card" aria-labelledby="g-h"><h1 id="g-h">Check your inbox.</h1>' +
        '<p class="lead">We sent a sign-in link to <strong>' + esc(sentTo) + '</strong>. Open it on this device, in this browser. It works once and expires in an hour.</p>' +
        '<p class="hint">Nothing after a minute? Look in your junk folder.</p>' +
        '<div class="row"><button class="btn alt" type="button" data-act="signin-again">Use a different email</button></div></section>';
    }
    return '<section class="gate-card" aria-labelledby="g-h">' +
      '<h1 id="g-h"><span class="soft">Welcome back.</span> Sign in with your email.</h1>' +
      '<p class="lead">No password to remember. We’ll email you a link, and one click gets you in.</p>' +
      (err ? '<p class="flash bad" role="alert">' + esc(err) + '</p>' : "") +
      '<form class="form" id="f-signin" novalidate><div class="field"><label for="si-email">Work email</label>' +
      '<input id="si-email" name="email" type="email" autocomplete="email" inputmode="email" required placeholder="name@company.ca" value="' + esc(val || "") + '"></div>' +
      '<div class="row"><button class="btn" type="submit">Email me a link <span class="arr" aria-hidden="true">&rarr;</span></button></div></form>' +
      '<p class="hint">Just looking around? <a href="?demo=1" data-act="try-demo">Try the demo with sample data</a>.</p></section>';
  }

  function noCompanyHtml() {
    return '<section class="gate-card" aria-labelledby="g-h"><h1 id="g-h"><span class="soft">You’re in.</span> Almost.</h1>' +
      '<p class="lead">Your email, <strong>' + esc(me.email) + '</strong>, isn’t linked to a company yet. Ask your company admin to invite this exact address, then reload the page.</p>' +
      '<div class="row"><button class="btn alt" type="button" data-act="reload">Reload</button><button class="btn alt" type="button" data-act="signout">Sign out</button></div></section>';
  }

  /* ---------- loading the signed-in user and their companies ---------- */
  async function loadMe(user) {
    var pr = await sb.from("profiles").select("id,email,full_name,is_kv_admin").eq("id", user.id).maybeSingle();
    me = pr.data || {id: user.id, email: user.email, is_kv_admin: false};
    if (me.is_kv_admin) {
      var all = await sb.from("organizations").select("id,name,tax_year").order("name");
      myOrgs = (all.data || []).map(function (o) { return {id: o.id, name: o.name, tax_year: o.tax_year, role: "kv"}; });
    } else {
      var ms = await sb.from("memberships").select("role, organizations(id,name,tax_year)").eq("user_id", user.id);
      myOrgs = (ms.data || []).filter(function (m) { return m.organizations; }).map(function (m) {
        return {id: m.organizations.id, name: m.organizations.name, tax_year: m.organizations.tax_year, role: m.role};
      }).sort(function (a, b) { return a.name.localeCompare(b.name); });
    }
  }

  async function loadOrg(id) {
    var o = myOrgs.find(function (x) { return x.id === id; }) || myOrgs[0];
    orgId = o.id; ROLE = o.role; ORG_NAME = o.name; YEAR = String(o.tax_year);
    try { localStorage.setItem("sred-org", orgId); } catch (e) {}
    TODAY = localISO(new Date()); WEEK_OF = mondayOf(TODAY);
    var since = addDays(WEEK_OF, -56);
    var q = function (t, cols) { return sb.from(t).select(cols || "*").eq("org_id", orgId); };
    var res = await Promise.all([
      sb.from("organizations").select("gap_threshold_days").eq("id", orgId).maybeSingle(),
      q("people").eq("active", true).order("name"),
      q("projects").order("created_at"),
      q("evidence").order("recorded_at"),
      q("time_entries").gte("week_of", since),
      q("financial_records").order("label"),
      q("funding").order("created_at")
    ]);
    var bad = res.find(function (r) { return r.error; });
    if (bad) throw bad.error;
    var people = res[1].data, entries = res[4].data;
    var fresh = {
      threshold: (res[0].data && res[0].data.gap_threshold_days) || 45,
      open: {}, filters: {project: "all", type: "all"},
      people: people.map(function (p) { return {id: p.id, name: p.name, role: p.job_title || "", payroll: Number(p.payroll_hours_per_week)}; }),
      projects: res[2].data.map(function (p) { return {id: p.id, name: p.name, status: p.status, objective: p.objective, uncertainty: p.uncertainty, hypothesis: p.hypothesis, results: p.results}; }),
      evidence: res[3].data.map(function (e) {
        var file = e.file_path ? e.file_path.split("/").pop() : "";
        return {id: e.id, date: localISO(new Date(e.recorded_at)), title: e.title, type: e.record_type, project: e.project_id, person: e.person_id, source: e.source, file: file, filePath: e.file_path};
      }),
      hours: {}, history: {}, weekSubmitted: false,
      records: res[5].data.map(function (r) { return {id: r.id, label: r.label, status: r.status, note: r.note}; }),
      funding: res[6].data.map(function (f) { return {id: f.id, program: f.program, amount: Number(f.amount), period: f.period}; }),
      flash: null, generated: false, copied: ""
    };
    entryIds = {};
    var weeks = pastWeeks(8);
    people.forEach(function (p) {
      fresh.hours[p.id] = {other: 0};
      fresh.projects.forEach(function (pr) { fresh.hours[p.id][pr.id] = 0; });
      fresh.history[p.id] = weeks.map(function (w) {
        return entries.some(function (e) { return e.person_id === p.id && e.week_of === w && e.submitted_at; }) ? 1 : 0;
      });
    });
    entries.forEach(function (e) {
      if (e.week_of !== WEEK_OF || !fresh.hours[e.person_id]) return;
      var k = e.project_id || "other";
      fresh.hours[e.person_id][k] = Number(e.hours);
      entryIds[e.person_id + "|" + k] = e.id;
      if (e.submitted_at) fresh.weekSubmitted = true;
    });
    if (fresh.projects[0]) fresh.open[fresh.projects[0].id] = true;
    state = fresh;
  }

  function renderHeader() {
    var sw = myOrgs.length > 1 ?
      '<label class="sr" for="org-switch">Company</label><select id="org-switch" class="org-switch">' +
        myOrgs.map(function (o) { return '<option value="' + o.id + '"' + (o.id === orgId ? " selected" : "") + ">" + esc(o.name) + "</option>"; }).join("") + "</select>" :
      '<p class="org-name">' + esc(ORG_NAME) + "</p>";
    var roleName = {kv: "KV admin", admin: "Company admin", staff: "Staff", advisor: "Advisor"}[ROLE] || ROLE;
    document.getElementById("sideOrg").innerHTML = sw + '<p class="org-sub">Tax year ' + YEAR + "</p>";
    meta.innerHTML = userBlock(me.email, roleName);
  }

  function userBlock(email, roleName) {
    return '<div class="user"><span class="avatar" aria-hidden="true">' + esc(email.charAt(0).toUpperCase()) + "</span>" +
      '<span class="user-text"><span class="user-mail">' + esc(email) + '</span><span class="user-role">' + esc(roleName) + "</span></span>" +
      '<button class="icon-btn" type="button" data-act="signout" title="Sign out"><span class="sr">Sign out</span>' + icon("sign-out") + "</button></div>";
  }

  function setNav() {
    NAV.length = 0; ROUTES.length = 0;
    BASE_NAV.forEach(function (n) { NAV.push(n); ROUTES.push(n[0]); });
    if (MODE === "live" && canManage()) { NAV.push(["team", "07", "Team"]); ROUTES.push("team"); }
    if (MODE === "live" && ROLE === "kv") { NAV.push(["companies", "08", "Companies"]); ROUTES.push("companies"); }
  }

  async function openOrg(id) {
    showGate('<section class="gate-card"><p class="lead" role="status">Pulling up your records...</p></section>');
    try {
      await loadOrg(id);
    } catch (e) {
      console.error(e);
      showGate('<section class="gate-card"><h1>Could not load your records</h1><p class="lead">' + esc(e.message || "Check your connection.") + '</p><div class="row"><button class="btn alt" type="button" data-act="reload">Try again</button></div></section>');
      return;
    }
    hideGate(); setNav(); renderHeader();
    var fp = document.querySelector(".foot p");
    if (fp) fp.textContent = "This portal organizes records. It does not decide whether work qualifies for SR&ED or prepare a claim: your accountant or SR&ED advisor makes those calls.";
    route = routeFromHash(); firstAnim = true; render(false);
  }

  async function afterSignIn(user) {
    await loadMe(user);
    if (!myOrgs.length) {
      if (me.is_kv_admin) { ROLE = "kv"; ORG_NAME = "No companies yet"; setNav(); hideGate(); renderHeaderKvOnly(); location.hash = "companies"; route = "companies"; render(false); return; }
      showGate(noCompanyHtml()); return;
    }
    var last = null; try { last = localStorage.getItem("sred-org"); } catch (e) {}
    await openOrg(myOrgs.some(function (o) { return o.id === last; }) ? last : myOrgs[0].id);
  }
  function renderHeaderKvOnly() {
    document.getElementById("sideOrg").innerHTML = '<p class="org-name">KV WebDesign</p><p class="org-sub">All client companies</p>';
    meta.innerHTML = userBlock(me.email, "KV admin");
  }

  /* ---------- team and companies views ---------- */
  var teamData = null;
  async function loadTeam() {
    var r = await Promise.all([
      sb.from("memberships").select("user_id, role, profiles(email, full_name)").eq("org_id", orgId),
      sb.from("invitations").select("id,email,role,created_at").eq("org_id", orgId).is("accepted_at", null).order("created_at"),
      sb.from("people").select("id,name,job_title,payroll_hours_per_week,user_id,active").eq("org_id", orgId).order("name")
    ]);
    teamData = {members: r[0].data || [], invites: r[1].data || [], people: r[2].data || []};
    if (route === "team") render(false);
  }
  var ROLE_LABEL = {admin: "Company admin", staff: "Staff", advisor: "Advisor"};
  function roleOptions(sel) {
    return ["staff", "admin", "advisor"].map(function (r) { return '<option value="' + r + '"' + (r === sel ? " selected" : "") + ">" + ROLE_LABEL[r] + "</option>"; }).join("");
  }
  function vTeam() {
    if (!teamData) { loadTeam(); return '<section class="stack"><h1 id="h-main">Team</h1><p class="lead" role="status">Loading members...</p></section>'; }
    var mem = teamData.members.map(function (m) {
      var self = m.user_id === me.id;
      return "<li><div class=\"rl\"><span><strong>" + esc((m.profiles && (m.profiles.full_name || m.profiles.email)) || "Member") + "</strong></span>" +
        '<span class="small muted">' + esc(m.profiles ? m.profiles.email : "") + "</span></div>" +
        '<div class="row"><span class="pill quiet">' + ROLE_LABEL[m.role] + "</span>" +
        (self ? "" : '<button class="btn small alt" type="button" data-act="remove-member" data-id="' + m.user_id + '">Remove</button>') + "</div></li>";
    }).join("") || '<li class="muted">No members yet.</li>';
    var inv = teamData.invites.map(function (i) {
      return '<li><div class="rl"><span>' + esc(i.email) + '</span><span class="small muted">Invited as ' + ROLE_LABEL[i.role] + ", waiting for first sign-in</span></div>" +
        '<button class="btn small alt" type="button" data-act="cancel-invite" data-id="' + i.id + '">Cancel</button></li>';
    }).join("");
    var ppl = teamData.people.filter(function (p) { return p.active; }).map(function (p) {
      return '<li><div class="rl"><span><strong>' + esc(p.name) + '</strong></span><span class="small muted">' + esc(p.job_title || "No job title") + " &middot; payroll " + Number(p.payroll_hours_per_week) + " h a week" + (p.user_id ? "" : " &middot; no login") + "</span></div>" +
        '<button class="btn small alt" type="button" data-act="retire-person" data-id="' + p.id + '">Remove from timesheet</button></li>';
    }).join("") || '<li class="muted">Nobody on the timesheet yet.</li>';
    return '<section class="stack" aria-labelledby="h-main">' +
      '<div class="stack-sm"><p class="eyebrow">Team</p><h1 id="h-main"><span class="soft">Your team.</span> Who can sign in.</h1>' +
      '<p class="lead">Invite people by email. They get in the first time they sign in with that address.</p></div>' +
      '<div class="grid2">' +
        '<div class="card stack-sm"><h2>Members</h2><ul class="records">' + mem + "</ul>" +
          (inv ? '<h3>Waiting to sign in</h3><ul class="records">' + inv + "</ul>" : "") + "</div>" +
        '<form class="card form" id="f-invite" novalidate><h2>Invite someone.</h2>' +
          '<div class="field"><label for="iv-email">Email</label><input id="iv-email" name="email" type="email" autocomplete="off" placeholder="name@company.ca"></div>' +
          '<div class="field"><label for="iv-role">Role</label><select id="iv-role" name="role">' + roleOptions("staff") + "</select>" +
          '<p class="hint">Staff file records and hours. Company admins also run the team. Advisors can look but not change.</p></div>' +
          '<div class="row"><button class="btn" type="submit">Send invite</button></div>' +
          '<p class="hint">Then send them the portal link yourself: ' + esc(location.origin + location.pathname) + "</p></form>" +
      "</div>" +
      '<div class="grid2">' +
        '<div class="card stack-sm"><h2>On the weekly timesheet</h2><ul class="records">' + ppl + "</ul></div>" +
        '<form class="card form" id="f-person" novalidate><h2>Add someone to the timesheet</h2>' +
          '<p class="hint">For people whose hours count but who will not sign in. Staff who sign in are added automatically.</p>' +
          '<div class="fields"><div class="field"><label for="pp-name">Name</label><input id="pp-name" name="name"></div>' +
          '<div class="field"><label for="pp-title">Job title</label><input id="pp-title" name="title"></div>' +
          '<div class="field"><label for="pp-hours">Payroll hours a week</label><input id="pp-hours" name="hours" type="number" min="0" max="80" step="0.5" value="40" inputmode="decimal"></div></div>' +
          '<div class="row"><button class="btn" type="submit">Add person</button></div></form>' +
      "</div></section>";
  }

  function vCompanies() {
    var list = myOrgs.map(function (o) {
      return '<li><div class="rl"><span><strong>' + esc(o.name) + '</strong></span><span class="small muted">Tax year ' + o.tax_year + "</span></div>" +
        (o.id === orgId ? '<span class="pill good">Open now</span>' : '<button class="btn small alt" type="button" data-act="open-org" data-id="' + o.id + '">Open</button>') + "</li>";
    }).join("") || '<li class="muted">No companies yet. Add the first one.</li>';
    return '<section class="stack" aria-labelledby="h-main">' +
      '<div class="stack-sm"><p class="eyebrow">Companies</p><h1 id="h-main"><span class="soft">' + plural(myOrgs.length, "client company", "client companies") + ".</span> One binder each.</h1>" +
      '<p class="lead">Each company gets its own records, team and binder. Only KV admins see this list.</p></div>' +
      '<div class="grid2"><div class="card stack-sm"><h2>All companies</h2><ul class="records">' + list + "</ul></div>" +
      '<form class="card form" id="f-company" novalidate><h2>Add a company</h2>' +
        '<div class="field"><label for="co-name">Legal name</label><input id="co-name" name="name" placeholder="For example: Prairie Sensor Works Inc."></div>' +
        '<div class="field"><label for="co-year">Tax year</label><input id="co-year" name="year" type="number" min="2000" max="2100" value="' + new Date().getFullYear() + '"></div>' +
        '<div class="field"><label for="co-admin">Company admin email (optional)</label><input id="co-admin" name="admin" type="email" placeholder="owner@company.ca"></div>' +
        '<div class="row"><button class="btn" type="submit">Add company</button></div></form></div></section>';
  }

  /* ---------- live-only events ---------- */
  document.addEventListener("click", async function (e) {
    var t = e.target.closest("[data-act]"); if (!t) return;
    var act = t.getAttribute("data-act"), id = t.getAttribute("data-id");
    if (act === "try-demo") { e.preventDefault(); try { sessionStorage.setItem("sred-demo", "1"); } catch (x) {} location.href = location.pathname + "?demo=1"; return; }
    if (act === "exit-demo") { try { sessionStorage.removeItem("sred-demo"); } catch (x) {} location.href = location.pathname; return; }
    if (act === "reload") { location.reload(); return; }
    if (MODE !== "live" && act !== "signin-again" && act !== "signout") return;
    if (act === "signin-again") { showGate(signInHtml()); return; }
    if (act === "signout") { await sb.auth.signOut(); try { localStorage.removeItem("sred-org"); } catch (x) {} location.href = location.pathname; return; }
    if (act === "download") {
      var r = await sb.storage.from("evidence").createSignedUrl(t.getAttribute("data-path"), 120);
      if (check(r, "the download link")) window.open(r.data.signedUrl, "_blank", "noopener");
      return;
    }
    if (act === "open-org") { location.hash = "overview"; openOrg(id); return; }
    if (act === "remove-member" && confirm("Remove this person's access to " + ORG_NAME + "? Their filed records stay.")) {
      check(await sb.from("memberships").delete().eq("org_id", orgId).eq("user_id", id), "the change"); loadTeam(); return;
    }
    if (act === "cancel-invite") { check(await sb.from("invitations").delete().eq("id", id), "the change"); loadTeam(); return; }
    if (act === "retire-person" && confirm("Remove this person from the weekly timesheet? Past hours stay on record.")) {
      check(await sb.from("people").update({active: false}).eq("id", id), "the change"); teamData = null; await loadOrg(orgId); render(false); return;
    }
  });

  document.addEventListener("change", function (e) {
    if (e.target.id === "org-switch") { teamData = null; openOrg(e.target.value); }
  });

  document.addEventListener("submit", async function (e) {
    var f = e.target, id = f.id;
    if (id === "f-signin") {
      var email = f.elements.email.value.trim();
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) { showGate(signInHtml(null, "Enter a full email address, like name@company.ca.", email)); return; }
      var btn = f.querySelector("button"); btn.disabled = true; btn.textContent = "Sending...";
      var r = await sb.auth.signInWithOtp({email: email, options: {emailRedirectTo: location.origin + location.pathname, shouldCreateUser: true}});
      if (r.error) { showGate(signInHtml(null, r.error.message, email)); return; }
      showGate(signInHtml(email)); return;
    }
    if (MODE !== "live") return;
    if (id === "f-invite") {
      var em = f.elements.email.value.trim().toLowerCase();
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(em)) { toast("Enter a full email address.", true); return; }
      var ri = await sb.from("invitations").insert({org_id: orgId, email: em, role: f.elements.role.value, invited_by: me.id});
      if (check(ri, "the invite")) toast("Invited " + em + ". Send them the portal link.");
      loadTeam(); return;
    }
    if (id === "f-person") {
      var nm = f.elements.name.value.trim(); if (!nm) { toast("Add the person's name.", true); return; }
      var rp = await sb.from("people").insert({org_id: orgId, name: nm, job_title: f.elements.title.value.trim(), payroll_hours_per_week: Number(f.elements.hours.value) || 40});
      if (check(rp, "the person")) { toast("Added " + nm + " to the timesheet."); teamData = null; await loadOrg(orgId); render(false); }
      return;
    }
    if (id === "f-company") {
      var cn = f.elements.name.value.trim(); if (!cn) { toast("Add the company name.", true); return; }
      var newId = uuid();
      var rc = await sb.from("organizations").insert({id: newId, name: cn, tax_year: Number(f.elements.year.value) || new Date().getFullYear()});
      if (!check(rc, "the company")) return;
      await sb.from("financial_records").insert(DEFAULT_RECORDS.map(function (l) { return {org_id: newId, label: l, status: "missing"}; }));
      var adm = f.elements.admin.value.trim().toLowerCase();
      if (adm) await sb.from("invitations").insert({org_id: newId, email: adm, role: "admin", invited_by: me.id});
      toast("Added " + cn + ".");
      await loadMe({id: me.id, email: me.email});
      location.hash = "overview"; openOrg(newId); return;
    }
  });

  /* ---------- start ---------- */
  var BASE_NAV = NAV.slice();
  function startDemo(data) {
    MODE = "demo"; ROLE = "admin";
    if (data && data.state) state = data.state;
    if (liveReady() && banner) banner.querySelector("span").insertAdjacentHTML("beforeend", ' <a href="./" data-act="exit-demo" style="color:inherit">Sign in instead</a>');
    meta.innerHTML = '<div class="user"><span class="avatar" aria-hidden="true">T</span><span class="user-text"><span class="user-mail">Demo account</span><span class="user-role">Company admin (sample)</span></span></div>';
    route = routeFromHash();
    firstAnim = true;
    render(false);
  }
  async function boot() {
    if (!liveReady() || wantsDemo()) {
      var hot = window.claude && window.claude.hot;
      if (hot && hot.snapshot) hot.snapshot(function () { return {state: state}; });
      if (hot && hot.ready) hot.ready(startDemo); else startDemo((hot && hot.data) || {});
      return;
    }
    MODE = "live";
    meta.innerHTML = ""; banner.hidden = true;
    sb = window.supabase.createClient(CFG.supabaseUrl, CFG.supabaseKey, {auth: {flowType: "pkce", detectSessionInUrl: true, persistSession: true}});
    showGate('<section class="gate-card"><p class="lead" role="status">Checking your sign-in...</p></section>');
    var s = await sb.auth.getSession();
    if (/[?&]code=/.test(location.search)) history.replaceState(null, "", location.pathname + location.hash);
    var session = s.data && s.data.session;
    if (!session) { showGate(signInHtml()); }
    else { await afterSignIn(session.user); }
    sb.auth.onAuthStateChange(function (ev, sess) {
      if (ev === "SIGNED_IN" && sess && !me) afterSignIn(sess.user);
      if (ev === "SIGNED_OUT") { me = null; showGate(signInHtml()); }
    });
  }
  boot();
})();
