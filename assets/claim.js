/* Deadlines (worked out from the company's year end) and Claim strength
   (what to collect for each cost category, scored).
   Deadline rules are CRA's: T2 return 6 months after year end, balance of tax
   2 months after (3 for qualifying CCPCs), SR&ED reporting deadline 12 months
   after the T2 due date, so 18 months after year end. */
(function () {
  "use strict";

  window.SRED_CLAIM = function (h) {
    var esc = h.esc, icon = h.icon;
    function S() { var s = h.state; s.checklist = s.checklist || {}; s.filed = s.filed || {}; return s; }
    function left(d) { return h.days(h.today, d); }
    function inDays(n) { return n === 0 ? "today" : n > 0 ? h.plural(n, "day", "days") + " left" : h.plural(-n, "day", "days") + " ago"; }

    /* ---------- deadline formulas ---------- */
    function dates(ye, sbd) {
      var t2 = h.addMonths(ye, 6);
      return {
        yearEnd: ye,
        start: h.addDays(h.addMonths(ye, -12), 1),
        balance: h.addMonths(ye, sbd ? 3 : 2),
        t2: t2,
        sred: h.addMonths(t2, 12)
      };
    }
    function plan(d) {
      return [
        {at: h.addDays(d.yearEnd, -90), t: "Quarter-four check", who: "Project leads", go: "projects",
         b: "Every project has its uncertainty and work written up (T661 lines 242 and 244). Close open gap alerts."},
        {at: d.yearEnd, t: "Year end", who: "Everyone", go: "time",
         b: "Submit the last weekly timesheet. Record any equipment bought or leased for SR&ED this year."},
        {at: h.addDays(d.yearEnd, 30), t: "Records lock", who: "Company admin", go: "strength",
         b: "All evidence filed and dated, timesheets complete, signed contracts and material receipts uploaded."},
        {at: h.addDays(d.yearEnd, 60), t: "Payroll and grant figures", who: "Bookkeeper", go: "funding",
         b: "Final payroll register, T4 summary, general ledger, and every grant or subsidy received for the year."},
        {at: h.addDays(d.yearEnd, 75), t: "Binder to your advisor", who: "Company admin", go: "export",
         b: "Export the binder and send it to your accountant or SR&ED advisor."},
        {at: h.addDays(d.yearEnd, 120), t: "Narratives and overhead method", who: "Technical lead", go: "projects",
         b: "Approve the T661 project descriptions, including results (line 246). Agree the overhead method: proxy or traditional. It is chosen on the T661 and cannot be changed later."},
        {at: h.addDays(d.t2, -30), t: "Final sign-off", who: "Owner", go: "strength",
         b: "Review the claim, the cost figures and the claim-strength score with your advisor."},
        {at: d.t2, t: "File with your T2 return", who: "Advisor", go: "deadlines", key: true,
         b: "File Form T661 and Schedule 31 with the T2, plus the provincial schedule (Manitoba: Schedule 380). This is the ideal date."},
        {at: h.addDays(d.sred, -90), t: "Last call", who: "Owner", go: "deadlines",
         b: "If the claim has not gone in yet, file now. There is no extension."},
        {at: d.sred, t: "SR&ED reporting deadline", who: "Advisor", go: "deadlines", key: true,
         b: "Last day CRA accepts the T661 and Schedule 31 for this year. Anything not reported by now is lost, including unpaid amounts."}
      ];
    }

    function vDeadlines() {
      var s = S(), ye = h.yearEnd(), d = dates(ye, s.sbd !== false), mgr = h.canManage;
      var cards = [
        ["Tax balance due", d.balance, (s.sbd !== false ? "3 months" : "2 months") + " after year end. Interest runs on anything unpaid after this."],
        ["T2 return due", d.t2, "6 months after year end. File the SR&ED claim with it: refunds arrive sooner."],
        ["SR&ED reporting deadline", d.sred, "18 months after year end. The final date. CRA cannot extend it."]
      ].map(function (c, i) {
        var n = left(c[1]);
        return '<div class="tile dl' + (i === 2 ? " solid" : "") + '"><span class="label">' + c[0] + '</span><span class="big dl-date">' + h.longDate(c[1]) +
          '</span><span class="sub">' + esc(c[2]) + '</span><span class="chip' + (i === 2 ? "" : " strong") + ' dl-left">' + icon("clock") + inDays(n) + "</span></div>";
      }).join("");
      var steps = plan(d).map(function (m) {
        var n = left(m.at), cls = n < 0 ? "past" : n <= 30 ? "soon" : "";
        return '<li class="pl ' + cls + (m.key ? " key" : "") + '"><span class="pl-dot" aria-hidden="true"></span><div class="pl-when"><b>' + h.longDate(m.at) + '</b><span class="small muted">' + (n < 0 ? "Passed" : inDays(n)) + "</span></div>" +
          '<div class="pl-what"><b>' + esc(m.t) + '</b><p class="small">' + esc(m.b) + '</p><p class="small muted">' + esc(m.who) + ' &middot; <a href="#' + m.go + '">Open</a></p></div></li>';
      }).join("");
      // Every claim year whose deadline has not passed, plus the last one that closed.
      var years = [];
      for (var k = 3; k >= 0; k--) {
        var y = h.addMonths(ye, -12 * k), dd = dates(y, s.sbd !== false), n2 = left(dd.sred);
        if (n2 < -400) continue;
        var filed = s.filed[y] === "yes";
        var st = filed ? '<span class="pill good">Filed</span>' : n2 < 0 ? '<span class="pill quiet">Closed</span>' :
                 y > h.today ? '<span class="pill quiet">In progress</span>' : n2 <= 120 ? '<span class="pill crit">Closing soon</span>' : '<span class="pill warn">Open</span>';
        years.push("<tr><td>" + h.longDate(h.addDays(h.addMonths(y, -12), 1)) + " to " + h.longDate(y) + "</td><td>" + h.longDate(dd.t2) + "</td><td>" + h.longDate(dd.sred) +
          '</td><td class="r num">' + (n2 >= 0 ? n2 : "–") + "</td><td>" + st + "</td><td>" +
          (y <= h.today && n2 >= 0 && h.canWrite ? '<label class="check tight"><input type="checkbox" data-c="filed" data-ye="' + y + '"' + (filed ? " checked" : "") + ' data-fk="c-filed-' + y + '"><span>Filed</span></label>' : "") + "</td></tr>");
      }
      return '<section class="stack" aria-labelledby="h-main">' +
        '<div class="stack-sm"><p class="eyebrow">Deadlines</p><h1 id="h-main"><span class="soft">Your year ends ' + h.longDate(ye) + ".</span> The claim is due " + h.longDate(d.sred) + ".</h1>" +
        '<p class="lead">Every date here comes from your year end, using CRA’s rules. Change the year end and all of them move, including the plan for what to hand in and when.</p></div>' +
        '<div class="card stack-sm"><h2>Your company’s year end</h2><div class="fields">' +
          '<div class="field"><label for="c-ye">Last day of the tax year</label><input id="c-ye" type="date" value="' + ye + '" data-c="ye"' + (mgr ? "" : " disabled") + ' data-fk="c-ye">' +
          '<p class="hint">Most companies use December 31. Many use March 31 or June 30. It is on your last T2 return.</p></div>' +
          '<div class="field"><span class="lbl">Small CCPC with the small business deduction?</span><div class="seg" role="group" aria-label="Small business deduction">' +
            '<button type="button" class="seg-b' + (s.sbd !== false ? " on" : "") + '" aria-pressed="' + (s.sbd !== false) + '" data-c="sbd" data-v="1"' + (mgr ? "" : " disabled") + ' data-fk="c-sbd-1">Yes</button>' +
            '<button type="button" class="seg-b' + (s.sbd === false ? " on" : "") + '" aria-pressed="' + (s.sbd === false) + '" data-c="sbd" data-v="0"' + (mgr ? "" : " disabled") + ' data-fk="c-sbd-0">No</button></div>' +
          '<p class="hint">If yes, and last year’s taxable income was within the business limit, the tax balance is due 3 months after year end instead of 2.</p></div>' +
        "</div>" + (mgr ? "" : '<p class="hint">Only a company admin can change the year end.</p>') + "</div>" +
        '<div class="tiles dls">' + cards + "</div>" +
        '<div class="stack-sm"><h2>What to hand in, and when</h2><p class="lead">Ten steps from three months before year end to the final deadline. Each one links to the page where it gets done.</p></div>' +
        '<ol class="plan-tl">' + steps + "</ol>" +
        '<div class="card stack-sm"><h2>Claim years still open</h2><p class="hint">Because the deadline is 18 months, two claim years are often open at the same time. Mark each one filed when it goes in.</p>' +
          '<div class="table-wrap"><table style="min-width:640px"><thead><tr><th>Tax year</th><th>T2 due</th><th>SR&amp;ED due</th><th class="r">Days left</th><th>Status</th><th></th></tr></thead><tbody>' + years.join("") + "</tbody></table></div></div>" +
        '<div class="card stack-sm"><h2>How the dates are worked out</h2><ul class="plain">' +
          "<li><b>T2 return:</b> 6 months after year end. If the year ends on the last day of a month, the date is the last day of the sixth month after. Otherwise it is the same day of the sixth month.</li>" +
          "<li><b>Tax balance:</b> 2 months after year end, or 3 months for a CCPC that claims the small business deduction and whose taxable income last year was within its business limit.</li>" +
          "<li><b>SR&amp;ED claim:</b> 12 months after the T2 due date, so 18 months after year end. Form T661 and Schedule 31 must reach CRA by then. Provincial credits (Manitoba: Schedule 380) follow the same date.</li>" +
          "<li><b>Why June and December come up so often:</b> a December 31 year end puts the T2 on June 30 and the SR&amp;ED deadline on June 30 a year later. A June 30 year end puts both on December 31.</li>" +
          "<li>When a T2 due date falls on a weekend or public holiday, CRA accepts it the next business day. Do not count on extra days for the SR&amp;ED deadline: file well before it.</li></ul>" +
          '<p class="hint">Sources: CRA <a href="https://www.canada.ca/en/revenue-agency/services/forms-publications/publications/t4088/guide-form-t661-scientific-research-experimental-development-expenditures-claim-guide-form-t661.html" target="_blank" rel="noopener">Guide T4088</a>, <a href="https://www.canada.ca/en/revenue-agency/services/forms-publications/publications/t4012/t2-corporation-income-tax-guide-before-you-start.html" target="_blank" rel="noopener">T2 Corporation Guide</a> and <a href="https://www.canada.ca/en/revenue-agency/services/tax/businesses/topics/corporations/corporation-payments/paying-your-balance-corporation-tax/balance-day.html" target="_blank" rel="noopener">balance-due day</a>. Confirm your dates with your accountant.</p></div>' +
        "</section>";
    }

    /* ---------- claim strength ---------- */
    // w = weight. auto(s) returns 0..1 and a short note, measured from the portal itself.
    function frac(list, test) { return list.length ? list.filter(test).length / list.length : 0; }
    function lineAuto(key, tag) {
      return function (s) { var v = frac(s.projects, function (p) { return String(p[key] || "").trim(); });
        return [v, Math.round(v * s.projects.length) + " of " + s.projects.length + " projects have " + tag + " written"]; };
    }
    var CATS = [
      {id: "tech", t: "Project and technical evidence", why: "CRA reviews the science first. Without this, costs do not matter.", items: [
        {k: "t242", w: 3, t: "The uncertainty, for every project", h: "What you could not do with existing knowledge or standard practice. T661 line 242.", go: "projects", auto: lineAuto("uncertainty", "line 242")},
        {k: "t244", w: 3, t: "The work done and hypotheses tested", h: "What you tried, what you expected, and what changed next. T661 line 244.", go: "projects", auto: lineAuto("hypothesis", "line 244")},
        {k: "t246", w: 3, t: "The advancement, including failures", h: "What you learned about the technology, with dates and numbers. T661 line 246.", go: "projects", auto: lineAuto("results", "line 246")},
        {k: "fresh", w: 3, t: "Dated records as the work happened", h: "Every active project has recent evidence. Records written at the time beat anything rebuilt later.", go: "evidence",
         auto: function (s) { var act = s.projects.filter(function (p) { return p.status === "Active"; }); var v = frac(act, function (p) { var l = h.lastEvidence(p.id); return l && h.days(l, h.today) <= s.threshold; });
           return [act.length ? v : 1, act.length ? Math.round(v * act.length) + " of " + act.length + " active projects have a record in the last " + s.threshold + " days" : "No active projects"]; }},
        {k: "tests", w: 2, t: "Test plans and results", h: "Parameters changed, measurements, and what each test showed.", go: "evidence"},
        {k: "designs", w: 2, t: "Design revisions, prototypes, photos, code commits", h: "Proof of each iteration, with dates.", go: "evidence"},
        {k: "notes", w: 1, t: "Technical meeting notes and emails", h: "Show decisions being made as results came in.", go: "evidence"},
        {k: "people", w: 1, t: "Who did the work, and their qualifications", h: "Names, roles and a short CV for key people on each project.", go: "time"}
      ]},
      {id: "labour", t: "Labour", why: "Usually the biggest cost, and the one CRA tests hardest.", items: [
        {k: "time", w: 3, t: "Time by project, every week", h: "Hours split between SR&ED projects and other work, matched to payroll.", go: "time",
         auto: function (s) { var c = h.completion(); return [c.pct / 100, c.pct + "% of weekly timesheets done over 8 weeks"]; }},
        {k: "payroll", w: 3, t: "Payroll register and T4 summary", h: "Wages paid to everyone who worked on SR&ED.", go: "funding"},
        {k: "roles", w: 1, t: "Job title and duties for each person", h: "Hands-on or direct support, so the right share of wages is claimed.", go: "time",
         auto: function (s) { var v = frac(s.people, function (p) { return String(p.role || "").trim(); }); return [s.people.length ? v : 0, Math.round(v * s.people.length) + " of " + s.people.length + " people have a role"]; }},
        {k: "specified", w: 1, t: "Owners and related staff identified", h: "Specified employees (10% or more ownership, or related) have extra limits on salary and bonuses.", go: "time"},
        {k: "unpaid", w: 1, t: "Unpaid wages and bonuses listed", h: "Amounts unpaid 180 days after year end are not claimable that year and must be reported by the deadline.", go: "funding"}
      ]},
      {id: "mat", t: "Materials", why: "Only materials consumed or transformed count.", none: true, items: [
        {k: "mat_inv", w: 2, t: "Invoices for materials, by project", h: "Receipts linked to the project that used them.", go: "evidence"},
        {k: "mat_use", w: 1, t: "How each material was used up or transformed", h: "A line per purchase: destroyed in testing, or built into a prototype.", go: "evidence"}
      ]},
      {id: "oh", t: "Overhead", why: "The method is fixed once you file.", items: [
        {k: "overhead", w: 2, t: "Overhead method agreed: proxy or traditional", h: "Proxy adds 55% of SR&ED wages with no receipts. The choice is made on the T661 and cannot be changed later.", go: "claimable"}
      ]},
      {id: "ct", t: "Contracts", why: "80% of arm’s-length Canadian contracts count, if the paperwork shows SR&ED.", none: true, items: [
        {k: "ct_signed", w: 2, t: "Signed contracts that describe the technical work", h: "With Canadian contractors, for work done in Canada.", go: "funding"},
        {k: "ct_inv", w: 2, t: "Contractor invoices and proof of payment", h: "Matched to each contract.", go: "funding"},
        {k: "ct_reports", w: 1, t: "Contractors’ technical reports", h: "What they tested and found.", go: "evidence"}
      ]},
      {id: "tp", t: "Third-party payments", why: "Payments to colleges, universities and research institutes, such as RRC Polytech.", none: true, items: [
        {k: "tp_agree", w: 2, t: "Research agreements", h: "Who does what, and who owns the results.", go: "funding"},
        {k: "tp_reports", w: 1, t: "Their reports and test data", h: "A report alone is not enough: keep your own records too.", go: "evidence"}
      ]},
      {id: "cap", t: "Leases and capital equipment", why: "Back in the claim for property acquired on or after December 16, 2024.", none: true, items: [
        {k: "cap_agree", w: 2, t: "Purchase or lease agreements, with dates", h: "Showing the equipment was acquired on or after December 16, 2024.", go: "funding"},
        {k: "cap_use", w: 1, t: "How much of its use is SR&ED", h: "A usage log or estimate per item.", go: "evidence"},
        {k: "cap_new", w: 1, t: "Confirmation it was not used before", h: "Equipment used or acquired for use by someone else first does not qualify.", go: "funding"}
      ]},
      {id: "fund", t: "Grants and other assistance", why: "Grants come off the claim. Missing one can mean paying credits back.", items: [
        {k: "fund_logged", w: 2, t: "Every grant, subsidy and contribution logged", h: "IRAP, Mitacs, wage subsidies, provincial programs.", go: "funding"},
        {k: "fund_agree", w: 1, t: "Grant agreements and claims", h: "To show which costs each grant paid for.", go: "funding"}
      ]},
      {id: "file", t: "Filing", why: "Dates and history your advisor needs.", items: [
        {k: "ye", w: 1, t: "Year end confirmed", h: "All deadlines are worked out from it.", go: "deadlines",
         auto: function (s) { return [s.yearEnd ? 1 : 0, s.yearEnd ? "Year end " + h.longDate(s.yearEnd) : "Not set yet"]; }},
        {k: "prior", w: 1, t: "Last year’s claim and any CRA review letters", h: "So this year’s claim is consistent with the last one.", go: "evidence"}
      ]}
    ];
    function itemVal(it, s) {
      if (it.auto) { var a = it.auto(s); return {v: Math.max(0, Math.min(1, a[0])), note: a[1], auto: true}; }
      var st = s.checklist[it.k];
      return {v: st === "yes" ? 1 : 0, na: st === "na", st: st || ""};
    }
    function score() {
      var s = S(), tw = 0, got = 0, cats = CATS.map(function (c) {
        var cw = 0, cg = 0;
        c.items.forEach(function (it) { var r = itemVal(it, s); if (r.na) return; cw += it.w; cg += it.w * r.v; });
        tw += cw; got += cg;
        return {c: c, pct: cw ? Math.round(cg / cw * 100) : null};
      });
      return {pct: tw ? Math.round(got / tw * 100) : 0, cats: cats};
    }
    function rating(p) { return p >= 85 ? ["good", "Strong"] : p >= 65 ? ["warn", "Fair"] : ["crit", "At risk"]; }
    function requestText() {
      var s = S(), d = dates(h.yearEnd(), s.sbd !== false), lock = h.addDays(d.yearEnd, 30), lines = [];
      CATS.forEach(function (c) {
        var miss = c.items.filter(function (it) { var r = itemVal(it, s); return !r.na && r.v < 1; });
        if (!miss.length) return;
        lines.push("", c.t.toUpperCase());
        miss.forEach(function (it) { lines.push("- " + it.t + ": " + it.h); });
      });
      if (!lines.length) return "Nothing outstanding. Every item is in.";
      return ["SR&ED records still needed: " + h.orgName.replace(" (sample)", ""),
        "Tax year ending " + h.longDate(d.yearEnd) + ". Please add these to the portal by " + h.longDate(lock) + " (records lock).",
        "Final SR&ED deadline: " + h.longDate(d.sred) + "."].concat(lines).join("\n");
    }
    function vStrength() {
      var s = S(), sc = score(), r = rating(sc.pct), wr = h.canWrite;
      var R = 52, C = 2 * Math.PI * R, off = C * (1 - sc.pct / 100);
      var bars = sc.cats.map(function (x) {
        return '<li><span>' + esc(x.c.t) + '</span><span class="cbar" aria-hidden="true"><span style="width:' + (x.pct == null ? 0 : x.pct) + '%"></span></span><span class="num">' + (x.pct == null ? "N/A" : x.pct + "%") + "</span></li>";
      }).join("");
      var sections = CATS.map(function (c, ci) {
        var x = sc.cats[ci];
        var allNa = c.none && c.items.every(function (it) { return s.checklist[it.k] === "na"; });
        var items = c.items.map(function (it) {
          var v = itemVal(it, s), ctl;
          if (v.auto) ctl = '<span class="pill ' + (v.v >= 0.999 ? "good" : v.v >= 0.5 ? "warn" : "crit") + '">' + Math.round(v.v * 100) + '%</span><span class="small muted">Checked automatically: ' + esc(v.note) + "</span>";
          else ctl = '<div class="seg" role="group" aria-label="' + esc(it.t) + '">' + [["yes", "In"], ["no", "Missing"], ["na", "N/A"]].map(function (o) {
              var on = v.st === o[0] || (!v.st && o[0] === "no");
              return '<button type="button" class="seg-b' + (on ? " on" : "") + '" aria-pressed="' + on + '" data-c="item" data-k="' + it.k + '" data-v="' + o[0] + '"' + (wr ? "" : " disabled") + ' data-fk="c-' + it.k + "-" + o[0] + '">' + o[1] + "</button>"; }).join("") + "</div>";
          return '<li class="ck' + (v.na ? " na" : "") + '"><div class="ck-t"><b>' + esc(it.t) + '</b><span class="ck-w" title="Weight in the score">×' + it.w + '</span><p class="small muted">' + esc(it.h) + ' <a href="#' + it.go + '">Open</a></p></div><div class="ck-c">' + ctl + "</div></li>";
        }).join("");
        return '<details class="card proj ckcat"' + (ci < 2 || (x.pct != null && x.pct < 65) ? " open" : "") + '><summary><span class="sname">' + esc(c.t) + "</span>" +
          '<span class="pill ' + (x.pct == null ? "quiet" : rating(x.pct)[0]) + '">' + (x.pct == null ? "N/A" : x.pct + "%") + "</span>" + icon("arrow-right", "chev") + '</summary><div class="body">' +
          '<p class="small muted">' + esc(c.why) + "</p>" +
          (c.none && wr ? '<label class="check tight"><input type="checkbox" data-c="none" data-cat="' + c.id + '"' + (allNa ? " checked" : "") + ' data-fk="c-none-' + c.id + '"><span>We have none of these this year</span></label>' : "") +
          '<ul class="cks">' + items + "</ul></div></details>";
      }).join("");
      return '<section class="stack" aria-labelledby="h-main">' +
        '<div class="stack-sm"><p class="eyebrow">Claim strength</p><h1 id="h-main"><span class="soft">Claim strength ' + sc.pct + "%.</span> " + (r[1] === "Strong" ? "Ready for your advisor." : "Here is what to collect next.") + "</h1>" +
        '<p class="lead">For each cost you claim, CRA expects certain proof. This list asks for it, item by item, and scores how complete the claim is. Items marked automatic update from the rest of the portal.</p></div>' +
        '<div class="dash-row">' +
          '<div class="card ready"><div class="ring" role="img" aria-label="Claim strength ' + sc.pct + ' percent"><svg viewBox="0 0 120 120"><circle class="ring-bg" cx="60" cy="60" r="' + R + '"/><circle class="ring-fg" cx="60" cy="60" r="' + R + '" stroke-dasharray="' + C.toFixed(1) + '" stroke-dashoffset="' + off.toFixed(1) + '" style="--c:' + C.toFixed(1) + '"/></svg>' +
            '<span class="ring-num"><b>' + sc.pct + '%</b><small>' + r[1].toLowerCase() + "</small></span></div>" +
            '<div class="ready-body"><h2>' + r[1] + '</h2><p class="hint">85% and up is strong. 65 to 84% is fair. Below 65% the claim is at risk in a CRA review.</p></div></div>' +
          '<div class="card stack-sm"><h2>By category</h2><ul class="cbars">' + bars + "</ul></div>" +
        "</div>" +
        '<div class="stack-sm">' + sections + "</div>" +
        '<div class="card stack-sm"><div class="row between"><h2>Request list</h2><button class="btn alt small" type="button" data-c="copy" data-fk="c-copy">Copy the list</button></div>' +
          '<p class="hint">Everything still missing, ready to email to the company or your team. The due date is the records lock, 30 days after year end.</p>' +
          '<pre class="index" id="c-req">' + esc(requestText()) + "</pre></div>" +
        '<div class="card stack-sm"><h2>How the score works</h2><p>Each item has a weight from 1 to 3, by how much CRA relies on it. Score = the weights of items that are in, divided by the weights of all items that apply, times 100. Items marked N/A are left out. Automatic items count in part, for example 2 of 3 projects written up counts as two-thirds.</p>' +
          '<p class="hint">A high score means the paperwork is complete. It does not mean the work qualifies: that is the eligibility check, and your advisor’s call.</p></div>' +
        "</section>";
    }

    /* ---------- events ---------- */
    document.addEventListener("click", function (ev) {
      var b = ev.target.closest && ev.target.closest("[data-c]");
      if (!b || b.tagName === "INPUT") return;
      var c = b.getAttribute("data-c");
      if (c === "item" && h.canWrite) { h.setCheck(b.getAttribute("data-k"), b.getAttribute("data-v")); h.render(); return; }
      if (c === "sbd" && h.canManage) { h.setYearEnd(h.yearEnd(), b.getAttribute("data-v") === "1"); return; }
      if (c === "copy") {
        var t = requestText();
        try { navigator.clipboard.writeText(t).then(function () { h.toast("Request list copied."); }, function () { h.toast("Copy is not available here. Select the text instead.", true); }); }
        catch (e) { h.toast("Copy is not available here. Select the text instead.", true); }
      }
    });
    document.addEventListener("change", function (ev) {
      var t = ev.target, c = t.getAttribute && t.getAttribute("data-c");
      if (!c) return;
      if (c === "ye" && h.canManage) {
        if (/^\d{4}-\d{2}-\d{2}$/.test(t.value)) h.setYearEnd(t.value, S().sbd !== false);
        return;
      }
      if (c === "filed" && h.canWrite) { h.setCheck("filed", t.checked ? "yes" : "no", t.getAttribute("data-ye")); h.render(); return; }
      if (c === "none" && h.canWrite) {
        var cat = CATS.find(function (x) { return x.id === t.getAttribute("data-cat"); });
        if (cat) cat.items.forEach(function (it) { h.setCheck(it.k, t.checked ? "na" : "no"); });
        h.render();
      }
    });

    return {
      nav: [["deadlines", "14", "Deadlines"], ["strength", "15", "Claim strength"]],
      icons: {deadlines: "calendar-blank", strength: "gauge"},
      views: {deadlines: vDeadlines, strength: vStrength},
      score: score
    };
  };
})();
