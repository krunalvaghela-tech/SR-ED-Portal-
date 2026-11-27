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
  // CRA deadline rule: if the year end is the last day of a month, a deadline n months
  // later is the last day of that month; otherwise it is the same day of that month.
  function lastDayOf(y, m) { return new Date(Date.UTC(y, m + 1, 0)).getUTCDate(); }   // m is 0-based
  function addMonthsCRA(iso, n) {
    var y = Number(iso.slice(0, 4)), m = Number(iso.slice(5, 7)) - 1, d = Number(iso.slice(8, 10));
    var eom = d === lastDayOf(y, m);
    var t = new Date(Date.UTC(y, m + n, 1)), ty = t.getUTCFullYear(), tm = t.getUTCMonth();
    var day = eom ? lastDayOf(ty, tm) : Math.min(d, lastDayOf(ty, tm));
    return ty + "-" + String(tm + 1).padStart(2, "0") + "-" + String(day).padStart(2, "0");
  }
  function yearEnd() { return (state && state.yearEnd) || YEAR + "-12-31"; }
  function yearStart() { return addDays(addMonthsCRA(yearEnd(), -12), 1); }
  function claimDue() { return addMonthsCRA(yearEnd(), 18); }   // SR&ED reporting deadline: T2 due date + 12 months
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
      yearEnd: "2026-12-31", sbd: true,
      company: {legal_name: "Tallgrass Robotics Ltd.", operating_name: "Tallgrass Robotics", business_number: "123456789RC0001", province: "MB", ccpc: true,
                industry: "Agriculture and agri-food", employees: 14, address: "100 Sample Street, Unit 4", city: "Winnipeg", postal_code: "R3B 0A1",
                contact_name: "Riley Chen (sample)", contact_email: "riley@example.com", contact_phone: "204-555-0142", advisor_firm: "Sample Accounting LLP", advisor_email: "sred@example.com"},
      checklist: {tests: "yes", designs: "yes", notes: "no", people: "no", payroll: "yes", specified: "no",
                  mat_inv: "yes", mat_use: "no", overhead: "yes", ct_signed: "no", ct_inv: "yes", ct_reports: "no",
                  tp_agree: "na", tp_reports: "na", cap_agree: "na", cap_use: "na", cap_new: "na",
                  fund_logged: "yes", fund_agree: "no", prior: "yes", unpaid: "no"},
      filed: {"2025-12-31": "yes"},
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
        out.push({id:"hrs-" + p.id, sev:"high", go:"time", label:"Fix the timesheet",
          title: p.name + ": timesheet does not match payroll",
          detail: "This week's timesheet totals " + fmt(logged) + " h. Payroll paid " + fmt(p.payroll) + " h."});
      }
    });
    state.records.forEach(function (r) {
      if (r.status === "missing") {
        out.push({id:"rec-" + r.id, sev:"high", go:"funding", label:"Add the record",
          title: "Missing: " + r.label, detail: r.note || "This record is not on file."});
      }
    });
    state.projects.forEach(function (pr) {
      var last = lastEvidence(pr.id);
      var d = last ? days(last, TODAY) : null;
      if (pr.status === "Active" && (d === null || d > state.threshold)) {
        out.push({id:"stale-" + pr.id, sev:"med", go:"evidence", label:"File a record", open: pr.id,
          title: pr.name + ": no recent records",
          detail: d === null ? "No records filed for this project yet." :
            "Last record " + longDate(last) + ", " + d + " days ago. Your alert level is " + state.threshold + " days."});
      }
      if (!String(pr.results || "").trim()) {
        out.push({id:"res-" + pr.id, sev:"med", go:"project/" + pr.id, label:"Open the project",
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
  /* ---------- small shared visuals ---------- */
  function initials(name) { return String(name || "?").replace(/\(.*\)/, "").trim().split(/\s+/).slice(0, 2).map(function (w) { return w.charAt(0).toUpperCase(); }).join(""); }
  function avatarSm(name) {
    var h = 0; String(name || "").split("").forEach(function (c) { h = (h * 31 + c.charCodeAt(0)) % 3; });
    return '<span class="av av' + h + '" aria-hidden="true">' + esc(initials(name)) + "</span>";
  }
  function fileChip(e) {
    if (!e.file) return "";
    return '<span class="file-chip">' + icon(fileIcon(fileKind(e.file, localFiles[e.id] && localFiles[e.id].type))) + "<span>" + esc(e.file) + "</span></span>";
  }
  function smoothPath(pts) {
    if (!pts.length) return "";
    var d = "M" + pts[0][0].toFixed(1) + " " + pts[0][1].toFixed(1);
    for (var i = 0; i < pts.length - 1; i++) {
      var p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2;
      d += " C" + (p1[0] + (p2[0] - p0[0]) / 6).toFixed(1) + " " + (p1[1] + (p2[1] - p0[1]) / 6).toFixed(1) + " " +
        (p2[0] - (p3[0] - p1[0]) / 6).toFixed(1) + " " + (p2[1] - (p3[1] - p1[1]) / 6).toFixed(1) + " " + p2[0].toFixed(1) + " " + p2[1].toFixed(1);
    }
    return d;
  }
  function dayGroup(d) {
    var n = days(d, TODAY);
    return n <= 0 ? "Today" : n === 1 ? "Yesterday" : n < 7 ? "This week" : n < 31 ? "This month" : "Earlier";
  }

  function vOverview() {
    var g = gaps(), c = completion(), first = g[0];
    var high = g.filter(function (x) { return x.sev === "high"; }).length;
    var due = claimDue(), left = days(TODAY, due);
    var est = GUIDE && GUIDE.estimate ? GUIDE.estimate() : null;
    var sc = CLAIM ? CLAIM.score() : null, strength = sc ? sc.pct : null;
    var heroH1 = g.length ?
      '<span class="soft">' + plural(g.length, "gap", "gaps") + " to close.</span> Then your " + YEAR + ' binder is <span class="hot">ready</span>.' :
      '<span class="soft">Nothing missing.</span> Your ' + YEAR + ' binder is <span class="hot">ready</span>.';
    var cta = first ?
      '<a class="btn" href="#' + first.go + '">Fix the first gap <span class="arr" aria-hidden="true">&rarr;</span></a>' :
      '<a class="btn" href="#export">Export the binder <span class="arr" aria-hidden="true">&rarr;</span></a>';
    var tabs = '<nav class="ptabs" aria-label="Overview sections">' + [["overview", "Overview"], ["projects", "Projects"], ["deadlines", "Deadlines"], ["strength", "Claim strength"]].map(function (t) {
      return '<a class="ptab' + (t[0] === "overview" ? " on" : "") + '" href="#' + t[0] + '"' + (t[0] === "overview" ? ' aria-current="page"' : "") + ">" + t[1] + "</a>"; }).join("") + "</nav>";

    // figure cards
    var mini = function (href, ic, label, value, sub) {
      return '<a class="mini" href="#' + href + '"><span class="mini-ico">' + icon(ic) + '</span><span class="mini-v num">' + value + '</span><span class="mini-l">' + label + '</span><span class="mini-s">' + sub + "</span></a>";
    };
    var minis = '<div class="minis">' +
      (est == null && GUIDE && !GUIDE.allows("estimator") ? mini("plans", "lock-simple", "Estimated credit", "Growth", "Unlock the credit estimator") :
        mini("claimable", "calculator", "Estimated credit", est == null ? "–" : money.format(est), "Federal plus provincial")) +
      mini("strength", "gauge", "Claim strength", strength == null ? "–" : strength + "%", strength >= 85 ? "Strong" : strength >= 65 ? "Fair" : "At risk") +
      mini("deadlines", "calendar-blank", "Claim due", left >= 0 ? left + "<small> days</small>" : "Passed", longDate(due)) +
      mini("gaps", "warning-circle", "Open gaps", String(g.length), high + " to fix first") +
      "</div>";

    // line chart: records filed per month of the tax year
    var ys = yearStart(), months = [];
    for (var m = 0; m < 12; m++) months.push(addMonthsCRA(ys.slice(0, 8) + "01", m).slice(0, 7));
    var monthly = months.map(function (mm) { return state.evidence.filter(function (e) { return e.date.slice(0, 7) === mm; }).length; });
    var run = 0, counts = monthly.map(function (v) { run += v; return run; });   // running total reads as a steady trail
    var nowIdx = months.indexOf(TODAY.slice(0, 7)); if (nowIdx < 0) nowIdx = TODAY > months[11] ? 11 : -1;
    var W = 420, H = 230, P = 20, top = 20, maxC = Math.max.apply(null, counts.concat([2]));
    var x = function (i) { return P + i * (W - 2 * P) / 11; }, y = function (v) { return H - 28 - v / maxC * (H - 28 - top); };
    var upto = nowIdx < 0 ? -1 : nowIdx, pts = counts.slice(0, upto + 1).map(function (v, i) { return [x(i), y(v)]; });
    var path = smoothPath(pts), area = pts.length ? path + " L" + x(upto).toFixed(1) + " " + (H - 28) + " L" + x(0).toFixed(1) + " " + (H - 28) + " Z" : "";
    var peak = Math.max(0, upto);
    var grid = [0.5, 1].map(function (f) { return '<line class="lc-grid" x1="' + P + '" x2="' + (W - P) + '" y1="' + y(maxC * f).toFixed(1) + '" y2="' + y(maxC * f).toFixed(1) + '"/>'; }).join("");
    var dots = pts.map(function (p, i) { return '<circle class="lc-dot' + (i === peak ? " peak" : "") + '" cx="' + p[0].toFixed(1) + '" cy="' + p[1].toFixed(1) + '" r="' + (i === peak ? 5 : 3) + '"><title>' + MONTHS[Number(months[i].slice(5)) - 1] + ": " + monthly[i] + " filed, " + counts[i] + " in total</title></circle>"; }).join("");
    var labels = months.map(function (mm, i) { return '<text class="lc-x" x="' + x(i).toFixed(1) + '" y="' + (H - 8) + '" text-anchor="middle">' + MONTHS[Number(mm.slice(5)) - 1] + "</text>"; }).join("");
    var tip = "";
    if (pts.length) {
      var px = x(peak), py = y(counts[peak]), tw = 84, th = 36;
      var tx = Math.min(W - P - tw, Math.max(4, px - tw / 2)), ty = py - th - 10;
      if (ty < 4) { ty = py + 12; tx = Math.max(4, px - tw - 10); }
      tip = '<g class="lc-tip"><line x1="' + px.toFixed(1) + '" x2="' + px.toFixed(1) + '" y1="' + (py + 6).toFixed(1) + '" y2="' + (H - 28) + '"/>' +
        '<rect x="' + tx.toFixed(1) + '" y="' + ty.toFixed(1) + '" width="' + tw + '" height="' + th + '" rx="8"/>' +
        '<text x="' + (tx + tw / 2).toFixed(1) + '" y="' + (ty + 16).toFixed(1) + '" text-anchor="middle" class="lc-tv">' + counts[peak] + '</text>' +
        '<text x="' + (tx + tw / 2).toFixed(1) + '" y="' + (ty + 29).toFixed(1) + '" text-anchor="middle" class="lc-tl">in total</text></g>';
    }
    var lineCard = '<div class="card ov-card"><div class="row between"><h2>Records filed</h2><span class="stamp">' + plural(run, "record", "records") + " this tax year</span></div>" +
      '<svg class="lc" viewBox="0 0 ' + W + " " + H + '" role="img" aria-label="Running total of records filed: ' + months.map(function (mm, i) { return MONTHS[Number(mm.slice(5)) - 1] + " " + counts[i]; }).join(", ") + '">' +
      grid + (area ? '<path class="lc-area" d="' + area + '"/><path class="lc-line" d="' + path + '"/>' : "") + tip + dots + labels + "</svg></div>";

    // claim strength by category
    var pb = sc ? sc.cats.filter(function (k) { return k.pct != null; }).map(function (k) {
      return '<li><div class="pb-h"><span>' + esc(k.c.t) + '</span><span class="num">' + k.pct + '%</span></div><span class="pb-t" aria-hidden="true"><span style="width:' + k.pct + '%"></span></span></li>';
    }).join("") : "";
    var strengthCard = '<div class="card ov-card"><div class="row between"><h2>Claim strength</h2><a class="link-sm" href="#strength">Details</a></div><ul class="pbars">' + pb + "</ul></div>";

    // project cards
    var pcards = state.projects.map(function (pr) {
      var s = projectStats(pr);
      return '<a class="pcard" href="#project/' + pr.id + '"><div class="row between"><span class="mini-ico sm">' + icon("flask") + '</span><span class="small muted">' + plural(s.recs.length, "record", "records") + "</span></div>" +
        "<b>" + esc(pr.name) + '</b><span class="small muted">T661 lines ' + s.lines + "/3 · " + fmt(s.hrs) + " h this week</span>" +
        '<span class="tags"><span class="tag' + (pr.status === "Active" ? "" : " quiet") + '">' + esc(pr.status || "Active") + "</span>" + (s.lines === 3 ? '<span class="tag">Written up</span>' : '<span class="tag quiet">Write-up due</span>') + "</span>" +
        '<span class="pcard-f small muted">' + (s.last ? "Last record " + longDate(s.last) : "No records yet") + "</span></a>";
    }).join("");
    var projectsCard = '<div class="card ov-card"><div class="row between"><h2>Projects</h2><a class="link-sm" href="#projects">All projects</a></div>' +
      (pcards ? '<div class="pcards">' + pcards + "</div>" : '<div class="empty"><p class="hint">No projects yet.</p><button class="btn alt small" type="button" data-act="wizard">Add your first project</button></div>') + "</div>";

    // hours by project: rounded bars
    var hrs = state.projects.map(function (pr) { return [pr.name, state.people.reduce(function (s, p) { return s + (Number((state.hours[p.id] || {})[pr.id]) || 0); }, 0)]; });
    hrs.push(["Other work", state.people.reduce(function (s, p) { return s + (Number((state.hours[p.id] || {}).other) || 0); }, 0)]);
    var hmax = Math.max.apply(null, hrs.map(function (r) { return r[1]; }).concat([1])), top1 = hrs.reduce(function (b, r, i) { return r[1] > hrs[b][1] ? i : b; }, 0);
    var vb = '<div class="vbars" role="img" aria-label="Hours this week: ' + hrs.map(function (r) { return esc(r[0]) + " " + fmt(r[1]); }).join(", ") + '">' + hrs.map(function (r, i) {
      return '<div class="vb' + (i === top1 ? " vb-hi" : "") + (i === hrs.length - 1 ? " other" : "") + '" title="' + esc(r[0]) + ": " + fmt(r[1]) + ' h"><span class="vb-v num">' + fmt(r[1]) + '</span><span class="vb-bar" style="height:' + Math.max(4, r[1] / hmax * 100).toFixed(0) + '%"></span><span class="vb-l">' + esc(i === hrs.length - 1 ? "Other" : initials(r[0])) + "</span></div>";
    }).join("") + "</div>";
    var hoursCard = '<div class="card ov-card"><div class="row between"><h2>Hours this week</h2><a class="link-sm" href="#time">Timesheets</a></div><p class="hint">Week of ' + longDate(WEEK_OF) + ". Timesheets " + c.pct + "% complete over 8 weeks.</p>" + vb + "</div>";

    // recent records table and activity
    var recent = state.evidence.slice().sort(function (a, b) { return a.date < b.date ? 1 : -1; });
    var rows = recent.slice(0, 5).map(function (e) {
      var pn = person(e.person).name;
      return '<tr><td><button class="rec-link" type="button" data-act="rec" data-id="' + esc(e.id) + '">' + esc(e.title) + "</button>" + (e.file ? "<br>" + fileChip(e) : "") + "</td>" +
        '<td><span class="who">' + avatarSm(pn) + esc(pn) + "</span></td><td>" + esc(project(e.project).name) + '<br><span class="small muted">' + esc(e.type) + '</span></td><td class="nowrap">' + longDate(e.date) + "</td></tr>";
    }).join("");
    var tableCard = '<div class="card ov-card"><div class="row between"><h2>Recent records</h2><a class="link-sm" href="#evidence">All records</a></div>' +
      '<div class="table-wrap flat"><table class="glance"><thead><tr><th>Record</th><th>Person</th><th>Project</th><th>Filed</th></tr></thead><tbody>' + (rows || '<tr><td colspan="4" class="muted">No records yet.</td></tr>') + "</tbody></table></div></div>";
    var last = "", act = recent.slice(0, 7).map(function (e) {
      var grp = dayGroup(e.date), head = grp !== last ? '<li class="act-g">' + grp + "</li>" : ""; last = grp;
      return head + '<li class="act-i"><span class="act-ico">' + icon("files") + '</span><div><p><b>' + esc(person(e.person).name) + "</b> filed " + esc(e.title) + '</p><span class="small muted">' + esc(project(e.project).name) + " · " + longDate(e.date) + "</span></div></li>";
    }).join("");
    var actCard = '<div class="card ov-card"><div class="row between"><h2>Recent activity</h2></div><ul class="act-l">' + (act || '<li class="muted">Nothing yet.</li>') + "</ul></div>";

    var needs = g.slice(0, 4).map(function (x) {
      return '<li><span class="bdot' + (x.sev === "high" ? " hi" : "") + '" aria-hidden="true"></span><div><b>' + esc(x.title) + '</b><span class="small muted">' + esc(x.detail) + '</span></div><a class="btn alt small" href="#' + x.go + '">' + esc(x.label) + "</a></li>";
    }).join("");
    var needsCard = '<div class="card ov-card"><div class="row between"><h2>Needs attention</h2><a class="link-sm" href="#gaps">All gaps</a></div>' + (needs ? '<ul class="needs">' + needs + "</ul>" : '<p class="flash">All checks pass. <a href="#export">Export the binder</a>.</p>') + "</div>";

    return '<section class="stack ov" aria-labelledby="h-main">' +
      pageHead("Overview", heroH1, "", '<a class="btn alt" href="#evidence">' + icon("plus") + "File a record</a>" + cta) +
      tabs + flashHtml() + setupHtml() +
      '<div class="ov-grid g1">' + minis + lineCard + strengthCard + "</div>" +
      '<div class="ov-grid g2">' + projectsCard + hoursCard + "</div>" +
      '<div class="ov-grid g2">' + tableCard + actCard + "</div>" +
      '<div class="ov-grid g2">' + needsCard + (GUIDE ? GUIDE.overviewCard() : "") + "</div>" +
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
    var start = yearStart(), end = yearEnd(), due = claimDue();
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
      return '<tr data-cursor="Open"><td><a class="row-link" href="#project/' + pr.id + '">' + icon("flask") + esc(pr.name) + "</a></td>" +
        '<td><span class="ldots" aria-label="' + lines + ' of 3 T661 lines written">' + dots + "</span> " + lines + "/3</td>" +
        '<td class="r num">' + n + '</td><td class="r num">' + fmt(hrs) + "</td><td>" + (last ? '<span class="stamp">' + longDate(last) + "</span>" : '<span class="muted">None yet</span>') + "</td></tr>";
    }).join("");
    return '<div class="stack-sm rv"><div class="row between"><h2>Projects at a glance</h2><a href="#projects">Open projects</a></div>' +
      '<div class="table-wrap"><table class="glance"><thead><tr><th>Project</th><th>T661 lines</th><th class="r">Records</th><th class="r">Hours this week</th><th>Last record</th></tr></thead><tbody>' + rows + "</tbody></table></div></div>";
  }

  /* ---------- shared pieces: slide-in panels, project fields ---------- */
  function drawerHtml(id, title, inner) {
    return '<div class="drawer" id="' + id + '" hidden><div class="drawer-scrim" data-act="drawer-close"></div>' +
      '<aside class="drawer-panel" role="dialog" aria-modal="true" aria-labelledby="' + id + '-t">' +
      '<header class="drawer-head"><h2 id="' + id + '-t">' + title + '</h2><button class="icon-btn" type="button" data-act="drawer-close" aria-label="Close panel">' + icon("x-circle") + "</button></header>" +
      '<div class="drawer-body">' + inner + "</div></aside></div>";
  }
  function pageHead(eyebrow, h1, lead, actions) {
    return '<div class="page-head"><div class="stack-sm"><p class="eyebrow">' + eyebrow + '</p><h1 id="h-main">' + h1 + "</h1>" + (lead ? '<p class="lead">' + lead + "</p>" : "") + "</div>" +
      (actions ? '<div class="row page-actions">' + actions + "</div>" : "") + "</div>";
  }
  function fieldHtml(pr, f) {
    var id = "pf-" + pr.id + "-" + f.key, w = words(pr[f.key]);
    return '<div class="field t661"><div class="t661-head"><span class="t661-tag">' + f.tag + "</span>" +
      (f.limit ? '<span class="wc' + (w > f.limit ? " over" : "") + '" id="wc-' + id + '">' + w + " / " + f.limit + " words</span>" : "") + "</div>" +
      '<label for="' + id + '">' + esc(f.q) + '</label><textarea id="' + id + '" rows="' + (f.limit > 400 ? 8 : 5) + '" data-pid="' + pr.id + '" data-key="' + f.key + '" data-limit="' + f.limit + '" data-fk="' + id + '">' + esc(pr[f.key]) + "</textarea></div>";
  }
  function projectStats(pr) {
    var recs = state.evidence.filter(function (e) { return e.project === pr.id; });
    var hrs = state.people.reduce(function (s, p) { return s + (Number((state.hours[p.id] || {})[pr.id]) || 0); }, 0);
    var lines = FIELDS.filter(function (f) { return f.limit && String(pr[f.key] || "").trim(); }).length;
    var last = lastEvidence(pr.id);
    return {recs: recs, hrs: hrs, lines: lines, last: last, age: last ? days(last, TODAY) : null};
  }
  function evidenceForm(pid) {
    return '<form class="form" id="f-evidence" novalidate><div class="fields">' +
      '<div class="field wide"><label for="ev-title">What is it?</label><input id="ev-title" name="title" placeholder="For example: Chamber test 5 data" data-fk="ev-title"></div>' +
      '<div class="field wide" id="ev-suggest-row" hidden><p class="hint" id="ev-suggest" aria-live="polite"></p><div><button class="btn small alt" type="button" data-act="use-suggest" data-fk="use-suggest">Use this project</button></div></div>' +
      '<div class="field"><label for="ev-type">Type</label><select id="ev-type" name="type">' + options(TYPES, "Test data") + "</select></div>" +
      '<div class="field"><label for="ev-project">Project</label><select id="ev-project" name="project">' + options(state.projects, pid || (state.projects[0] && state.projects[0].id), "id", "name") + "</select></div>" +
      '<div class="field"><label for="ev-person">Person</label><select id="ev-person" name="person">' + options(state.people, state.people[0] && state.people[0].id, "id", "name") + "</select></div>" +
      '<div class="field"><label for="ev-source">Source</label><select id="ev-source" name="source">' + options(SOURCES, "Upload") + "</select></div>" +
      '<div class="field wide"><span class="lbl">File (optional)</span><label class="dropzone" for="ev-file"><input id="ev-file" name="file" type="file" class="dz-input" accept="image/*,application/pdf,.doc,.docx,.xls,.xlsx,.csv,.txt,.zip">' +
        icon("upload-simple") + '<b>Drop a file here, or choose one</b><span class="small muted">Photos, PDFs and documents up to 50 MB. ' + (MODE === "live" ? "Once filed, it can’t be replaced." : "In the demo, files stay on this device.") + "</span></label>" +
        '<div id="dz-picked"></div></div>' +
      "</div>" +
      '<div class="row"><button class="btn" type="submit" data-fk="ev-add">File it <span class="arr" aria-hidden="true">&rarr;</span></button><span class="hint">Dated ' + longDate(TODAY) + ". The date can’t be changed later.</span></div></form>";
  }
  function evidenceRows(list) {
    return list.map(function (e) {
      return '<tr><td data-v="' + e.date + '"><span class="stamp">' + longDate(e.date) + "</span></td>" +
        '<td><button class="rec-link" type="button" data-act="rec" data-id="' + esc(e.id) + '">' + esc(e.title) + "</button>" + (e.file ? "<br>" + fileChip(e) : "") + "</td>" +
        "<td>" + esc(e.type) + "</td><td>" + esc(project(e.project).name) + "</td>" +
        '<td><span class="who">' + avatarSm(person(e.person).name) + esc(person(e.person).name) + "</span></td><td>" + esc(e.source) + "</td>" +
        '<td><span class="pill quiet">' + ICON_LOCK + "Locked</span></td></tr>";
    }).join("");
  }
  function tableTools(id, placeholder, count) {
    return '<div class="dt-tools"><label class="dt-search"><span class="sr">Search this table</span>' + icon("magnifying-glass") +
      '<input type="search" data-dt="' + id + '" placeholder="' + placeholder + '" data-fk="dt-' + id + '"></label><span class="hint dt-count" id="' + id + '-count" role="status">' + count + "</span></div>";
  }

  /* ---------- company profile (one per client company) ---------- */
  var PROVINCE_LIST = [["AB","Alberta"],["BC","British Columbia"],["MB","Manitoba"],["NB","New Brunswick"],["NL","Newfoundland and Labrador"],["NS","Nova Scotia"],
    ["NT","Northwest Territories"],["NU","Nunavut"],["ON","Ontario"],["PE","Prince Edward Island"],["QC","Quebec"],["SK","Saskatchewan"],["YT","Yukon"]];
  var INDUSTRIES = ["Advanced manufacturing","Agriculture and agri-food","Aerospace and defence","Building and construction products","Clean technology and energy",
    "Electronics and hardware","Food and beverage processing","Life sciences and health","Mining and resources technology","Software and IT","Transportation and vehicles","Other"];
  var CO_FIELDS = [
    // key, label, group, required for a complete profile, input type, hint
    ["legal_name", "Legal name", "Business", true, "text", "As registered, for example Tallgrass Robotics Ltd."],
    ["operating_name", "Operating name", "Business", false, "text", "The name your team uses, if different. It shows at the top left."],
    ["business_number", "CRA business number", "Business", true, "text", "9 digits, with or without the RC program account, for example 123456789RC0001."],
    ["province", "Province", "Business", true, "province", "Where the R&D is done. It sets the provincial credit rate."],
    ["ccpc", "Canadian-controlled private corporation (CCPC)?", "Business", true, "yesno", "CCPCs can get the 35% refundable federal credit."],
    ["industry", "Industry", "Business", true, "industry", ""],
    ["employees", "Employees", "Business", false, "number", "Full-time equivalents, roughly."],
    ["address", "Street address", "Address", false, "text", ""],
    ["city", "City", "Address", false, "text", ""],
    ["postal_code", "Postal code", "Address", false, "text", "For example R3B 2E9."],
    ["contact_name", "Main contact", "Contacts", true, "text", "Who we talk to about the account."],
    ["contact_email", "Contact email", "Contacts", true, "email", ""],
    ["contact_phone", "Contact phone", "Contacts", false, "tel", "For example 204-555-0142."],
    ["advisor_firm", "Accountant or SR&ED advisor", "Contacts", false, "text", "The firm that files your claim."],
    ["advisor_email", "Advisor email", "Contacts", false, "email", ""]
  ];
  function company() { return state.company || (state.company = {}); }
  function companyName() { var c = company(); return c.operating_name || c.legal_name || ORG_NAME.replace(" (sample)", ""); }
  function provinceName(code) { var p = PROVINCE_LIST.find(function (x) { return x[0] === code; }); return p ? p[1] : ""; }
  function profileDone() {
    var req = CO_FIELDS.filter(function (f) { return f[3]; });
    var miss = req.filter(function (f) { var v = company()[f[0]]; return v === undefined || v === null || v === ""; });
    return {pct: Math.round((req.length - miss.length) / req.length * 100), missing: miss};
  }
  function coValid(key, v) {
    if (v === "" || v === null || v === undefined) return true;
    if (key === "business_number") return /^\d{9}(RC\d{4})?$/i.test(String(v).replace(/\s+/g, ""));
    if (key === "contact_email" || key === "advisor_email") return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v);
    if (key === "postal_code") return /^[A-Za-z]\d[A-Za-z] ?\d[A-Za-z]\d$/.test(v);
    if (key === "contact_phone") return String(v).replace(/\D/g, "").length >= 10;
    return true;
  }
  var CO_ERR = {business_number: "Use 9 digits, optionally followed by RC and 4 digits.", contact_email: "Enter a full email address.", advisor_email: "Enter a full email address.",
    postal_code: "Use the format A1A 1A1.", contact_phone: "Enter a 10-digit phone number."};
  function coInput(f, c, ro) {
    var k = f[0], v = c[k], id = "co-" + k, dis = ro ? " disabled" : "", inner;
    if (f[4] === "province") inner = '<select id="' + id + '" name="' + k + '"' + dis + '><option value="">Choose a province</option>' + PROVINCE_LIST.map(function (p) { return '<option value="' + p[0] + '"' + (v === p[0] ? " selected" : "") + ">" + p[1] + "</option>"; }).join("") + "</select>";
    else if (f[4] === "industry") inner = '<select id="' + id + '" name="' + k + '"' + dis + '><option value="">Choose an industry</option>' + INDUSTRIES.map(function (x) { return "<option" + (v === x ? " selected" : "") + ">" + x + "</option>"; }).join("") + "</select>";
    else if (f[4] === "yesno") inner = '<select id="' + id + '" name="' + k + '"' + dis + '><option value="">Choose</option><option value="yes"' + (v === true ? " selected" : "") + '>Yes</option><option value="no"' + (v === false ? " selected" : "") + ">No</option></select>";
    else inner = '<input id="' + id + '" name="' + k + '" type="' + f[4] + '" value="' + esc(v == null ? "" : v) + '"' + (f[4] === "number" ? ' min="0" inputmode="numeric"' : "") + dis + ">";
    return '<div class="field' + (k === "address" ? " wide" : "") + '"><label for="' + id + '">' + esc(f[1]) + (f[3] ? ' <span class="req" title="Needed for a complete profile">Required</span>' : "") + "</label>" + inner +
      (f[5] ? '<p class="hint">' + esc(f[5]) + "</p>" : "") + '<p class="field-err" id="' + id + '-err" role="alert"></p></div>';
  }
  function usageHtml() {
    var L = GUIDE ? GUIDE.limits() : {projects: Infinity, people: Infinity, storageGB: 100, label: "Growth"};
    var meter = function (label, used, max, unit) {
      var inf = !isFinite(max), pct = inf ? Math.min(100, used * 4) : Math.min(100, Math.round(used / max * 100));
      return '<li><div class="pb-h"><span>' + label + '</span><span class="num">' + used + (inf ? "" : " of " + max) + (unit || "") + (inf ? '<span class="muted"> · no limit</span>' : "") + "</span></div>" +
        '<span class="pb-t' + (!inf && used >= max ? " full" : "") + '" aria-hidden="true"><span style="width:' + (inf ? 12 : pct) + '%"></span></span></li>';
    };
    var active = state.projects.filter(function (p) { return (p.status || "Active") === "Active"; }).length;
    return '<ul class="pbars">' + meter("Active projects", active, L.projects) + meter("People on the timesheet", state.people.length, L.people) +
      '<li><div class="pb-h"><span>Evidence storage</span><span class="num">' + L.storageGB + " GB included</span></div></li></ul>";
  }
  function vCompany() {
    var c = company(), done = profileDone(), ro = !canManage(), L = GUIDE ? GUIDE.limits() : null;
    var groups = ["Business", "Address", "Contacts"].map(function (g) {
      return '<div class="card stack-sm"><h2>' + (g === "Business" ? "Business details" : g === "Address" ? "Address" : "Contacts") + '</h2><div class="fields">' +
        CO_FIELDS.filter(function (f) { return f[2] === g; }).map(function (f) { return coInput(f, c, ro); }).join("") + "</div></div>";
    }).join("");
    return '<section class="stack" aria-labelledby="h-main">' +
      pageHead("Company", '<span class="soft">' + esc(companyName()) + ".</span> Company profile.",
        "These details appear on your binder and set your provincial rate and deadlines. Every record, person and project in this portal belongs to this company only.",
        ro ? "" : '<button class="btn" type="submit" form="f-co" data-fk="co-save">Save profile</button>') +
      flashHtml() +
      '<div class="ov-grid g2">' +
        '<form class="stack" id="f-co" novalidate>' + groups + (ro ? '<p class="hint">Only a company admin can change the profile.</p>' : '<div class="row"><button class="btn" type="submit">Save profile</button></div>') + "</form>" +
        '<div class="stack">' +
          '<div class="card stack-sm"><div class="row between"><h2>Profile</h2><span class="stamp">' + done.pct + '% complete</span></div><span class="pb-t" aria-hidden="true"><span style="width:' + done.pct + '%"></span></span>' +
            (done.missing.length ? '<p class="hint">Still needed: ' + done.missing.map(function (f) { return esc(f[1]); }).join(", ") + ".</p>" : '<p class="hint">Complete. Thank you.</p>') + "</div>" +
          '<div class="card stack-sm"><div class="row between"><h2>Membership</h2><a class="link-sm" href="#plans">Manage</a></div><p><span class="tag">' + (L ? L.label : "Growth") + "</span></p>" + usageHtml() + "</div>" +
          '<div class="card stack-sm"><div class="row between"><h2>Tax year</h2><a class="link-sm" href="#deadlines">Change</a></div><p>' + longDate(yearStart()) + " to " + longDate(yearEnd()) + '</p><p class="hint">Claim due ' + longDate(claimDue()) + ".</p></div>" +
        "</div>" +
      "</div></section>";
  }
  function canAddProject() {
    var L = GUIDE ? GUIDE.limits() : null; if (!L) return true;
    return state.projects.filter(function (p) { return (p.status || "Active") === "Active"; }).length < L.projects;
  }
  function projectLimitMsg() {
    var L = GUIDE ? GUIDE.limits() : {projects: 3, label: "Starter"};
    return L.label + " includes " + plural(L.projects, "active project", "active projects") + ". Upgrade to Growth for unlimited projects, or mark a finished project as closed.";
  }

  /* ---------- projects list ---------- */
  function vProjects() {
    var rows = state.projects.map(function (pr) {
      var s = projectStats(pr);
      var dots = FIELDS.filter(function (f) { return f.limit; }).map(function (f) { return '<span class="ldot' + (String(pr[f.key] || "").trim() ? " on" : "") + '" title="' + f.tag + '"></span>'; }).join("");
      return '<tr><td data-v="' + esc(pr.name) + '"><a class="row-link" href="#project/' + pr.id + '">' + icon("flask") + esc(pr.name) + "</a></td>" +
        '<td><span class="pill ' + (pr.status === "Active" ? "good" : "quiet") + '">' + esc(pr.status || "Active") + "</span></td>" +
        '<td data-v="' + s.lines + '"><span class="ldots" aria-label="' + s.lines + ' of 3 T661 lines written">' + dots + "</span> " + s.lines + "/3</td>" +
        '<td class="r num" data-v="' + s.recs.length + '">' + s.recs.length + '</td><td class="r num" data-v="' + s.hrs + '">' + fmt(s.hrs) + "</td>" +
        '<td data-v="' + (s.last || "") + '">' + (s.last ? '<span class="stamp">' + longDate(s.last) + "</span>" : '<span class="muted">None yet</span>') + "</td></tr>";
    }).join("");
    var Lp = GUIDE ? GUIDE.limits() : null, activeN = state.projects.filter(function (p) { return (p.status || "Active") === "Active"; }).length;
    var form = !canAddProject() ? '<div class="stack-sm"><p>' + esc(projectLimitMsg()) + '</p><div class="row"><a class="btn" href="#plans">See Growth and Scale</a></div></div>' :
      '<form class="form" id="f-project" novalidate>' +
      '<div class="field"><label for="np-name">Project name</label><input id="np-name" name="name" placeholder="For example: Sensor enclosure heat test" data-fk="np-name"><p class="hint">Use a plain description of the technical goal. You can change it later.</p></div>' +
      '<div class="row"><button class="btn" type="submit" data-fk="np-add">Add project</button></div></form>';
    return '<section class="stack" aria-labelledby="h-main">' +
      pageHead("Projects", '<span class="soft">' + plural(state.projects.length, "project", "projects") + ".</span> Written the way CRA reads them.",
        "Open a project to write its T661 lines, see its records and the hours logged to it." + (Lp && isFinite(Lp.projects) ? " Your " + Lp.label + " plan includes " + activeN + " of " + Lp.projects + " active projects." : ""),
        '<button class="btn alt" type="button" data-act="drawer" data-target="dr-project" data-needs-write>' + icon("plus") + "New project</button>") +
      flashHtml() +
      (state.projects.length ?
        tableTools("t-projects", "Search projects", plural(state.projects.length, "project", "projects")) +
        '<div class="table-wrap"><table class="glance dt" id="t-projects"><thead><tr><th data-sort="text">Project</th><th data-sort="text">Status</th><th data-sort="num">T661 lines</th><th class="r" data-sort="num">Records</th><th class="r" data-sort="num">Hours this week</th><th data-sort="text">Last record</th></tr></thead><tbody>' + rows + "</tbody></table></div>"
        : '<div class="card empty stack-sm"><h2>No projects yet.</h2><p class="hint">Add the first project you are working on. The binder starts filling in from there.</p><div class="row"><button class="btn" type="button" data-act="drawer" data-target="dr-project">Add a project</button></div></div>') +
      drawerHtml("dr-project", "New project", form) +
      "</section>";
  }

  /* ---------- one project, with tabs ---------- */
  var curProject = null;
  var PTABS = [["overview", "Overview"], ["t661", "T661 write-up"], ["evidence", "Evidence"], ["time", "Time"]];
  function vProject() {
    var pr = state.projects.find(function (p) { return p.id === curProject; });
    if (!pr) return '<section class="stack" aria-labelledby="h-main"><div class="card empty stack-sm"><h1 id="h-main">Project not found.</h1><p class="hint">It may have been removed, or the link is from another company.</p><p><a class="btn alt" href="#projects">Back to projects</a></p></div></section>';
    var s = projectStats(pr), tab = state.ptab || "overview", a = answered(pr);
    var tabs = '<div class="ptabs" role="tablist" aria-label="Project sections">' + PTABS.map(function (t) {
      var on = t[0] === tab;
      return '<button type="button" role="tab" class="ptab' + (on ? " on" : "") + '" aria-selected="' + on + '" data-act="ptab" data-tab="' + t[0] + '" data-fk="ptab-' + t[0] + '">' + t[1] +
        (t[0] === "evidence" ? ' <span class="ptab-n">' + s.recs.length + "</span>" : t[0] === "t661" ? ' <span class="ptab-n">' + s.lines + "/3</span>" : "") + "</button>";
    }).join("") + "</div>";
    var stat = function (l, v, sub) { return '<div class="pstat"><span class="kpi-l">' + l + '</span><span class="pstat-v num">' + v + '</span><span class="kpi-s">' + sub + "</span></div>"; };
    var body = "";
    if (tab === "overview") {
      var next = [];
      FIELDS.forEach(function (f) { if (f.limit && !String(pr[f.key] || "").trim()) next.push(["Write " + f.tag, "t661"]); });
      if (s.age === null) next.push(["File the first record for this project", "evidence"]);
      else if (pr.status === "Active" && s.age > state.threshold) next.push(["No record for " + s.age + " days. File what happened since " + longDate(s.last), "evidence"]);
      if (!s.hrs) next.push(["No hours logged to this project this week", "time"]);
      var recent = s.recs.slice().sort(function (x, y) { return x.date < y.date ? 1 : -1; }).slice(0, 5).map(function (e) {
        return '<li><span class="ra-ico">' + icon("files") + '</span><div class="ra-b"><button class="rec-link" type="button" data-act="rec" data-id="' + esc(e.id) + '">' + esc(e.title) + '</button><span class="small muted">' + esc(e.type) + " · " + esc(person(e.person).name) + '</span></div><span class="stamp">' + longDate(e.date) + "</span></li>";
      }).join("");
      body = '<div class="pstats">' +
          stat("T661 lines", s.lines + "/3", a + " of 4 prompts answered") +
          stat("Records", String(s.recs.length), s.last ? "Last on " + longDate(s.last) : "None yet") +
          stat("Hours this week", fmt(s.hrs), "Week of " + longDate(WEEK_OF)) +
          stat("Freshness", s.age === null ? "–" : s.age + "<small> days</small>", "Since the last record. Alert at " + state.threshold) +
        "</div>" +
        '<div class="grid2 ov-2">' +
          '<div class="card stack-sm">' + fieldHtml(pr, FIELDS[0]) + "</div>" +
          '<div class="card stack-sm"><h2>What to do next</h2>' + (next.length ? '<ul class="next">' + next.map(function (n) {
            return '<li><button type="button" class="next-i" data-act="ptab" data-tab="' + n[1] + '">' + icon("arrow-right") + "<span>" + esc(n[0]) + "</span></button></li>"; }).join("") + "</ul>"
            : '<p class="flash">This project is up to date.</p>') + "</div>" +
        "</div>" +
        '<div class="card stack-sm"><div class="row between"><h2>Recent records</h2><button class="linkbtn" type="button" data-act="ptab" data-tab="evidence">All records</button></div><ul class="recent">' + (recent || '<li class="muted">No records yet.</li>') + "</ul></div>";
    } else if (tab === "t661") {
      body = '<div class="card stack-sm"><p class="hint">These three answers become the project description on CRA form T661, Part 2, Section B. Write in plain language, with dates and numbers. Your work saves as you type.</p>' +
        FIELDS.filter(function (f) { return f.limit; }).map(function (f) { return fieldHtml(pr, f); }).join("") + "</div>";
    } else if (tab === "evidence") {
      var list = s.recs.slice().sort(function (x, y) { return x.date < y.date ? 1 : -1; });
      body = '<div class="row between"><p class="hint">' + plural(list.length, "record", "records") + " for this project, newest first.</p>" +
        '<button class="btn alt small" type="button" data-act="drawer" data-target="dr-evidence" data-needs-write>' + icon("plus") + "File a record</button></div>" +
        (list.length ? tableTools("t-pev", "Search records", plural(list.length, "record", "records")) +
          '<div class="table-wrap"><table class="dt" id="t-pev"><thead><tr><th data-sort="date">Date</th><th data-sort="text">Record</th><th data-sort="text">Type</th><th data-sort="text">Project</th><th data-sort="text">Person</th><th data-sort="text">Source</th><th>Timestamp</th></tr></thead><tbody>' + evidenceRows(list) + "</tbody></table></div>"
          : '<div class="card empty"><p class="hint">No records yet. File the first one to start the trail.</p></div>') +
        drawerHtml("dr-evidence", "File a record", evidenceForm(pr.id));
    } else {
      var rows = state.people.map(function (p) {
        var hrs = Number((state.hours[p.id] || {})[pr.id]) || 0, tot = personTotal(p.id);
        return '<tr><td>' + esc(p.name) + '<br><span class="small muted">' + esc(p.role) + '</span></td><td class="r num" data-v="' + hrs + '">' + fmt(hrs) + '</td><td class="r num">' + fmt(tot) + '</td><td class="r num">' + (tot ? Math.round(hrs / tot * 100) : 0) + "%</td></tr>";
      }).join("");
      body = '<div class="card stack-sm"><div class="row between"><h2>Hours this week</h2><a class="link-sm" href="#time">Edit in Weekly time</a></div><p class="hint">Week of ' + longDate(WEEK_OF) + ". The share of each person’s week on this project is what supports their wages in the claim.</p>" +
        '<div class="table-wrap"><table class="dt" id="t-ptime"><thead><tr><th data-sort="text">Person</th><th class="r" data-sort="num">On this project</th><th class="r">Total week</th><th class="r">Share</th></tr></thead><tbody>' + rows + "</tbody></table></div></div>";
    }
    return '<section class="stack" aria-labelledby="h-main">' +
      '<nav class="backlink"><a href="#projects">' + icon("arrow-right", "flip") + "All projects</a></nav>" +
      pageHead("Project", esc(pr.name), "", (canWrite() ? '<label class="sr" for="pstatus">Project status</label><select id="pstatus" class="status-sel" data-pstatus="' + pr.id + '" data-fk="pstatus">' +
          ["Active", "Paused", "Closed"].map(function (o) { return "<option" + ((pr.status || "Active") === o ? " selected" : "") + ">" + o + "</option>"; }).join("") + "</select>" :
          '<span class="pill ' + (pr.status === "Active" ? "good" : "quiet") + '">' + esc(pr.status || "Active") + "</span>") +
        (tab !== "evidence" ? '<button class="btn alt" type="button" data-act="drawer" data-target="dr-evidence" data-needs-write>' + icon("plus") + "File a record</button>" : "")) +
      flashHtml() + tabs + '<div class="ptab-body" role="tabpanel">' + body + "</div>" +
      (tab !== "evidence" ? drawerHtml("dr-evidence", "File a record", evidenceForm(pr.id)) : "") +
      "</section>";
  }

  /* ---------- getting started (shows until the basics are done) ---------- */
  function setupHtml() {
    var steps = [
      ["Complete the company profile", profileDone().pct === 100, "company", "Business number, province and contacts for your binder."],
      ["Set your year end", !!state.yearEnd, "deadlines", "All deadlines are worked out from it."],
      ["Add your first project", state.projects.length > 0, "projects", "One per technical problem you are working on."],
      ["Add your team", state.people.length > 1, MODE === "live" ? "team" : "time", "Everyone who works on R&D, so their hours count."],
      ["File your first record", state.evidence.length > 0, "evidence", "A test result, photo or meeting note."],
      ["Log a week of time", completion().done > 0 || rdHours() > 0, "time", "Two minutes each Monday."]
    ];
    var done = steps.filter(function (s) { return s[1]; }).length;
    if (done === steps.length) return "";
    return '<div class="card setup stack-sm"><div class="row between"><h2>Get set up</h2><div class="row"><span class="stamp">' + done + " of " + steps.length + ' done</span>' + (canManage() ? '<button class="btn alt small" type="button" data-act="wizard">Guided setup</button>' : "") + "</div></div>" +
      '<div class="kpi-bar" aria-hidden="true"><span style="width:' + Math.round(done / steps.length * 100) + '%"></span></div>' +
      '<ol class="setup-l">' + steps.map(function (s, i) {
        return '<li class="' + (s[1] ? "done" : "") + '"><span class="setup-n">' + (s[1] ? icon("check-circle") : i + 1) + '</span><div><b>' + s[0] + '</b><span class="small muted">' + s[3] + "</span></div>" +
          (s[1] ? "" : '<a class="btn small alt" href="#' + s[2] + '">Start</a>') + "</li>";
      }).join("") + "</ol></div>";
  }

  /* ---------- sortable, searchable tables ---------- */
  var dtState = {};
  function dtApply(table) {
    var id = table.id, st = dtState[id] || {}, tbody = table.tBodies[0];
    if (!tbody) return;
    var rows = [].slice.call(tbody.rows).filter(function (r) { return r.cells.length > 1; });
    if (st.col != null) {
      var th = table.tHead.rows[0].cells[st.col], kind = th.getAttribute("data-sort");
      var val = function (r) { var c = r.cells[st.col]; var v = c.getAttribute("data-v"); v = v == null ? c.textContent.trim() : v; return kind === "num" ? parseFloat(v) || 0 : v.toLowerCase(); };
      rows.sort(function (a, b) { var x = val(a), y = val(b); return (x < y ? -1 : x > y ? 1 : 0) * (st.dir || 1); });
      rows.forEach(function (r) { tbody.appendChild(r); });
    }
    var q = (st.q || "").toLowerCase(), shown = 0;
    rows.forEach(function (r) { var hit = !q || r.textContent.toLowerCase().indexOf(q) >= 0; r.hidden = !hit; if (hit) shown++; });
    [].forEach.call(table.tHead.rows[0].cells, function (c, i) {
      if (!c.hasAttribute("data-sort")) return;
      c.setAttribute("aria-sort", st.col === i ? (st.dir === -1 ? "descending" : "ascending") : "none");
    });
    var cnt = document.getElementById(id + "-count");
    if (cnt) cnt.textContent = q ? shown + " of " + rows.length + " shown" : plural(rows.length, "row", "rows");
  }
  function enhanceTables() {
    [].forEach.call(app.querySelectorAll("table.dt"), function (t) {
      [].forEach.call(t.tHead.rows[0].cells, function (c, i) {
        if (!c.hasAttribute("data-sort") || c.querySelector("button")) return;
        c.innerHTML = '<button type="button" class="th-sort" data-act="dt-sort" data-table="' + t.id + '" data-col="' + i + '">' + c.innerHTML + '<span class="th-ar" aria-hidden="true"></span></button>';
      });
      var inp = app.querySelector('input[data-dt="' + t.id + '"]');
      if (inp && dtState[t.id] && dtState[t.id].q) inp.value = dtState[t.id].q;
      dtApply(t);
    });
  }

  /* ---------- slide-in panels ---------- */
  var drawerReturn = null;
  function openDrawer(id, from) {
    var d = document.getElementById(id); if (!d) return;
    drawerReturn = from || document.activeElement;
    document.body.appendChild(d);   // out of the animated page, so it covers the whole window
    d.hidden = false; document.body.classList.add("drawer-open");
    setTimeout(function () { var f = d.querySelector("input:not([type=file]),select,textarea"); if (f) f.focus(); }, 60);
  }
  function closeDrawer() {
    var d = document.querySelector(".drawer:not([hidden])"); if (!d) return;
    d.hidden = true; document.body.classList.remove("drawer-open");
    if (d.parentNode === document.body) d.remove();
    if (drawerReturn && drawerReturn.focus && document.contains(drawerReturn)) drawerReturn.focus();
  }

  function vEvidence() {
    var f = state.filters;
    var rows = state.evidence.filter(function (e) {
      return (f.project === "all" || e.project === f.project) && (f.type === "all" || e.type === f.type);
    }).sort(function (a, b) { return a.date < b.date ? 1 : a.date > b.date ? -1 : 0; });
    var projOpts = '<option value="all">All projects</option>' + options(state.projects, f.project, "id", "name");
    var typeOpts = '<option value="all">All types</option>' + options(TYPES, f.type);
    return '<section class="stack" aria-labelledby="h-main">' +
      pageHead("Evidence", '<span class="soft">' + plural(state.evidence.length, "record", "records") + ".</span> Dated and locked.",
        "Upload a file, forward an email or snap a photo. Each one is tagged to a project and a person, and its date can’t be changed later.",
        '<button class="btn" type="button" data-act="drawer" data-target="dr-evidence" data-needs-write>' + icon("plus") + "File a record</button>") +
      flashHtml() +
      '<div class="fields filters">' +
        '<div class="field"><label for="flt-project">Project</label><select id="flt-project" data-filter="project" data-fk="flt-project">' + projOpts + "</select></div>" +
        '<div class="field"><label for="flt-type">Record type</label><select id="flt-type" data-filter="type" data-fk="flt-type">' + typeOpts + "</select></div>" +
      "</div>" +
      tableTools("t-evidence", "Search records, people or projects", plural(rows.length, "record", "records")) +
      '<div class="table-wrap"><table class="dt" id="t-evidence"><thead><tr><th data-sort="date">Date</th><th data-sort="text">Record</th><th data-sort="text">Type</th><th data-sort="text">Project</th><th data-sort="text">Person</th><th data-sort="text">Source</th><th>Timestamp</th></tr></thead><tbody>' +
      (evidenceRows(rows) || '<tr><td colspan="7" class="muted">No records match these filters.</td></tr>') + "</tbody></table></div>" +
      drawerHtml("dr-evidence", "File a record", evidenceForm()) +
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
        return '<span class="sq' + (v ? "" : " miss") + '" role="img" aria-label="' + esc(p.name) + ", week of " + longDate(weeks[i]) + ": " + (v ? "completed" : "missed") + '"></span>';
      }).join("") + '<span class="num">' + done + "/8</span>";
    });

    return '<section class="stack" aria-labelledby="h-main">' +
      '<div class="stack-sm"><p class="eyebrow">Weekly time</p><h1 id="h-main"><span class="soft">Week of ' + longDate(WEEK_OF) + ".</span> <span id=\"wk-total\">" + fmt(rdHours()) + "</span> R&amp;D hours.</h1>" +
      '<p class="lead">Every Monday, each person takes about two minutes to split last week by project. We check the totals against payroll, so the hours and the pay always agree.</p></div>' +
      flashHtml() +
      (state.weekSubmitted ? '<p class="flash">Week of ' + longDate(WEEK_OF) + " submitted. Edits now show as changes on the record.</p>" : "") +
      '<div class="table-wrap time"><table><thead><tr><th>Person</th>' + head + '<th class="r">Non-R&amp;D</th><th class="r">Total h</th><th class="r">Payroll h</th><th>Check</th></tr></thead><tbody>' + rows + "</tbody></table></div>" +
      '<div class="row"><button class="btn" type="button" data-act="submit-week" data-fk="submit-week">' + (state.weekSubmitted ? "Submit changes" : "Submit week") + "</button></div>" +
      '<div class="card stack-sm"><div class="row between"><h2>The last 8 weeks</h2><span class="pill ' + (c.pct >= 80 ? "good" : "warn") + '">' + c.pct + "% done, target 80%</span></div>" +
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
      (company().legal_name || ORG_NAME) + (company().business_number ? " · BN " + company().business_number : ""),
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
      gen = '<div class="card stack-sm" role="status"><h2>Sample binder built</h2>' +
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
      '<div class="binder"><div class="spine"><h2>' + YEAR + ' SR&amp;ED Binder</h2><span class="mono small">' + esc(company().legal_name || ORG_NAME) + (company().business_number ? " &middot; BN " + esc(company().business_number) : "") + ' &middot; ' + longDate(yearStart()) + " to " + longDate(yearEnd()) + '</span></div><ol>' + items + "</ol></div>" +
      (GUIDE && !GUIDE.allows("export") ? GUIDE.upsell("Build and hand over the binder", "Your records are all here and stay safe. Building the indexed binder for your advisor or CRA is part of Growth and Scale.") :
      '<div class="row"><button class="btn" type="button" data-act="generate" data-fk="generate">Build the binder</button><button class="btn alt" type="button" data-act="copy" data-fk="copy">Copy index text</button>' + copyMsg + "</div>") +
      gen +
      '<pre class="index" aria-label="Binder index text">' + esc(indexText()) + "</pre>" +
      '<p class="hint">The portal organizes your records. Your accountant or SR&amp;ED advisor decides what to claim.</p>' +
      "</section>";
  }

  var VIEWS = {overview:vOverview, projects:vProjects, evidence:vEvidence, time:vTime, funding:vFunding, gaps:vGaps, export:vExport,
    team:function () { return vTeam(); }, companies:function () { return vCompanies(); }, project: vProject, company: function () { return vCompany(); }};

  /* ---------- plan and learn sections (assets/guide.js) ---------- */
  var GUIDE = window.SRED_GUIDE ? window.SRED_GUIDE({
    esc: esc, icon: icon, money: money, longDate: longDate, today: TODAY,
    fundingTotal: function () { return fundingTotal(); },
    render: function () { render(); },
    toast: function (t, bad) { toast(t, bad); },
    get mode() { return MODE; },
    get orgId() { return orgId; },
    get billing() { return billing; },
    get role() { return ROLE; },
    company: function () { return state && state.company; },
    fetchGuides: function () { return sb ? sb.from("funding_guides").select("slug,title,kind,body,checked_on").order("sort") : Promise.resolve({data: []}); },
    get canManage() { return canManage(); },
    stripe: (window.SRED_CONFIG || {}).stripe || {}
  }) : null;
  var CLAIM = window.SRED_CLAIM ? window.SRED_CLAIM({
    esc: esc, icon: icon, money: money, longDate: longDate, plural: plural, days: days, addDays: addDays, addMonths: addMonthsCRA,
    get today() { return TODAY; }, get state() { return state; }, get mode() { return MODE; },
    get canWrite() { return canWrite(); }, get canManage() { return canManage(); }, get orgName() { return companyName(); },
    yearEnd: yearEnd, yearStart: yearStart, claimDue: claimDue, completion: completion, fields: FIELDS, lastEvidence: lastEvidence,
    setYearEnd: function (iso, sbd) { state.yearEnd = iso; state.sbd = sbd; YEAR = iso.slice(0, 4); persist.yearEnd(iso, sbd); render(); },
    setCheck: function (item, v, ye) { if (item === "filed") state.filed[ye] = v; else state.checklist[item] = v; persist.check(item, v, ye); },
    render: function () { render(); }, toast: function (t, b) { toast(t, b); }
  }) : null;
  if (CLAIM) {
    var at = NAV.findIndex(function (n) { return n[0] === "export"; });
    CLAIM.nav.forEach(function (n, i) { NAV.splice(at + i, 0, n); ROUTES.push(n[0]); });
    Object.keys(CLAIM.icons).forEach(function (k) { NAV_ICON[k] = CLAIM.icons[k]; });
    Object.keys(CLAIM.views).forEach(function (k) { VIEWS[k] = CLAIM.views[k]; });
  }
  var HELP = window.SRED_HELP ? window.SRED_HELP({
    esc: esc, icon: icon, get route() { return route; },
    paid: function () { return GUIDE && GUIDE.paid ? GUIDE.paid() : true; },
    training: (window.SRED_CONFIG || {}).training || {}
  }) : null;
  if (GUIDE) {
    GUIDE.nav.forEach(function (n) { NAV.push(n); ROUTES.push(n[0]); });
    Object.keys(GUIDE.icons).forEach(function (k) { NAV_ICON[k] = GUIDE.icons[k]; });
    Object.keys(GUIDE.groups).forEach(function (k) { NAV_GROUP[k] = GUIDE.groups[k]; });
    var pAt = NAV.findIndex(function (n) { return n[0] === "plans"; });
    NAV.splice(pAt < 0 ? NAV.length : pAt, 0, ["company", "16", "Company"]); ROUTES.push("company");
    NAV_ICON.company = "buildings"; NAV_GROUP.company = "Account"; delete NAV_GROUP.plans;
    Object.keys(GUIDE.views).forEach(function (k) { VIEWS[k] = GUIDE.views[k]; });
  }

  /* ---------- render ---------- */
  var nav = document.getElementById("nav");
  var app = document.getElementById("app");

  function renderNav() {
    var n = gaps().length;
    nav.innerHTML = NAV.map(function (it) {
      var grp = NAV_GROUP[it[0]];
      return (grp ? '<p class="nav-group">' + grp + "</p>" : "") +
        '<a class="tab" href="#' + it[0] + '" title="' + esc(it[2]) + '"' + (route === it[0] || (route === "project" && it[0] === "projects") ? ' aria-current="page"' : "") + ">" +
        icon(NAV_ICON[it[0]]) + '<span class="tab-label">' + esc(it[2]) + "</span>" +
        (it[0] === "gaps" && n ? '<span class="count" aria-label="' + plural(n, "open gap", "open gaps") + '">' + n + "</span>" : "") +
        (GUIDE && GUIDE.locked && GUIDE.locked(it[0]) ? '<span class="tab-lock" title="Growth and Scale plans">' + icon("lock-simple") + '<span class="sr">Included in Growth and Scale</span></span>' : "") + "</a>";
    }).join("");
    var cur = NAV.find(function (x) { return x[0] === route; });
    var cp = document.getElementById("crumbPage"), co = document.getElementById("crumbOrg");
    if (cp) cp.textContent = route === "project" ? (state.projects.find(function (p) { return p.id === curProject; }) || {name: "Project"}).name : cur ? cur[2] : "";
    if (co) co.textContent = ORG_NAME.replace(" (sample)", "");
    var chips = document.getElementById("topChips");
    if (chips) chips.innerHTML = '<span class="chip">' + icon("calendar-blank") + "Tax year " + YEAR + "</span>" +
      '<span class="chip strong" title="SR&amp;ED reporting deadline: 18 months after the year end">' + icon("clock") + "Claim due " + longDate(claimDue()) + "</span>";
    if (typeof updateBell === "function") updateBell();
    var gd = document.getElementById("greetDate"), gt = document.getElementById("greetTitle"), uc = document.getElementById("userChip");
    if (gd) gd.textContent = new Date(TODAY + "T12:00:00").toLocaleDateString("en-CA", {weekday: "long", day: "numeric", month: "long", year: "numeric"});
    if (gt) gt.innerHTML = 'Welcome back<span class="gt-org"> to ' + esc(companyName()) + "</span>";
    if (uc) {
      var uname = MODE === "live" && me ? (me.full_name || me.email || "") : "Demo account";
      var urole = {kv: "KV admin", admin: "Company admin", staff: "Staff", advisor: "Advisor"}[ROLE] || "";
      uc.innerHTML = '<span class="avatar" aria-hidden="true">' + esc((uname || "?").charAt(0).toUpperCase()) + '</span><span class="uc-t"><b>' + esc(uname) + "</b><span>" + esc(urole) + "</span></span>";
    }
    var so = document.getElementById("sideOrg");
    if (so && (MODE === "demo" || (myOrgs.length <= 1 && ROLE !== "kv"))) so.innerHTML = orgCardHtml();
  }

  function render(moveFocus) {
    var fk = document.activeElement && document.activeElement.getAttribute && document.activeElement.getAttribute("data-fk");
    renderNav();
    document.body.classList.remove("drawer-open");
    [].forEach.call(document.querySelectorAll("body > .drawer"), function (d) { d.remove(); });
    app.innerHTML = VIEWS[route]();
    enhanceTables();
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
    var m = /^project\/([\w-]+)$/.exec(h);
    if (m) { if (curProject !== m[1]) state.ptab = "overview"; curProject = m[1]; return "project"; }
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
    var da = e.target.closest && e.target.closest("[data-act]");
    if (da) {
      var dact = da.getAttribute("data-act");
      if (dact === "drawer") { openDrawer(da.getAttribute("data-target"), da); return; }
      if (dact === "drawer-close") { closeDrawer(); return; }
      if (dact === "ptab") { state.ptab = da.getAttribute("data-tab"); render(); var tb = app.querySelector(".ptab.on"); if (tb) tb.focus(); return; }
      if (dact === "dt-sort") {
        var tid = da.getAttribute("data-table"), col = Number(da.getAttribute("data-col")), st = dtState[tid] || (dtState[tid] = {});
        st.dir = st.col === col ? -(st.dir || 1) : 1; st.col = col;
        dtApply(document.getElementById(tid)); return;
      }
    }
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
    if (t.matches("input[data-dt]")) {
      var tid = t.getAttribute("data-dt"); (dtState[tid] || (dtState[tid] = {})).q = t.value;
      var tbl = document.getElementById(tid); if (tbl) dtApply(tbl);
      return;
    }
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

  document.addEventListener("change", function (e) {
    var t = e.target; if (!t.matches || !t.matches("select[data-pstatus]")) return;
    var pr = state.projects.find(function (p) { return p.id === t.getAttribute("data-pstatus"); }); if (!pr) return;
    if (t.value === "Active" && (pr.status || "Active") !== "Active" && !canAddProject()) { t.value = pr.status; state.flash = {bad: true, text: projectLimitMsg()}; render(); return; }
    pr.status = t.value; persist.projectField(pr.id, "status", t.value);
    state.flash = {text: pr.name + " is now " + t.value.toLowerCase() + "." + (t.value === "Closed" ? " Its records stay in the binder." : "")};
    render();
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
      if (fileObj && fileObj.size > 50 * 1024 * 1024) { state.flash = {bad: true, text: fileObj.name + " is over 50 MB. Choose a smaller file."}; render(); return; }
      if (fileObj) localFiles[rec.id] = {url: URL.createObjectURL(fileObj), type: fileObj.type, name: fileObj.name, size: fileObj.size};
      state.evidence.push(rec);
      persist.evidence(rec, fileObj);
      state.filters = {project: "all", type: "all"};
      state.flash = {text: "Filed \"" + title + "\" under " + project(form.elements.project.value).name + ", dated " + longDate(TODAY) + "."};
      render();
      return;
    }
    if (form.id === "f-co") {
      if (!canManage()) return;
      var c = company(), patch = {}, bad = null;
      CO_FIELDS.forEach(function (f) {
        var el = form.elements[f[0]]; if (!el) return;
        var v = el.value.trim();
        if (f[4] === "yesno") v = v === "yes" ? true : v === "no" ? false : null;
        else if (f[4] === "number") v = v === "" ? null : Math.max(0, parseInt(v, 10) || 0);
        else if (f[0] === "business_number") v = v.replace(/\s+/g, "").toUpperCase();
        else if (f[0] === "postal_code") v = v.toUpperCase().replace(/^([A-Z]\d[A-Z]) ?(\d[A-Z]\d)$/, "$1 $2");
        var err = document.getElementById("co-" + f[0] + "-err");
        if (!coValid(f[0], v)) { if (err) err.textContent = CO_ERR[f[0]] || "Check this field."; if (!bad) bad = el; }
        else if (err) err.textContent = "";
        patch[f[0]] = v === "" ? null : v;
      });
      if (bad) { bad.focus(); toast("Fix the highlighted fields, then save.", true); return; }
      Object.keys(patch).forEach(function (k) { c[k] = patch[k]; });
      if (MODE === "live" && patch.legal_name) { patch.name = patch.operating_name || patch.legal_name; }
      persist.company(patch);
      state.flash = {text: "Profile saved for " + companyName() + "."};
      render(); return;
    }
    if (form.id === "f-project") {
      if (!canAddProject()) { state.flash = {bad: true, text: projectLimitMsg()}; render(); return; }
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
      state.flash = {text: "Added \"" + name + "\". Start with the goal, then the T661 lines as the work starts."};
      state.ptab = "overview";
      location.hash = "project/" + id;
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
    var st = document.getElementById("sideToggle");
    if (st) {
      st.setAttribute("aria-expanded", String(open));
      st.title = (open ? "Hide sidebar" : "Show sidebar") + " (Ctrl or Cmd + B)";
      var sr = st.querySelector(".sr"); if (sr) sr.textContent = open ? "Hide sidebar" : "Show sidebar";
    }
    var os = document.getElementById("openSide"); if (os) os.setAttribute("aria-expanded", String(open));
    scrim.hidden = !(open && mqNarrow.matches);
    if (remember && !mqNarrow.matches) { try { localStorage.setItem("sred-side", open ? "open" : "closed"); } catch (e) {} }
  }
  function initSide() {
    [].forEach.call(document.querySelectorAll("[data-icon]"), function (el) { el.outerHTML = icon(el.getAttribute("data-icon")); });
    setSide(mqNarrow.matches ? false : sidePref() === "open", false);   // slim icon rail by default
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
    var auto = app.querySelectorAll("section > :not(.hero):not(.rv):not(.drawer), details.proj, .records li");
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
    // Safety net: anything already on screen is shown even if the observer is slow to fire
    // (background tabs, embedded previews), so a page never sits blank.
    var onScreen = function () {
      var vh = window.innerHeight || 800;
      [].forEach.call(app.querySelectorAll(".rv:not(.in)"), function (el) {
        var r = el.getBoundingClientRect();
        if (r.top < vh && r.bottom > 0) {
          el.classList.add("in"); io.unobserve(el);
          [].forEach.call(el.querySelectorAll("[data-count]"), countUp);
        }
      });
    };
    requestAnimationFrame(function () { requestAnimationFrame(onScreen); });
    setTimeout(onScreen, 700);
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
  // Off in the app: a custom cursor slows people down in a data-heavy tool.
  var FANCY_CURSOR = false;
  if (FANCY_CURSOR && !reduced && window.matchMedia && window.matchMedia("(pointer: fine)").matches) {
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
  var sb = null, me = null, myOrgs = [], orgId = null, entryIds = {}, billing = null;
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
    company: function (patch) {
      if (MODE !== "live" || !canManage()) return;
      sb.from("organizations").update(patch).eq("id", orgId).then(function (r) { if (check(r, "the profile")) toast("Profile saved."); });
    },
    yearEnd: function (iso, sbd) {
      if (MODE !== "live" || !canManage()) return;
      later("ye", function () { sb.from("organizations").update({fiscal_year_end: iso, ccpc_sbd: sbd}).eq("id", orgId).then(function (r) { check(r, "the year end"); }); });
    },
    check: function (item, status, ye) {
      if (MODE !== "live" || !canWrite()) return;
      sb.from("claim_checklist").upsert({org_id: orgId, year_end: ye || yearEnd(), item: item, status: status, updated_by: me && me.id}, {onConflict: "org_id,year_end,item"})
        .then(function (r) { check(r, "the checklist"); });
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
    [].forEach.call(app.querySelectorAll("form, [data-act='submit-week'], [data-act='add-record'], #ev-suggest-row, [data-needs-write]"), function (el) { el.hidden = true; el.style.display = "none"; });
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
    // Billing is optional: the table only exists once supabase/billing.sql has run.
    try { var bl = await sb.from("billing").select("*").eq("org_id", orgId).maybeSingle(); billing = bl.error ? null : bl.data; } catch (e) { billing = null; }
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
      flash: null, generated: false, copied: "",
      yearEnd: null, sbd: true, checklist: {}, filed: {}
    };
    // Year end and checklist are optional: they exist once supabase/deadlines.sql has run.
    try {
      var ye = await sb.from("organizations").select("fiscal_year_end, ccpc_sbd").eq("id", orgId).maybeSingle();
      if (!ye.error && ye.data) { fresh.yearEnd = ye.data.fiscal_year_end; fresh.sbd = ye.data.ccpc_sbd !== false; }
      // Company profile columns exist once supabase/company.sql has run.
      var cp = await sb.from("organizations").select(CO_FIELDS.map(function (f) { return f[0]; }).join(",")).eq("id", orgId).maybeSingle();
      fresh.company = !cp.error && cp.data ? cp.data : {legal_name: ORG_NAME};
      var cl = await sb.from("claim_checklist").select("year_end, item, status").eq("org_id", orgId);
      if (!cl.error) (cl.data || []).forEach(function (r) {
        if (r.item === "filed") fresh.filed[r.year_end] = r.status;
        else if (!fresh.yearEnd || r.year_end === fresh.yearEnd) fresh.checklist[r.item] = r.status;
      });
    } catch (e) {}
    if (fresh.yearEnd) YEAR = fresh.yearEnd.slice(0, 4);
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

  function orgCardHtml() {
    var L = GUIDE ? GUIDE.limits() : null, c = company();
    return '<a class="org-card" href="#company" title="Company profile"><span class="org-logo" aria-hidden="true">' + esc(initials(companyName())) + '</span><span class="org-txt"><span class="org-name">' + esc(companyName()) + "</span>" +
      '<span class="org-sub">' + (L ? '<span class="tag sm">' + L.label + "</span> " : "") + "Tax year " + YEAR + (c.province ? " · " + c.province : "") + "</span></span></a>";
  }
  function renderHeader() {
    var sw = myOrgs.length > 1 ?
      '<label class="sr" for="org-switch">Company</label><select id="org-switch" class="org-switch">' +
        myOrgs.map(function (o) { return '<option value="' + o.id + '"' + (o.id === orgId ? " selected" : "") + ">" + esc(o.name) + "</option>"; }).join("") + "</select>" :
      "";
    var roleName = {kv: "KV admin", admin: "Company admin", staff: "Staff", advisor: "Advisor"}[ROLE] || ROLE;
    document.getElementById("sideOrg").innerHTML = orgCardHtml() + sw;
    meta.innerHTML = userBlock(me.email, roleName);
  }

  function userBlock(email, roleName) {
    return '<div class="user"><span class="avatar" aria-hidden="true">' + esc(email.charAt(0).toUpperCase()) + "</span>" +
      '<span class="user-text"><span class="user-mail">' + esc(email) + '</span><span class="user-role">' + esc(roleName) + "</span></span>" +
      '<button class="icon-btn" type="button" data-act="signout" title="Sign out"><span class="sr">Sign out</span>' + icon("sign-out") + "</button></div>";
  }

  function setNav() {
    NAV.length = 0; ROUTES.length = 0;
    BASE_NAV.forEach(function (n) { if (n[0] === "plans" && MODE === "live" && !canManage()) return; NAV.push(n); ROUTES.push(n[0]); });
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
    if (fp) fp.textContent = "This portal organizes your SR&ED records. It does not decide whether work qualifies or prepare the claim: your accountant or SR&ED advisor makes those calls.";
    route = routeFromHash(); firstAnim = true; render(false);
    maybeWizard();
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
        '<form class="card form" id="f-invite" novalidate><h2>Invite someone</h2>' +
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
      '<form class="card form stack-sm" id="f-company" novalidate><h2>Onboard a company</h2><p class="hint">Creates the company, sets its membership and invites its admin. Everything they add stays inside this company.</p><div class="fields">' +
        '<div class="field wide"><label for="nc-legal">Legal name</label><input id="nc-legal" name="legal" placeholder="For example: Prairie Sensor Works Inc."></div>' +
        '<div class="field"><label for="nc-op">Operating name (optional)</label><input id="nc-op" name="op" placeholder="Prairie Sensor Works"></div>' +
        '<div class="field"><label for="nc-bn">CRA business number (optional)</label><input id="nc-bn" name="bn" placeholder="123456789RC0001"></div>' +
        '<div class="field"><label for="nc-prov">Province</label><select id="nc-prov" name="prov">' + PROVINCE_LIST.map(function (p) { return '<option value="' + p[0] + '"' + (p[0] === "MB" ? " selected" : "") + ">" + p[1] + "</option>"; }).join("") + "</select></div>" +
        '<div class="field"><label for="nc-ye">Tax year end</label><input id="nc-ye" name="ye" type="date" value="' + new Date().getFullYear() + '-12-31"></div>' +
        '<div class="field"><label for="nc-plan">Membership</label><select id="nc-plan" name="plan"><option value="starter">Starter</option><option value="growth" selected>Growth</option><option value="scale">Scale</option><option value="partner">Partner (advisor firm)</option></select></div>' +
        '<div class="field"><label for="nc-status">Billing</label><select id="nc-status" name="status"><option value="trialing">14-day free trial</option><option value="active">Active (paid outside Stripe)</option></select></div>' +
        '<div class="field"><label for="nc-cname">Main contact name</label><input id="nc-cname" name="cname" placeholder="Owner or controller"></div>' +
        '<div class="field"><label for="nc-admin">Company admin email</label><input id="nc-admin" name="admin" type="email" placeholder="owner@company.ca"><p class="hint">They get admin access when they sign in with this email.</p></div>' +
      '</div><div class="row"><button class="btn" type="submit">Onboard company</button></div></form></div></section>';
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
      var Lt = GUIDE ? GUIDE.limits() : null, roleV = f.elements.role.value;
      if (Lt && isFinite(Lt.people) && roleV !== "advisor" && teamData && (teamData.members.filter(function (m) { return m.role !== "advisor"; }).length + teamData.invites.filter(function (i) { return i.role !== "advisor"; }).length) >= Lt.people) {
        toast(Lt.label + " includes " + Lt.people + " people. Upgrade to add more.", true); return;
      }
      var ri = await sb.from("invitations").insert({org_id: orgId, email: em, role: roleV, invited_by: me.id});
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
      var cn = f.elements.legal.value.trim(); if (!cn) { toast("Add the company's legal name.", true); return; }
      var opn = f.elements.op.value.trim(), bn = f.elements.bn.value.replace(/\s+/g, "").toUpperCase(), ye = f.elements.ye.value;
      var adm = f.elements.admin.value.trim().toLowerCase();
      if (bn && !/^\d{9}(RC\d{4})?$/.test(bn)) { toast("Business number: 9 digits, optionally followed by RC and 4 digits.", true); return; }
      if (!/^\d{4}-\d{2}-\d{2}$/.test(ye)) { toast("Choose the tax year end.", true); return; }
      if (adm && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(adm)) { toast("Enter the admin's full email address.", true); return; }
      var newId = uuid();
      var full = {id: newId, name: opn || cn, tax_year: Number(ye.slice(0, 4)), fiscal_year_end: ye, legal_name: cn, operating_name: opn || null,
        business_number: bn || null, province: f.elements.prov.value, contact_name: f.elements.cname.value.trim() || null, contact_email: adm || null};
      var rc = await sb.from("organizations").insert(full);
      if (rc.error && /column/i.test(rc.error.message || "")) rc = await sb.from("organizations").insert({id: newId, name: opn || cn, tax_year: Number(ye.slice(0, 4))});
      if (!check(rc, "the company")) return;
      var plan = f.elements.plan.value, st = f.elements.status.value;
      var rb = await sb.from("billing").upsert({org_id: newId, plan: plan, status: st, trial_ends_at: st === "trialing" ? new Date(Date.now() + 14 * 864e5).toISOString() : null}, {onConflict: "org_id"});
      if (rb.error) toast("Company added, but the membership was not set: run supabase/company.sql, then set it again.", true);
      await sb.from("financial_records").insert(DEFAULT_RECORDS.map(function (l) { return {org_id: newId, label: l, status: "missing"}; }));
      if (adm) await sb.from("invitations").insert({org_id: newId, email: adm, role: "admin", invited_by: me.id});
      toast("Added " + cn + ".");
      await loadMe({id: me.id, email: me.email});
      location.hash = "overview"; openOrg(newId); return;
    }
  });

  /* ---------- search (Ctrl/Cmd + K) and notifications ---------- */
  var cmd = document.getElementById("cmd"), cmdInput = document.getElementById("cmdInput"), cmdList = document.getElementById("cmdList");
  var cmdItems = [], cmdSel = 0, cmdLastFocus = null;
  function cmdSource() {
    var out = NAV.map(function (n) { return {kind: "Page", label: n[2], icon: NAV_ICON[n[0]], go: n[0]}; });
    state.projects.forEach(function (p) { out.push({kind: "Project", label: p.name, icon: "flask", go: "project/" + p.id}); });
    [["File a record", "evidence", "plus"], ["Log this week’s hours", "time", "clock"], ["Log a grant or subsidy", "funding", "receipt"],
     ["Check a project’s eligibility", "eligibility", "seal-check"], ["Estimate your credit", "claimable", "calculator"],
     ["Change the year end", "deadlines", "calendar-blank"], ["Help and training", "", "question"], ["Guided setup", "", "rocket-launch"], ["Copy the request list", "strength", "gauge"], ["Export the binder", "export", "books"]
    ].forEach(function (a) { out.push({kind: "Action", label: a[0], icon: a[2], go: a[1]}); });
    state.evidence.slice(-40).reverse().forEach(function (e) { out.push({kind: "Record", label: e.title, sub: e.date, icon: "files", go: "evidence"}); });
    return out;
  }
  function cmdRender() {
    var q = cmdInput.value.trim().toLowerCase();
    var all = cmdSource();
    cmdItems = (q ? all.filter(function (it) { return (it.label + " " + it.kind).toLowerCase().indexOf(q) >= 0; }) : all.filter(function (it) { return it.kind !== "Record"; })).slice(0, 12);
    cmdSel = Math.min(cmdSel, Math.max(0, cmdItems.length - 1));
    var last = "";
    cmdList.innerHTML = cmdItems.length ? cmdItems.map(function (it, i) {
      var headR = it.kind !== last ? '<li class="cmd-g" role="presentation">' + it.kind + "s</li>" : ""; last = it.kind;
      return headR + '<li id="cmd-' + i + '" role="option" aria-selected="' + (i === cmdSel) + '" class="cmd-i' + (i === cmdSel ? " on" : "") + '" data-i="' + i + '">' + icon(it.icon) +
        "<span>" + esc(it.label) + "</span>" + (it.sub ? '<span class="cmd-sub">' + esc(it.sub) + "</span>" : "") + "</li>";
    }).join("") : '<li class="cmd-empty">No matches. Try a project name or a page.</li>';
    cmdInput.setAttribute("aria-activedescendant", cmdItems.length ? "cmd-" + cmdSel : "");
    var on = cmdList.querySelector(".on"); if (on && on.scrollIntoView) on.scrollIntoView({block: "nearest"});
  }
  function cmdOpen() {
    if (!cmd || !shell || shell.hidden) return;
    cmdLastFocus = document.activeElement; cmd.hidden = false; cmdInput.value = ""; cmdSel = 0; cmdRender();
    setTimeout(function () { cmdInput.focus(); }, 0);
  }
  function cmdClose() { if (!cmd || cmd.hidden) return; cmd.hidden = true; if (cmdLastFocus && cmdLastFocus.focus) cmdLastFocus.focus(); }
  function cmdGo(it) {
    if (!it) return;
    cmdClose();
    if (it.label === "Help and training" && HELP) { HELP.open(); return; }
    if (it.label === "Guided setup") { openWizard(); return; }
    if (it.open) { state.open = {}; state.open[it.open] = true; }
    if (location.hash === "#" + it.go) render(true); else location.hash = it.go;
    if (it.open) setTimeout(function () {
      var d = app.querySelector('details.proj[open]');
      if (d) d.scrollIntoView({block: "start", behavior: "auto"});
    }, 60);
  }
  if (cmd) {
    cmdInput.addEventListener("input", function () { cmdSel = 0; cmdRender(); });
    cmdInput.addEventListener("keydown", function (e) {
      if (e.key === "ArrowDown") { e.preventDefault(); cmdSel = Math.min(cmdItems.length - 1, cmdSel + 1); cmdRender(); }
      else if (e.key === "ArrowUp") { e.preventDefault(); cmdSel = Math.max(0, cmdSel - 1); cmdRender(); }
      else if (e.key === "Enter") { e.preventDefault(); cmdGo(cmdItems[cmdSel]); }
      else if (e.key === "Escape") { e.preventDefault(); cmdClose(); }
    });
    cmdList.addEventListener("click", function (e) { var li = e.target.closest("[data-i]"); if (li) cmdGo(cmdItems[Number(li.getAttribute("data-i"))]); });
    cmd.addEventListener("click", function (e) { if (e.target.hasAttribute("data-cmd-close")) cmdClose(); });
    document.getElementById("cmdBtn").addEventListener("click", cmdOpen);
    document.addEventListener("keydown", function (e) {
      if ((e.metaKey || e.ctrlKey) && (e.key === "k" || e.key === "K")) { e.preventDefault(); cmd.hidden ? cmdOpen() : cmdClose(); }
    });
  }

  var bellBtn = document.getElementById("bellBtn"), bellPop = document.getElementById("bellPop"), bellN = document.getElementById("bellN");
  function bellItems() {
    var out = gaps().slice(0, 5).map(function (x) { return {t: x.title, d: x.detail, go: x.go, open: x.open, hi: x.sev === "high"}; });
    var due = claimDue(), t2 = addMonthsCRA(yearEnd(), 6), n1 = days(TODAY, t2), n2 = days(TODAY, due);
    if (n1 >= 0 && n1 <= 120) out.unshift({t: "T2 return due in " + plural(n1, "day", "days"), d: "File the SR&ED claim with it on " + longDate(t2) + ".", go: "deadlines", hi: n1 <= 30});
    if (n2 >= 0 && n2 <= 120) out.unshift({t: "Claim due in " + plural(n2, "day", "days"), d: "The final date is " + longDate(due) + ". No extensions.", go: "deadlines", hi: true});
    return out;
  }
  function updateBell() {
    if (!bellN) return;
    var n = bellItems().filter(function (x) { return x.hi; }).length;
    bellN.hidden = !n; bellN.textContent = n;
    bellBtn.setAttribute("aria-label", "Notifications" + (n ? ", " + n + " need attention" : ""));
  }
  function bellToggle(open) {
    var show = open == null ? bellPop.hidden : open;
    if (show) {
      var items = bellItems();
      bellPop.innerHTML = '<p class="bell-h">Needs attention</p>' + (items.length ? '<ul>' + items.map(function (x) {
        return '<li><a href="#' + x.go + '"' + (x.open ? ' data-open="' + x.open + '"' : "") + '><span class="bdot' + (x.hi ? " hi" : "") + '" aria-hidden="true"></span><span><b>' + esc(x.t) + '</b><span class="small muted">' + esc(x.d) + "</span></span></a></li>";
      }).join("") + "</ul>" : '<p class="small muted">Nothing needs attention. Nice work.</p>');
    }
    bellPop.hidden = !show; bellBtn.setAttribute("aria-expanded", String(show));
  }
  if (bellBtn) {
    bellBtn.addEventListener("click", function (e) { e.stopPropagation(); bellToggle(); });
    bellPop.addEventListener("click", function (e) { if (e.target.closest("a")) bellToggle(false); });
    document.addEventListener("click", function (e) { if (!bellPop.hidden && !e.target.closest(".bell-wrap")) bellToggle(false); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape" && !bellPop.hidden) { bellToggle(false); bellBtn.focus(); } });
  }

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && document.querySelector(".drawer:not([hidden])")) { e.preventDefault(); closeDrawer(); }
  });

  /* ---------- record viewer with photo and PDF preview ---------- */
  var localFiles = {};   // files added in this session: record id -> {url, type, name, size}
  var IMG_EXT = /\.(png|jpe?g|gif|webp|bmp|svg)$/i, PDF_EXT = /\.pdf$/i;
  function fileKind(name, type) {
    if ((type && type.indexOf("image/") === 0) || IMG_EXT.test(name || "")) return "image";
    if (type === "application/pdf" || PDF_EXT.test(name || "")) return "pdf";
    return name ? "file" : "none";
  }
  function fileIcon(kind) { return kind === "image" ? "image-square" : kind === "pdf" ? "file-pdf" : "file-text"; }
  function sizeText(b) { return b > 1048576 ? (b / 1048576).toFixed(1) + " MB" : Math.max(1, Math.round(b / 1024)) + " KB"; }
  function previewHtml(kind, url, name) {
    if (kind === "image") return '<div class="pv pv-img"><img src="' + esc(url) + '" alt="' + esc(name) + '"></div>';
    if (kind === "pdf") return '<div class="pv pv-pdf"><iframe src="' + esc(url) + '#view=FitH" title="' + esc(name) + '"></iframe></div>';
    return '<div class="pv pv-none">' + icon("file-text") + "<p><b>" + esc(name) + "</b><br>This file type can’t be previewed here. Download it to open it.</p></div>";
  }
  function closeRecord() { var d = document.getElementById("recDrawer"); if (d) { d.remove(); document.body.classList.remove("drawer-open"); } }
  function openRecord(id) {
    var e = state.evidence.find(function (x) { return x.id === id; }); if (!e) return;
    closeRecord();
    var lf = localFiles[id], kind = fileKind(e.file, lf && lf.type);
    var meta = [["Filed", longDate(e.date)], ["Type", e.type], ["Project", project(e.project).name], ["Person", person(e.person).name], ["Source", e.source]]
      .map(function (m) { return "<dt>" + m[0] + "</dt><dd>" + esc(m[1] || "") + "</dd>"; }).join("");
    var pv;
    if (lf) pv = previewHtml(kind, lf.url, e.file);
    else if (MODE === "live" && e.filePath) pv = '<div class="pv pv-load" id="pvSlot">' + icon(fileIcon(kind)) + "<p>Loading the file…</p></div>";
    else if (e.file) pv = '<div class="pv pv-none">' + icon(fileIcon(kind)) + "<p><b>" + esc(e.file) + "</b><br>This is a sample record, so there is no file to show. Files you add preview here straight away.</p></div>";
    else pv = '<div class="pv pv-none">' + icon("file-text") + "<p>No file is attached to this record. The description is the record.</p></div>";
    document.body.insertAdjacentHTML("beforeend",
      '<div class="drawer rec-drawer" id="recDrawer"><div class="drawer-scrim" data-act="rec-close"></div>' +
      '<aside class="drawer-panel" role="dialog" aria-modal="true" aria-labelledby="rec-t">' +
      '<header class="drawer-head"><h2 id="rec-t">' + esc(e.title) + '</h2><button class="icon-btn" type="button" data-act="rec-close" aria-label="Close record">' + icon("x-circle") + "</button></header>" +
      '<div class="drawer-body stack-sm">' + pv +
        '<div class="row" id="pvActions">' + (lf ? '<a class="btn alt small" href="' + esc(lf.url) + '" target="_blank" rel="noopener">' + icon("arrow-square-out") + "Open full size</a>" : "") + "</div>" +
        '<dl class="rec-meta">' + meta + "</dl>" +
        '<p class="rec-lock small muted">' + ICON_LOCK + "Locked on " + longDate(e.date) + ". It can’t be edited or deleted.</p>" +
      "</div></aside></div>");
    document.body.classList.add("drawer-open");
    var x = document.querySelector("#recDrawer .icon-btn"); if (x) x.focus();
    if (!lf && MODE === "live" && e.filePath) {
      sb.storage.from("evidence").createSignedUrl(e.filePath, 600).then(function (r) {
        var slot = document.getElementById("pvSlot"); if (!slot) return;
        if (r.error || !r.data) { slot.innerHTML = icon("file-text") + "<p>The file could not be loaded. Check your connection and try again.</p>"; return; }
        var url = r.data.signedUrl;
        slot.outerHTML = previewHtml(kind, url, e.file);
        var acts = document.getElementById("pvActions");
        if (acts) acts.innerHTML = '<a class="btn alt small" href="' + esc(url) + '" target="_blank" rel="noopener">' + icon("arrow-square-out") + "Open full size</a>" +
          '<a class="btn alt small" href="' + esc(url) + '&download=" rel="noopener">' + icon("download-simple") + "Download</a>";
      });
    }
  }

  /* ---------- drag and drop ---------- */
  var MAX_FILE = 50 * 1024 * 1024;
  function showPicked(input) {
    var f = input.files && input.files[0], box = document.getElementById("dz-picked"), zone = input.closest(".dropzone");
    if (!box) return;
    if (!f) { box.innerHTML = ""; if (zone) zone.classList.remove("has-file"); return; }
    if (f.size > MAX_FILE) {
      box.innerHTML = '<p class="dz-err" role="alert">' + esc(f.name) + " is " + sizeText(f.size) + ". The limit is 50 MB. Choose a smaller file.</p>";
      try { input.value = ""; } catch (err) {}
      if (zone) zone.classList.remove("has-file");
      return;
    }
    var kind = fileKind(f.name, f.type), thumb = kind === "image" ? '<img src="' + URL.createObjectURL(f) + '" alt="">' : icon(fileIcon(kind));
    box.innerHTML = '<div class="dz-file">' + thumb + "<div><b>" + esc(f.name) + '</b><span class="small muted">' + sizeText(f.size) + '</span></div><button class="linkbtn" type="button" data-act="dz-clear">Remove</button></div>';
    if (zone) zone.classList.add("has-file");
    var title = document.getElementById("ev-title");
    if (title && !title.value.trim()) { var nm = f.name.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " ").trim(); title.value = nm.charAt(0).toUpperCase() + nm.slice(1); title.dispatchEvent(new Event("input", {bubbles: true})); }
  }
  function putFile(file) {
    var input = document.getElementById("ev-file"); if (!input || !file) return;
    try { var dt = new DataTransfer(); dt.items.add(file); input.files = dt.files; } catch (err) { return; }
    showPicked(input);
  }
  function dropTarget() { return (route === "evidence" || route === "project") && canWrite() && app.querySelector("#dr-evidence, #f-evidence"); }
  var dragDepth = 0, dropVeil = null;
  function veil(on) {
    if (on && !dropVeil) {
      dropVeil = document.createElement("div"); dropVeil.className = "drop-veil";
      dropVeil.innerHTML = '<div class="drop-card">' + icon("upload-simple") + "<b>Drop to file a record</b><span>Photos, PDFs and documents up to 50 MB</span></div>";
      document.body.appendChild(dropVeil);
    } else if (!on && dropVeil) { dropVeil.remove(); dropVeil = null; }
  }
  function hasFiles(e) { return e.dataTransfer && [].indexOf.call(e.dataTransfer.types || [], "Files") >= 0; }
  document.addEventListener("dragenter", function (e) {
    if (!hasFiles(e)) return;
    var zone = e.target.closest && e.target.closest(".dropzone");
    if (zone) { zone.classList.add("over"); return; }
    if (!dropTarget() || document.querySelector(".drawer:not([hidden])")) return;
    dragDepth++; veil(true);
  });
  document.addEventListener("dragover", function (e) { if (hasFiles(e) && (dropVeil || (e.target.closest && e.target.closest(".dropzone")))) e.preventDefault(); });
  document.addEventListener("dragleave", function (e) {
    var zone = e.target.closest && e.target.closest(".dropzone");
    if (zone && !zone.contains(e.relatedTarget)) zone.classList.remove("over");
    if (dropVeil && --dragDepth <= 0) { dragDepth = 0; veil(false); }
  });
  document.addEventListener("drop", function (e) {
    if (!hasFiles(e)) return;
    var zone = e.target.closest && e.target.closest(".dropzone");
    if (!zone && !dropVeil) return;
    e.preventDefault(); dragDepth = 0; veil(false);
    if (zone) zone.classList.remove("over");
    var f = e.dataTransfer.files && e.dataTransfer.files[0]; if (!f) return;
    if (!zone) openDrawer("dr-evidence");
    setTimeout(function () { putFile(f); }, zone ? 0 : 80);
  });
  document.addEventListener("change", function (e) { if (e.target.id === "ev-file") showPicked(e.target); });

  /* ---------- guided first-run setup ---------- */
  var wiz = null;
  function wizKey() { return "sred-wizard-" + (MODE === "live" ? orgId : "demo"); }
  function wizSeen() { try { return localStorage.getItem(wizKey()) === "done"; } catch (e) { return false; } }
  function wizStep() {
    var s = wiz.step, ye = wiz.ye || yearEnd(), dots = [0, 1, 2, 3, 4].map(function (i) { return '<span class="wz-dot' + (i === s ? " on" : i < s ? " done" : "") + '"></span>'; }).join("");
    var body, next = "Continue", back = s > 0 && s < 4;
    if (s === 0) {
      body = '<div class="wz-hero">' + icon("rocket-launch") + "</div><h2 id=\"wz-t\">Let’s set up " + esc(companyName()) + "</h2>" +
        '<p class="lead">Three short steps, about two minutes. You can change everything later.</p>' +
        '<ol class="wz-list"><li>Your tax year end, so every deadline is right</li><li>Your first R&amp;D project</li><li>Who works on R&amp;D</li></ol>';
      next = "Start";
    } else if (s === 1) {
      var due = addMonthsCRA(ye, 18);
      body = '<p class="eyebrow">Step 1 of 3</p><h2 id="wz-t">When does your tax year end?</h2><p class="hint">It is on your last T2 return. Most companies use December 31.</p>' +
        '<div class="field"><label for="wz-ye">Last day of the tax year</label><input id="wz-ye" type="date" value="' + ye + '"></div>' +
        '<p class="wz-note" id="wz-due">Your SR&amp;ED claim for this year is due <b>' + longDate(due) + "</b>.</p>";
    } else if (s === 2) {
      body = '<p class="eyebrow">Step 2 of 3</p><h2 id="wz-t">What are you working on?</h2><p class="hint">Name one technical problem your team is trying to solve. Add more later.</p>' +
        '<div class="field"><label for="wz-name">Project name</label><input id="wz-name" value="' + esc(wiz.name || "") + '" placeholder="For example: Sensor enclosure heat test"></div>' +
        '<div class="field"><label for="wz-goal">What are you trying to achieve? (optional)</label><textarea id="wz-goal" rows="3" placeholder="For example: keep the sensor working from −40°C to 50°C">' + esc(wiz.goal || "") + "</textarea></div>" +
        (state.projects.length ? '<p class="hint">You already have ' + plural(state.projects.length, "project", "projects") + ". Leave this blank to skip.</p>" : "");
    } else if (s === 3) {
      body = '<p class="eyebrow">Step 3 of 3</p><h2 id="wz-t">Who works on R&amp;D?</h2><p class="hint">Everyone who works on these projects logs their hours each week, so their wages count in the claim.</p>' +
        '<ul class="wz-people">' + state.people.map(function (p) { return "<li>" + icon("users") + "<span><b>" + esc(p.name) + '</b><span class="small muted">' + esc(p.role || "") + "</span></span></li>"; }).join("") + "</ul>" +
        (MODE === "live" ? '<p class="hint">Invite the rest of your team from the Team page when you finish.</p>' : '<p class="hint">In your own portal, you invite people by email from the Team page.</p>');
    } else {
      body = '<div class="wz-hero done">' + icon("check-circle") + '</div><h2 id="wz-t">You’re set up</h2><p class="lead">Here is what to do this week:</p>' +
        '<ol class="wz-list"><li>File a record whenever a test, design change or meeting happens</li><li>Log hours by project each Monday</li><li>Write the T661 lines on each project as the work goes</li></ol>';
      next = wiz.pid ? "Open my project" : "Go to the overview";
    }
    return '<div class="wz-box" role="dialog" aria-modal="true" aria-labelledby="wz-t"><div class="wz-top"><div class="wz-dots" aria-hidden="true">' + dots + '</div><button class="linkbtn" type="button" data-act="wz-skip">' + (s === 4 ? "Close" : "Skip for now") + "</button></div>" +
      '<div class="wz-body">' + body + '</div><div class="wz-foot">' + (back ? '<button class="btn alt" type="button" data-act="wz-back">Back</button>' : "<span></span>") +
      '<button class="btn" type="button" data-act="wz-next">' + next + "</button></div></div>";
  }
  function wizRender() {
    var el = document.getElementById("wizard");
    if (!el) { el = document.createElement("div"); el.id = "wizard"; el.className = "wizard"; document.body.appendChild(el); }
    el.innerHTML = '<div class="wz-scrim"></div>' + wizStep();
    document.body.classList.add("drawer-open");
    setTimeout(function () { var f = el.querySelector(".wz-body input, .wz-body textarea") || el.querySelector("[data-act='wz-next']"); if (f) f.focus(); }, 40);
  }
  function openWizard() { wiz = {step: 0, ye: state.yearEnd || yearEnd(), name: "", goal: "", pid: null}; wizRender(); }
  function closeWizard(done) {
    var el = document.getElementById("wizard"); if (el) el.remove();
    document.body.classList.remove("drawer-open");
    try { localStorage.setItem(wizKey(), "done"); } catch (e) {}
    wiz = null;
    if (done) render();
  }
  function wizNext() {
    var s = wiz.step;
    if (s === 1) {
      var v = (document.getElementById("wz-ye") || {}).value;
      if (!/^\d{4}-\d{2}-\d{2}$/.test(v || "")) { toast("Choose the last day of your tax year.", true); return; }
      wiz.ye = v; state.yearEnd = v; YEAR = v.slice(0, 4); persist.yearEnd(v, state.sbd !== false);
    }
    if (s === 2) {
      wiz.name = (document.getElementById("wz-name") || {}).value.trim(); wiz.goal = (document.getElementById("wz-goal") || {}).value.trim();
      if (!wiz.name && !state.projects.length) { toast("Give your first project a name, or skip for now.", true); return; }
      if (wiz.name && !wiz.pid && !canAddProject()) { toast(projectLimitMsg(), true); return; }
      if (wiz.name && !wiz.pid) {
        var np = {id: uuid(), name: wiz.name, status: "Active", objective: wiz.goal, uncertainty: "", hypothesis: "", results: ""};
        state.projects.push(np); persist.addProject(np);
        if (wiz.goal) persist.projectField(np.id, "objective", wiz.goal);
        wiz.pid = np.id;
      }
    }
    if (s === 4) {
      var pid = wiz.pid; closeWizard(false);
      if (pid) { state.ptab = "overview"; location.hash = "project/" + pid; } else if (location.hash === "#overview") render(); else location.hash = "overview";
      return;
    }
    wiz.step++; wizRender();
  }
  document.addEventListener("click", function (e) {
    var b = e.target.closest && e.target.closest("[data-act]"); if (!b) return;
    var a = b.getAttribute("data-act");
    if (a === "rec") { openRecord(b.getAttribute("data-id")); return; }
    if (a === "rec-close") { closeRecord(); return; }
    if (a === "dz-clear") { var i = document.getElementById("ev-file"); if (i) { try { i.value = ""; } catch (err) {} showPicked(i); } return; }
    if (a === "wizard") { openWizard(); return; }
    if (!wiz) return;
    if (a === "wz-next") wizNext();
    else if (a === "wz-back") { wiz.step--; wizRender(); }
    else if (a === "wz-skip") closeWizard(true);
  });
  document.addEventListener("input", function (e) {
    if (e.target.id === "wz-ye" && /^\d{4}-\d{2}-\d{2}$/.test(e.target.value)) {
      var d = document.getElementById("wz-due"); if (d) d.innerHTML = "Your SR&amp;ED claim for this year is due <b>" + longDate(addMonthsCRA(e.target.value, 18)) + "</b>.";
    }
  });
  document.addEventListener("keydown", function (e) {
    if (e.key !== "Escape") return;
    if (wiz) { e.preventDefault(); closeWizard(true); return; }
    if (document.getElementById("recDrawer")) { e.preventDefault(); closeRecord(); }
  });
  function maybeWizard() {
    if (MODE === "live" && canManage() && !wizSeen() && (!state.yearEnd || !state.projects.length)) setTimeout(openWizard, 400);
  }

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
