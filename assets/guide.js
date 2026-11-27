/* Plan and learn sections: eligibility check, claimable costs with a credit
   estimator, other funding, the SR&ED guide and membership plans.
   Program facts come from the RRC Polytech / Deloitte "Funding Innovation &
   Understanding SR&ED" workshop deck, plus federal changes announced in the
   2024 Fall Economic Statement and Budget 2025. Nothing here decides a claim. */
(function () {
  "use strict";

  window.SRED_GUIDE = function (h) {
    var esc = h.esc, icon = h.icon, money = h.money;
    var KEY = "sred-guide";
    var gs = {elig: {flags: []}, est: null, bill: "year"};
    try { var saved = JSON.parse(localStorage.getItem(KEY) || "null"); if (saved) gs = Object.assign(gs, saved); } catch (e) {}
    function save() { try { localStorage.setItem(KEY, JSON.stringify(gs)); } catch (e) {} }
    function days(a, b) { return Math.round((Date.parse(b) - Date.parse(a)) / 86400000); }

    /* ---------- facts ---------- */
    var CLEAN_TECH_DUE = "2026-12-31";
    var PROVINCES = [
      ["MB", "Manitoba", 0.15, "15%: half refundable, half non-refundable"],
      ["BC", "British Columbia", 0.10, "10%, generally non-refundable"],
      ["AB", "Alberta", 0.08, "8% to 20% where it applies, paid as a refundable grant"],
      ["SK", "Saskatchewan", 0.10, "10%, refundable for eligible CCPCs"],
      ["ON", "Ontario", 0.035, "Up to 3.5% OITC plus other R&D credits, mixed refundability"],
      ["QC", "Quebec", 0, "Several refundable R&D credits; your advisor sets the rate"],
      ["AT", "Atlantic provinces", 0.15, "Mostly 15%, mostly refundable"],
      ["NA", "Territories or none", 0, "No provincial credit in this estimate"]
    ];
    var QUESTIONS = [
      {k: "q1", t: "Was there a scientific or technological uncertainty that standard practice could not remove?",
       d: "You did not know whether, or how, you could reach the goal using knowledge that was already available."},
      {k: "q2", t: "Did you form a hypothesis aimed at reducing or removing that uncertainty?",
       d: "A specific idea you set out to test, such as “a heated enclosure will keep the pack above 0°C at −40°C.”"},
      {k: "q3", t: "Did you follow a systematic approach, by experiment or analysis?",
       d: "Plan, build, test, analyse the results, then adjust and test again. Qualified people did the work."},
      {k: "q4", t: "Did the work aim for a scientific or technological advancement?",
       d: "New knowledge about the technology, even if the project failed. Learning what does not work counts."},
      {k: "q5", t: "Did you keep records of the steps, the tests and the results?",
       d: "Test plans, data, design revisions, code commits, photos, meeting notes, all dated when they happened."}
    ];
    var FLAGS = [
      ["routine", "Routine testing or quality control, or testing only to certify against an existing standard"],
      ["standard", "Using a supplier’s technology as intended, following their instructions"],
      ["debug", "Minor changes, troubleshooting or debugging with a predictable outcome"],
      ["public", "Copying a solution that is already public or openly available"],
      ["market", "Market research or sales promotion"],
      ["style", "Style or cosmetic changes"],
      ["production", "Commercial production, or using a finished process commercially"],
      ["data", "Routine data collection"],
      ["social", "Research in the social sciences or the humanities"],
      ["mining", "Prospecting, exploring or drilling for minerals, oil or gas"]
    ];
    var CATS = [
      {n: "01", t: "Labour", rule: "100% of the SR&ED share of wages",
       what: "Wages for employees directly engaged in SR&ED: the hands-on work plus direct support, such as a technician running tests.",
       ex: "A controls engineer spends 60% of her week on the cold-weather battery tests. 60% of her salary goes in.",
       go: "time", goT: "Weekly time keeps this exact"},
      {n: "02", t: "Materials", rule: "Consumed or transformed in the work",
       what: "Materials used up or destroyed in testing, or turned into a prototype that is no longer usable for anything else.",
       ex: "Battery cells destroyed in a −40°C chamber, sheet metal for a test enclosure.",
       go: "evidence", goT: "File receipts as evidence"},
      {n: "03", t: "Overhead", rule: "Proxy: 55% of labour, or actual costs",
       what: "Incremental costs directly attributable to the SR&ED work. Most small companies use the proxy: 55% of the SR&ED labour, with no receipts to track.",
       ex: "$200,000 of SR&ED wages adds $110,000 of proxy overhead.",
       go: "funding", goT: "Payroll lives in Finance"},
      {n: "04", t: "Contracts", rule: "80% of the contract amount",
       what: "SR&ED work done in Canada by a Canadian contractor on your behalf, at arm’s length. The contract should name the technical work.",
       ex: "A $50,000 contract to design and test a sensor housing adds $40,000.",
       go: "funding", goT: "Keep signed contracts on file"},
      {n: "05", t: "Third-party payments", rule: "80% of the payment",
       what: "Payments to colleges, universities and research institutes for SR&ED, such as an RRC Polytech research centre running your tests.",
       ex: "$25,000 paid to an RRC centre for climatic chamber testing adds $20,000.",
       go: "funding", goT: "Log it in Finance"},
      {n: "06", t: "Leases and capital equipment", rule: "Back in the claim", isNew: true,
       what: "Equipment you buy or lease for SR&ED. Capital property acquired on or after December 16, 2024 can be claimed again, after a decade out of the program.",
       ex: "A climatic test chamber bought in 2026 for the battery project.",
       go: "learn", goT: "Read what changed"}
    ];
    var PROGRAMS = [
      {t: "Clean Technology ITC", kind: "Tax credit", big: "Up to 30%", sub: "fully refundable",
       pts: ["Based mostly on new capital asset purchases, effective March 28, 2023. One of five clean economy ITCs now in law.",
             "Covers renewable energy projects (solar, wind) and Class 56 equipment: non-road, self-propelled electric or hydrogen vehicles.",
             "Class 56 examples: electric personnel carriers and side-by-sides, electric utility vehicles, electric forklifts, boom, scissor and mast lifts, drones and remotely operated vehicles, autonomous robots, autonomous underwater vehicles.",
             "File within 18 months of your year end."],
       due: CLEAN_TECH_DUE, dueT: "Key retroactive filing date"},
      {t: "RTRI: liquidity assistance", kind: "Grant, PrairiesCan", big: "Up to $2M", sub: "non-repayable, up to 50% of costs",
       pts: ["Short-term help for businesses under tariff-related financial pressure, to keep Canadian operations and jobs.",
             "Funding period of up to 12 months, ending no later than March 31, 2028."]},
      {t: "RTRI: pivot projects", kind: "Grant, PrairiesCan", big: "Up to $1M", sub: "non-repayable, up to 75% of costs",
       pts: ["For projects that raise productivity, improve competitiveness and reduce exposure to future trade disruptions.",
             "Larger transformative projects can get interest-free repayable funding.",
             "Every project must be finished by March 31, 2029."]},
      {t: "NRC IRAP", kind: "Grant, National Research Council", big: "Up to $10M", sub: "80% of salaries, 50% of contractors",
       pts: ["R&D, plus work that develops, commercializes and scales technology-driven innovations.",
             "For companies with 500 or fewer full-time employees.",
             "IRAP Youth Employment Program: funding to hire young graduates aged 15 to 30 for R&D, engineering, multimedia analysis and business development."]},
      {t: "Mitacs Accelerate", kind: "Grant, internships", big: "$15K", sub: "per 4 to 6 month internship, 50% match",
       pts: ["Funds students, postdoctoral entrepreneurs and the organizations that hire them. Projects start at 4 months and can scale.",
             "Accelerate Entrepreneur: at least a $10,000 stipend per internship, plus up to $5,000 of flexible funding for research costs.",
             "Eligible work: applied research, new markets, commercializing research, piloting and testing, and improving existing products, services or technologies."]}
    ];
    var EXAMPLES = [
      {t: "Advanced manufacturing and AI inspection", who: "A manufacturer with CAMTT builds a vision system that spots defects on reflective or oddly shaped parts.",
       u: "Off-the-shelf cameras and machine-learning models cannot tell real defects from reflections, surface variation and production vibration.",
       w: "Testing lighting set-ups, sensors, training datasets, image-processing methods and model designs.",
       a: "New knowledge about reliable, real-time defect detection under production conditions.",
       n: "Buying and configuring an established inspection system with known settings."},
      {t: "Electric vehicles in extreme cold", who: "A vehicle maker with VTEC and MotiveLab improves battery and thermal performance near −40°C.",
       u: "Existing control strategies cannot hold the range, charging performance and reliability needed in extreme cold.",
       w: "Testing battery preconditioning, cabin heating, charging logic and thermal controls in a climatic chamber.",
       a: "New operating and control strategies for cold-weather performance.",
       n: "Standard performance tests run only to confirm specifications or meet regulations."},
      {t: "High-performance building envelope", who: "A building-products company with BETAC develops a wall or window assembly for severe Canadian weather.",
       u: "Existing designs cannot meet the air, water, thermal and structural targets at the same time.",
       w: "Building full-scale mock-ups and testing them while varying materials, joints, barriers and installation methods.",
       a: "New knowledge about moisture movement, thermal bridging, air leakage and durability.",
       n: "Testing a conventional assembly only to certify it meets an existing standard."},
      {t: "Agricultural equipment and automation", who: "An equipment maker with CAMTT or TACAM builds a system that reacts to changing crop, soil or operating conditions.",
       u: "Dust, vibration, lighting and field variability stop existing sensors and controls from making reliable decisions.",
       w: "Testing sensor combinations, filtering, control algorithms and equipment responses in simulated and real fields.",
       a: "Better sensing and automated control in variable farm conditions.",
       n: "Fitting commercially available sensors by following the supplier’s instructions."}
    ];
    var MYTHS = [
      ["It’s innovative, so it must be SR&ED.", "Innovation is not the test. You need a technological uncertainty you worked through by experiment or analysis."],
      ["We had technical challenges, so it qualifies.", "Problems a competent professional could solve with standard practice, debugging or troubleshooting do not count."],
      ["We used AI, robotics or advanced technology, so it qualifies.", "Using advanced technology as intended is not SR&ED. Advancing the technology is."],
      ["Testing and prototyping are automatically SR&ED.", "Only testing that helps resolve a technological uncertainty counts. Routine validation, certification and performance testing usually do not."],
      ["The project failed, so we can’t claim it.", "Failed projects often qualify. Finding out what does not work is new knowledge, if you recorded how you found out."],
      ["The whole development project qualifies.", "Only the SR&ED portion does. Commercial production, routine work and standard practice come out."],
      ["We’ll rebuild the documentation at year end.", "Records written at the time are far stronger. A claim pieced together later is easier for CRA to challenge."],
      ["We received a grant, so we can’t claim SR&ED.", "You can do both. The grant reduces the costs you claim, so log it in Finance and funding."],
      ["If RRC is involved, the project automatically qualifies.", "RRC can strengthen the technical work and the paperwork, but it does not decide eligibility."],
      ["All testing at an RRC facility is SR&ED.", "Routine validation, certification and performance testing may not qualify. Testing has to connect to resolving an uncertainty."],
      ["Only work done by our own staff can qualify.", "Some payments for SR&ED done on your behalf can count, depending on the contract and the expenditure rules."],
      ["A grant-funded RRC project can’t also involve SR&ED.", "The same project can have grant support and SR&ED work. The grant may reduce the SR&ED pool."],
      ["The RRC report is enough documentation.", "Also keep contracts, project plans, technical emails, test records, design iterations and evidence tying your people and costs to the experiments."]
    ];
    var NEWS = [
      {d: "Dec 2024", t: "Leases and capital equipment are back.", b: "Capital property acquired on or after December 16, 2024 is eligible again, and the workshop now lists leases and capital equipment as a sixth cost category."},
      {d: "Budget 2025", t: "The 35% limit rose to $6 million.", b: "Canadian-controlled private corporations get the enhanced 35% refundable credit on up to $6 million of spending a year, up from $3 million, for tax years starting on or after December 16, 2024."},
      {d: "Dec 2024", t: "More growing companies keep the 35% rate.", b: "The limit now phases out between $15 million and $75 million of taxable capital, up from $10 to $50 million. Eligible Canadian public corporations can also get the enhanced rate."},
      {d: "In law now", t: "Clean Technology ITC, up to 30%.", b: "A fully refundable credit for clean tech capital, including Class 56 electric and hydrogen equipment. The key retroactive filing date is December 31, 2026."},
      {d: "Workshop", t: "Grants and SR&ED can stack.", b: "One project can have grant funding and an SR&ED claim. The grant comes off the costs you claim, so record every dollar."}
    ];

    /* ---------- shared bits ---------- */
    function head(eyebrow, h1, lead) {
      return '<div class="stack-sm"><p class="eyebrow">' + eyebrow + '</p><h1 id="h-main">' + h1 + "</h1>" + (lead ? '<p class="lead">' + lead + "</p>" : "") + "</div>";
    }
    var NOTE = '<p class="hint">General information from the RRC Polytech SR&amp;ED workshop (Deloitte) and federal announcements to Budget 2025. Rates and rules change, and proposals may not be law for your tax year. Your accountant or SR&amp;ED advisor decides what you claim.</p>';

    /* ---------- eligibility ---------- */
    function eligResult() {
      var e = gs.elig, ans = QUESTIONS.map(function (q) { return e[q.k] || ""; });
      var answered = ans.filter(Boolean).length;
      var flags = (e.flags || []).length;
      var level, title, body;
      if (e.q1 === "no" || e.q3 === "no" || e.canada === "no") {
        level = "crit"; title = "Unlikely to qualify as described.";
        body = e.canada === "no" ? "SR&ED covers work done in Canada. Work done outside Canada generally does not count." :
               e.q1 === "no" ? "Without a technological uncertainty, the work is standard practice. That is the first test, and the one most claims fail." :
               "SR&ED needs a systematic investigation: a hypothesis, tests and analysis. Trial and error without a plan is hard to support.";
      } else if (answered === 5 && ans.every(function (a) { return a === "yes"; }) && e.canada === "yes") {
        level = "good"; title = flags ? "A strong candidate, with parts to leave out." : "A strong candidate.";
        body = flags ? "The core work fits all five tests. Keep the excluded work below out of the claim and log its hours as non-R&D." :
               "The work fits all five tests. Write the T661 lines on the project sheet while the details are fresh, then show this to your advisor.";
      } else {
        level = "warn"; title = answered < 5 ? "Keep going: " + (5 - answered) + " to answer." : "Possible, with work.";
        body = "Each “not sure” is something to settle with your advisor. Most of them are fixed with better records.";
      }
      var steps = [];
      if (e.q1 && e.q1 !== "yes") steps.push(["Write down what you could not do with known methods. Search what is already public first.", "learn", "Standard practice"]);
      if (e.q2 && e.q2 !== "yes") steps.push(["Write the hypothesis as one sentence you can test, before the next experiment.", "projects", "Open the project sheet"]);
      if (e.q3 && e.q3 !== "yes") steps.push(["Plan each test: what you change, what you measure, what result proves the idea wrong.", "learn", "The method"]);
      if (e.q4 && e.q4 !== "yes") steps.push(["Describe what you learned about the technology, including what failed.", "projects", "T661 line 246"]);
      if (e.q5 && e.q5 !== "yes") steps.push(["File records as the work happens. Dated evidence is what makes a claim stand up.", "evidence", "File a record"]);
      var flagList = FLAGS.filter(function (f) { return (e.flags || []).indexOf(f[0]) >= 0; });
      var pct = Math.round(answered / 5 * 100);
      return '<div class="card verdict v-' + level + '" aria-live="polite"><div class="row between"><span class="pill ' + level + '">' +
        (level === "good" ? "Strong fit" : level === "crit" ? "Unlikely" : "Needs work") + '</span><span class="stamp">' + answered + " of 5 answered</span></div>" +
        '<div class="meter" aria-hidden="true"><span style="width:' + pct + '%"></span></div>' +
        "<h2>" + title + "</h2><p>" + esc(body) + "</p>" +
        (steps.length ? '<h3>What to do next</h3><ol class="steps">' + steps.map(function (s) {
          return "<li>" + esc(s[0]) + ' <a href="#' + s[1] + '">' + esc(s[2]) + "</a></li>"; }).join("") + "</ol>" : "") +
        (flagList.length ? '<h3>Leave this work out</h3><ul class="plain">' + flagList.map(function (f) { return "<li>" + esc(f[1]) + "</li>"; }).join("") + "</ul>" : "") +
        '<p class="hint">This is a self-check, not a ruling. CRA and your advisor make the call.</p></div>';
    }
    function seg(key, val, labels) {
      return '<div class="seg" role="group" aria-label="Answer">' + labels.map(function (l) {
        var on = val === l[0];
        return '<button type="button" class="seg-b' + (on ? " on" : "") + '" aria-pressed="' + on + '" data-g="ans" data-k="' + key + '" data-v="' + l[0] + '" data-fk="g-' + key + "-" + l[0] + '">' + l[1] + "</button>";
      }).join("") + "</div>";
    }
    var YN = [["yes", "Yes"], ["unsure", "Not sure"], ["no", "No"]];
    function vEligibility() {
      var e = gs.elig;
      var qs = QUESTIONS.map(function (q, i) {
        return '<li class="q"><span class="q-n">' + (i + 1) + '</span><div class="q-b"><p class="q-t">' + esc(q.t) + '</p><p class="hint">' + esc(q.d) + "</p>" + seg(q.k, e[q.k], YN) + "</div></li>";
      }).join("");
      var flags = FLAGS.map(function (f) {
        var on = (e.flags || []).indexOf(f[0]) >= 0;
        return '<li><label class="check"><input type="checkbox" data-g="flag" value="' + f[0] + '"' + (on ? " checked" : "") + ' data-fk="g-flag-' + f[0] + '"><span>' + esc(f[1]) + "</span></label></li>";
      }).join("");
      return '<section class="stack" aria-labelledby="h-main">' +
        head("Eligibility check", '<span class="soft">Five questions.</span> Does your project fit SR&amp;ED?',
          "CRA asks the same five questions about every project. Answer them for one project at a time. It takes about three minutes, and nothing is sent anywhere.") +
        '<div class="elig">' +
          '<div class="stack">' +
            '<div class="card stack-sm"><h2>First, the basics</h2><p class="q-t">Was the work done in Canada?</p>' + seg("canada", e.canada, YN) +
            '<p class="q-t" style="margin-top:12px">Is the company a Canadian-controlled private corporation (CCPC)?</p>' + seg("ccpc", e.ccpc, [["yes", "Yes"], ["unsure", "Not sure"], ["no", "No"]]) +
            '<p class="hint">' + (e.ccpc === "no" ? "Other corporations get a 15% federal credit, usually not refundable." : "CCPCs can get a 35% refundable federal credit on up to $6 million a year.") + "</p></div>" +
            '<ol class="qs">' + qs + "</ol>" +
            '<div class="card stack-sm"><h2>Does any of this describe part of the work?</h2><p class="hint">These are never SR&amp;ED. Tick any that apply, so you know what to leave out.</p><ul class="checks">' + flags + "</ul></div>" +
            '<div class="row"><button class="btn alt" type="button" data-g="elig-reset" data-fk="g-reset">Start again</button></div>' +
          "</div>" +
          '<div class="elig-side">' + eligResult() + "</div>" +
        "</div>" + NOTE + "</section>";
    }

    /* ---------- claimable costs and estimator ---------- */
    function estDefaults() {
      return {labour: 420000, materials: 38000, overheadMode: "proxy", overhead: 0, contracts: 60000, third: 25000, capital: 0,
              grants: h.fundingTotal(), prov: "MB", ccpc: gs.elig.ccpc === "no" ? "no" : "yes"};
    }
    function calc(s) {
      var n = function (k) { var v = Number(s[k]); return isFinite(v) && v > 0 ? v : 0; };
      var parts = [
        ["Labour", n("labour")],
        ["Materials", n("materials")],
        ["Overhead", s.overheadMode === "proxy" ? n("labour") * 0.55 : n("overhead")],
        ["Contracts (80%)", n("contracts") * 0.8],
        ["Third-party (80%)", n("third") * 0.8],
        ["Capital and leases", n("capital")]
      ];
      var pool = parts.reduce(function (a, p) { return a + p[1]; }, 0);
      var net = Math.max(0, pool - n("grants"));
      var pv = PROVINCES.find(function (p) { return p[0] === s.prov; }) || PROVINCES[0];
      var prov = net * pv[2];
      var fedBase = Math.max(0, net - prov);
      var LIMIT = 6000000, fed, refund;
      if (s.ccpc === "yes") {
        var hi = Math.min(fedBase, LIMIT), lo = Math.max(0, fedBase - LIMIT);
        fed = hi * 0.35 + lo * 0.15; refund = hi * 0.35 + lo * 0.15 * 0.4;
      } else { fed = fedBase * 0.15; refund = 0; }
      return {parts: parts, pool: pool, net: net, prov: prov, pv: pv, fed: fed, refund: refund, total: fed + prov, grants: n("grants")};
    }
    function estOut(s) {
      var r = calc(s);
      var bars = r.parts.filter(function (p) { return p[1] > 0; }).map(function (p, i) {
        return '<span class="seg-' + i + '" style="flex:' + p[1].toFixed(0) + '" title="' + esc(p[0]) + ": " + money.format(p[1]) + '"></span>';
      }).join("");
      var legend = r.parts.map(function (p, i) {
        return '<li><span class="key seg-' + i + '" aria-hidden="true"></span><span>' + esc(p[0]) + '</span><span class="num">' + money.format(p[1]) + "</span></li>";
      }).join("");
      return '<div class="card ink est-out" aria-live="polite"><p class="eyebrow on-ink">Estimated credits</p>' +
        '<p class="est-big num">' + money.format(r.total) + "</p>" +
        '<p class="est-sub">' + money.format(r.fed) + " federal + " + money.format(r.prov) + " " + esc(r.pv[1]) + "</p>" +
        '<div class="stackbar" aria-hidden="true">' + (bars || '<span style="flex:1;opacity:.2"></span>') + "</div>" +
        '<ul class="legend-list">' + legend +
        '<li class="sum"><span></span><span>Eligible pool</span><span class="num">' + money.format(r.pool) + "</span></li>" +
        (r.grants ? '<li><span></span><span>Less grants and subsidies</span><span class="num">−' + money.format(r.grants) + "</span></li>" : "") +
        "</ul>" +
        '<p class="est-note">' + (s.ccpc === "yes" ? "About " + money.format(r.refund) + " of the federal credit could come back as cash, even with no tax owing." : "Non-CCPC federal credits are usually used against tax owing, not refunded.") +
        " Provincial: " + esc(r.pv[3]) + ".</p></div>";
    }
    function num(id, label, val, hint) {
      return '<div class="field"><label for="' + id + '">' + label + '</label><div class="money-in"><span aria-hidden="true">$</span><input id="' + id + '" type="number" min="0" step="1000" inputmode="numeric" value="' + (Number(val) || 0) + '" data-g="est" data-k="' + id.slice(4) + '" data-fk="' + id + '"></div>' + (hint ? '<p class="hint">' + hint + "</p>" : "") + "</div>";
    }
    function vClaimable() {
      var s = gs.est || estDefaults();
      var cats = CATS.map(function (c) {
        return '<article class="cat card' + (c.isNew ? " is-new" : "") + '"><div class="row between"><span class="cat-n">' + c.n + "</span>" +
          (c.isNew ? '<span class="pill crit">New</span>' : "") + "</div><h2>" + esc(c.t) + '</h2><p class="cat-rule">' + esc(c.rule) + "</p>" +
          "<p>" + esc(c.what) + '</p><p class="cat-ex"><b>Example.</b> ' + esc(c.ex) + '</p><a class="row-link" href="#' + c.go + '">' + icon("arrow-right") + esc(c.goT) + "</a></article>";
      }).join("");
      var provOpts = PROVINCES.map(function (p) { return '<option value="' + p[0] + '"' + (s.prov === p[0] ? " selected" : "") + ">" + esc(p[1]) + (p[2] ? " (" + Math.round(p[2] * 1000) / 10 + "%)" : "") + "</option>"; }).join("");
      return '<section class="stack" aria-labelledby="h-main">' +
        head("What you can claim", '<span class="soft">Six kinds of cost.</span> Here is what each one is worth.',
          "SR&amp;ED pays back part of what you spend on eligible work: wages, materials, overhead, contracts, research payments and, again, equipment. Each has its own rule.") +
        '<div class="cats">' + cats + "</div>" +
        '<div class="stack-sm"><h2>Estimate your credit.</h2><p class="lead">Put in this tax year’s SR&amp;ED spending. The numbers update as you type and stay on this device only.</p></div>' +
        '<div class="est">' +
          '<div class="card stack-sm est-in"><div class="fields">' +
            num("est-labour", "SR&amp;ED wages", s.labour, "Only the share of time spent on SR&amp;ED.") +
            num("est-materials", "Materials consumed or transformed", s.materials) +
            '<div class="field wide"><span class="lbl">Overhead</span>' +
              '<div class="seg" role="group" aria-label="Overhead method">' +
                '<button type="button" class="seg-b' + (s.overheadMode === "proxy" ? " on" : "") + '" aria-pressed="' + (s.overheadMode === "proxy") + '" data-g="ohm" data-v="proxy" data-fk="g-ohm-proxy">Proxy, 55% of wages</button>' +
                '<button type="button" class="seg-b' + (s.overheadMode === "actual" ? " on" : "") + '" aria-pressed="' + (s.overheadMode === "actual") + '" data-g="ohm" data-v="actual" data-fk="g-ohm-actual">Actual costs</button></div></div>' +
            (s.overheadMode === "actual" ? num("est-overhead", "Actual SR&amp;ED overhead", s.overhead) : "") +
            num("est-contracts", "Canadian contracts", s.contracts, "We count 80%.") +
            num("est-third", "Payments to colleges or institutes", s.third, "We count 80%.") +
            num("est-capital", "Capital equipment and leases", s.capital, "Property acquired on or after Dec 16, 2024.") +
            num("est-grants", "Grants and subsidies for this work", s.grants, "Pre-filled from Finance and funding.") +
            '<div class="field"><label for="est-prov">Province</label><select id="est-prov" data-g="est" data-k="prov" data-fk="est-prov">' + provOpts + "</select></div>" +
            '<div class="field"><label for="est-ccpc">Company type</label><select id="est-ccpc" data-g="est" data-k="ccpc" data-fk="est-ccpc"><option value="yes"' + (s.ccpc === "yes" ? " selected" : "") + '>CCPC (35% on first $6M)</option><option value="no"' + (s.ccpc === "no" ? " selected" : "") + ">Other corporation (15%)</option></select></div>" +
          '</div><div class="row"><button class="btn alt small" type="button" data-g="est-reset" data-fk="g-est-reset">Reset to sample numbers</button></div></div>' +
          '<div id="est-out">' + estOut(s) + "</div>" +
        "</div>" +
        '<div class="card stack-sm"><h2>Rates across Canada</h2><div class="table-wrap"><table style="min-width:520px"><thead><tr><th>Where</th><th>Credit rate</th><th>Refundable?</th></tr></thead><tbody>' +
          "<tr><td>Federal</td><td>Up to 35% (CCPC) / 15% (other corporations)</td><td>Refundable for eligible CCPCs</td></tr>" +
          "<tr><td>British Columbia</td><td>10%</td><td>Generally non-refundable</td></tr>" +
          "<tr><td>Alberta</td><td>8% to 20% where it applies</td><td>Refundable grant</td></tr>" +
          "<tr><td>Saskatchewan</td><td>10%</td><td>Refundable for eligible CCPCs</td></tr>" +
          "<tr><td>Manitoba</td><td>15%</td><td>7.5% refundable / 7.5% non-refundable</td></tr>" +
          "<tr><td>Ontario</td><td>Up to 3.5% OITC plus other R&amp;D credits</td><td>Mixed</td></tr>" +
          "<tr><td>Quebec</td><td>Several refundable R&amp;D credits</td><td>Often highly refundable</td></tr>" +
          "<tr><td>Atlantic provinces</td><td>Mostly 15%</td><td>Mostly refundable</td></tr>" +
        '</tbody></table></div><p class="hint">Provincial rates depend on company status and size, the type of spending and each province’s rules. The estimate takes the provincial credit off the federal base, the way CRA treats it as government assistance.</p></div>' +
        NOTE + "</section>";
    }

    /* ---------- plan access: funding guides are for Growth and Scale ---------- */
    var SAMPLE_GUIDE = {"slug": "clean_tech", "title": "Clean Technology ITC", "kind": "Refundable federal tax credit", "body": {"summary": "Up to 30% back on new clean technology equipment, claimed on your T2 return. No application to a program officer: your accountant claims it.", "eligibility": ["The company is a taxable Canadian corporation.", "The equipment is new: not used, or acquired for use, by anyone before you.", "It was acquired and became available for use between March 28, 2023 and December 31, 2034.", "It is used in Canada.", "It is a listed clean technology, such as Class 56 off-road electric or hydrogen vehicles (forklifts, lifts, utility vehicles, drones, autonomous robots), solar or wind generation, energy storage or low-carbon heat equipment.", "If the equipment is installed on a work site after November 28, 2023, you can meet the labour requirements (prevailing wages and 10% apprentice hours). If not, the rate drops by 10 points. Off-road zero-emission vehicles and low-carbon heat equipment are exempt."], "documents": ["Invoices and proof of payment for each item", "Delivery, commissioning or in-service records showing the date it became available for use", "Spec sheets showing what the equipment is, so your accountant can confirm its class", "A dealer or supplier statement that it was new", "Where it is used in Canada", "For installed projects: payroll records for covered workers and apprentice hours", "Any grant or other assistance received for the same equipment"], "steps": ["List every qualifying purchase since March 28, 2023, with the date it went into use and its cost. Upload the invoices to Evidence.", "Ask your accountant to confirm each item's capital cost allowance class (for example Class 56, 43.1 or 43.2).", "Subtract any grants or assistance for the same equipment. Log them in Finance and funding.", "If the labour requirements apply, collect wage and apprentice records and decide whether to attest to them. The attestation is made every year.", "Your accountant files Schedule 75 (T2SCH75) with the T2 return and carries the credit to line 155 of Schedule 31.", "For earlier years, CRA accepts late claims until the later of December 31, 2026 or one year after the return's due date. After that, the credit for those years is gone.", "Keep every record for at least six years. CRA may audit and ask for invoices and labour records."], "timing": "The credit is refunded when CRA assesses the T2. The rate is 30% to the end of 2033 and 15% in 2034.", "sred": "Equipment used for SR&ED may also qualify for SR&ED as capital. Your accountant decides which credit gives more; the same cost cannot be counted twice.", "contact": "CRA Clean Economy ITC pages and specialist line", "link": "https://www.canada.ca/en/revenue-agency/services/tax/businesses/topics/corporations/business-tax-credits/clean-economy-itc/clean-technology-itc.html"}};
    var GUIDE_TITLES = ["Clean Technology ITC", "Regional Tariff Response Initiative (RTRI)", "NRC IRAP", "Mitacs Accelerate"];
    var guides = null, guidesLoading = false;
    function fundingAccess() {
      if (h.mode === "live" && h.role === "kv") return true;
      var st = planState();
      if (h.mode === "live" && !h.billing) return false;
      return ["growth", "scale", "partner"].indexOf(st.plan) >= 0 && ["trialing", "active", "past_due"].indexOf(st.status) >= 0 &&
        !(st.status === "trialing" && st.trialLeft === 0);
    }
    function loadGuides() {
      if (guides || guidesLoading || h.mode !== "live") return;
      guidesLoading = true;
      h.fetchGuides().then(function (r) { guides = (r && r.data) || []; guidesLoading = false; if (location.hash === "#programs") h.render(); },
                           function () { guides = []; guidesLoading = false; });
    }
    function guideHtml(g, open) {
      var b = g.body || {}, met = (gs.fq || {})[g.slug] || [];
      var elig = (b.eligibility || []).map(function (x, i) {
        var on = met.indexOf(i) >= 0;
        return '<li><label class="check"><input type="checkbox" data-g="fq" data-s="' + esc(g.slug) + '" value="' + i + '"' + (on ? " checked" : "") + ' data-fk="g-fq-' + esc(g.slug) + "-" + i + '"><span>' + esc(x) + "</span></label></li>";
      }).join("");
      var n = (b.eligibility || []).length, m = met.length;
      return '<details class="card proj fguide"' + (open ? " open" : "") + '><summary><span class="sname">' + esc(g.title) + '</span><span class="pill quiet">' + esc(g.kind) + "</span>" + icon("arrow-right", "chev") + "</summary>" +
        '<div class="body"><p class="lead" style="font-size:17px">' + esc(b.summary || "") + "</p>" +
        '<div class="fg-grid"><div class="stack-sm"><div class="row between"><h3>Do you qualify?</h3><span class="stamp" id="fq-' + esc(g.slug) + '">' + m + " of " + n + " met</span></div>" +
          '<p class="hint">Tick each statement that is true for your company.</p><ul class="checks">' + elig + "</ul></div>" +
          '<div class="stack-sm"><h3>What to prepare</h3><ul class="plain">' + (b.documents || []).map(function (x) { return "<li>" + esc(x) + "</li>"; }).join("") + "</ul></div></div>" +
        '<h3>How to apply, step by step</h3><ol class="steps fg-steps">' + (b.steps || []).map(function (x) { return "<li>" + esc(x) + "</li>"; }).join("") + "</ol>" +
        '<div class="trio"><div><b>Timing</b><p class="small muted">' + esc(b.timing || "") + "</p></div><div><b>With SR&amp;ED</b><p class=\"small muted\">" + esc(b.sred || "") + '</p></div><div><b>Who to contact</b><p class="small muted">' + esc(b.contact || "") + "</p></div></div>" +
        '<div class="row">' + (b.link ? '<a class="btn alt small" href="' + esc(b.link) + '" target="_blank" rel="noopener">Official program page</a>' : "") + '<a class="btn alt small" href="#funding">Log funding received</a></div>' +
        (g.checked_on ? '<p class="hint">Checked against the official page on ' + h.longDate(String(g.checked_on).slice(0, 10)) + ". Programs change: confirm before you apply.</p>" : "") +
        "</div></details>";
    }
    function lockedCard(t) {
      return '<li class="lock-i">' + icon("lock-simple") + "<div><b>" + esc(t) + '</b><span class="small muted">Eligibility checklist, documents to prepare, and how to apply</span></div></li>';
    }
    function guidesSection() {
      var list;
      if (h.mode !== "live") {
        list = guideHtml(SAMPLE_GUIDE, true) + '<ul class="locks">' + GUIDE_TITLES.slice(1).map(lockedCard).join("") + "</ul>" +
          '<p class="hint">This demo opens one guide as a sample. Members on Growth and Scale get every guide.</p>';
      } else if (!guides) { loadGuides(); list = '<p class="hint" role="status">Loading your funding guides…</p>'; }
      else if (!guides.length) list = '<p class="hint">The funding guides are being set up. Check back soon.</p>';
      else list = guides.map(function (g, i) { return guideHtml(g, i === 0); }).join("");
      return '<div class="stack-sm"><div class="row between"><h2>Eligibility and how to apply.</h2><span class="pill good">Included in your plan</span></div>' +
        '<p class="lead">For each program: a checklist to see if you qualify, the documents to gather, and every step to apply.</p></div>' + list;
    }
    function lockedPrograms() {
      return '<section class="stack" aria-labelledby="h-main">' +
        head("Other funding", '<span class="soft">Grants and credits beyond SR&amp;ED.</span> On Growth and Scale.',
          "Find out which programs your company qualifies for, what to prepare, and how to apply, step by step. This is part of the Growth and Scale plans.") +
        '<div class="card lock-card stack-sm"><div class="row between"><h2>What you get</h2>' + icon("lock-simple", "lock-big") + "</div>" +
          '<ul class="ticks">' + ["Eligibility checklists for each program", "Documents to prepare, program by program", "Step-by-step application guides with contacts", "Deadline alerts, such as the Clean Technology ITC retroactive date", "How each grant affects your SR&ED claim"].map(function (x) { return "<li>" + icon("check-circle") + "<span>" + x + "</span></li>"; }).join("") + "</ul>" +
          '<ul class="locks">' + GUIDE_TITLES.map(lockedCard).join("") + "</ul>" +
          '<div class="row"><a class="btn" href="#plans">See Growth and Scale</a></div></div>' +
        "</section>";
    }

    /* ---------- other funding ---------- */
    function vPrograms() {
      if (!fundingAccess()) return lockedPrograms();
      var left = days(h.today, CLEAN_TECH_DUE);
      var types = [
        ["Tax credits or rebates", "Lower corporate or employer taxes, or come back as a refund. SR&ED is one."],
        ["Defined grants and faster write-offs", "Set amounts or accelerated tax deductions for prescribed investments."],
        ["Negotiated grants or incentives", "Agreed case by case, based on jobs created or capital invested."],
        ["Accessible loans", "Low-interest loans with deferred repayment plans."]
      ].map(function (t, i) { return '<li><span class="cat-n">0' + (i + 1) + "</span><b>" + t[0] + '</b><span class="small muted">' + t[1] + "</span></li>"; }).join("");
      var cards = PROGRAMS.map(function (p) {
        var due = p.due ? '<p class="due"><span class="chip strong">' + icon("clock") + (left >= 0 ? left + " days left" : "Date passed") + "</span> " + esc(p.dueT) + ": " + h.longDate(p.due) + "</p>" : "";
        return '<article class="card prog stack-sm"><p class="eyebrow">' + esc(p.kind) + "</p><h2>" + esc(p.t) + '</h2><p class="prog-big"><b class="num">' + esc(p.big) + "</b> " + esc(p.sub) + "</p>" + due +
          '<ul class="plain">' + p.pts.map(function (x) { return "<li>" + esc(x) + "</li>"; }).join("") + "</ul></article>";
      }).join("");
      return '<section class="stack" aria-labelledby="h-main">' +
        head("Other funding", '<span class="soft">SR&amp;ED is one source.</span> These can sit beside it.',
          "Grants, other tax credits and loans can fund the same growth. Most reduce what you claim under SR&amp;ED, so every dollar you get goes in Finance and funding.") +
        '<ul class="types">' + types + "</ul>" +
        (left >= 0 && left <= 120 ? '<div class="flash">Clean Technology ITC: the key retroactive filing date is ' + h.longDate(CLEAN_TECH_DUE) + ", " + left + " days from today. If you bought electric or hydrogen equipment since March 28, 2023, ask your advisor this week.</div>" : "") +
        '<div class="progs">' + cards + "</div>" +
        guidesSection() +
        '<div class="card stack-sm"><h2>Stacking, in plain words.</h2><ul class="plain">' +
          "<li>One project can get grant support and include SR&amp;ED work.</li>" +
          "<li>Government assistance, such as an IRAP or Mitacs contribution, comes off the costs you claim for SR&amp;ED.</li>" +
          "<li>Provincial R&amp;D credits also count as assistance against the federal claim.</li>" +
          '<li>Log every grant, subsidy and contribution in <a href="#funding">Finance and funding</a>. The estimator picks it up.</li></ul></div>' +
        NOTE + "</section>";
    }

    /* ---------- the guide ---------- */
    var TOC = [["g-new", "What’s new"], ["g-what", "What SR&ED is"], ["g-tests", "The five tests"], ["g-method", "The method"], ["g-std", "Standard practice"],
               ["g-not", "What’s excluded"], ["g-ex", "Examples"], ["g-myths", "Myths"], ["g-docs", "Records"], ["g-dates", "Deadlines"]];
    function vLearn() {
      var toc = TOC.map(function (t) { return '<button type="button" class="chip" data-g="jump" data-to="' + t[0] + '">' + t[1] + "</button>"; }).join("");
      var news = NEWS.map(function (n) { return '<li class="news-i"><span class="stamp">' + n.d + "</span><div><b>" + esc(n.t) + "</b><p>" + esc(n.b) + "</p></div></li>"; }).join("");
      var tests = QUESTIONS.map(function (q, i) { return '<li class="q"><span class="q-n">' + (i + 1) + '</span><div class="q-b"><p class="q-t">' + esc(q.t) + '</p><p class="hint">' + esc(q.d) + "</p></div></li>"; }).join("");
      var ex = EXAMPLES.map(function (x, i) {
        return '<details class="card proj"' + (i === 0 ? " open" : "") + '><summary><span class="sname">' + esc(x.t) + "</span>" + icon("arrow-right", "chev") + '</summary><div class="body">' +
          "<p>" + esc(x.who) + '</p><dl class="exdl"><dt>Uncertainty</dt><dd>' + esc(x.u) + "</dd><dt>Experiments</dt><dd>" + esc(x.w) + "</dd><dt>Advancement</dt><dd>" + esc(x.a) + '</dd><dt class="not">Not SR&amp;ED</dt><dd>' + esc(x.n) + "</dd></dl></div></details>";
      }).join("");
      var myths = MYTHS.map(function (m) {
        return '<li class="myth"><p class="myth-q">' + icon("x-circle") + "<span>“" + esc(m[0]) + '”</span></p><p class="myth-a">' + icon("check-circle") + "<span>" + esc(m[1]) + "</span></p></li>";
      }).join("");
      var docs = [
        ["Define the uncertainty", "What could not be done with existing knowledge or standard practice?", "projects", "T661 line 242"],
        ["Capture the approach", "What alternatives, hypotheses or possible solutions did you consider?", "projects", "Project sheet"],
        ["Record the experiments", "Tests, parameters changed, results, failures and surprises.", "evidence", "Evidence"],
        ["Write what you learned", "What did each result tell you? What changed next? What did you learn about the technology?", "projects", "T661 line 246"],
        ["Connect people and costs", "Who did the work, when, and the time, materials and contractor costs.", "time", "Weekly time"]
      ].map(function (d, i) { return '<li><span class="cat-n">0' + (i + 1) + "</span><div><b>" + d[0] + '</b><p class="small muted">' + d[1] + '</p><a class="row-link" href="#' + d[2] + '">' + icon("arrow-right") + d[3] + "</a></div></li>"; }).join("");
      var sec = function (id, title, inner) { return '<section class="card stack-sm g-sec" id="' + id + '" tabindex="-1"><h2>' + title + "</h2>" + inner + "</section>"; };
      return '<section class="stack" aria-labelledby="h-main">' +
        head("SR&amp;ED guide", '<span class="soft">Everything about SR&amp;ED,</span> in plain words.',
          "The rules, the tests, real examples from Manitoba industry and the changes since 2024. Written for owners and engineers, not tax specialists.") +
        '<nav class="toc" aria-label="On this page">' + toc + "</nav>" +
        sec("g-new", "What’s new in SR&amp;ED", '<ul class="news">' + news + "</ul>") +
        sec("g-what", "What SR&amp;ED is",
          "<p>Scientific Research and Experimental Development is the Government of Canada’s largest single source of support for business R&amp;D. CRA runs it. It pays cash refunds or tax credits on eligible R&amp;D done in Canada that leads to new or improved, technologically advanced products or processes.</p>" +
          "<p>The Income Tax Act (subsection 248(1)) defines it as a systematic investigation or search, in a field of science or technology, by experiment or analysis. It covers three kinds of work:</p>" +
          '<div class="trio"><div><b>Basic research</b><p class="small muted">Advancing scientific knowledge with no specific practical use in view.</p></div><div><b>Applied research</b><p class="small muted">Advancing scientific knowledge with a specific practical use in view.</p></div><div><b>Experimental development</b><p class="small muted">Achieving a technological advancement to create new, or improve existing, materials, devices, products or processes, including small improvements.</p></div></div>' +
          "<p>Support work also counts when it is needed for, and directly supports, that work in Canada: engineering, design, operations research, mathematical analysis, computer programming, data collection, testing and psychological research.</p>" +
          "<p><b>What it is worth.</b> Investment tax credits, plus an immediate deduction of eligible spending. CCPCs get up to 35% federally; large and non-CCPC corporations get 15%. Most provinces add their own credit. In Manitoba it is 15%, half of it refundable.</p>") +
        sec("g-tests", "The five tests", '<ol class="qs">' + tests + '</ol><p><a class="btn alt small" href="#eligibility">Run the eligibility check</a></p>') +
        sec("g-method", "The method",
          "<p>The work must be done by qualified people and follow a systematic investigation. In practice it is a loop:</p>" +
          '<ol class="loop"><li>Hypothesis</li><li>Implementation</li><li>Testing</li><li>Analysis of results</li><li class="dec">Success?</li></ol>' +
          '<p class="small muted">Yes: you have your advancement. No: form a new hypothesis and go round again. Each loop should leave a dated record.</p>') +
        sec("g-std", "Standard practice is not SR&amp;ED",
          "<p>Standard practice means adapting a known engineering or technological practice to a new situation when you can be quite sure it will work. That includes:</p>" +
          '<ul class="plain"><li>Using third-party technology as it was meant to be used</li><li>Work where the outcome is predictable</li><li>Minor changes, troubleshooting and debugging</li><li>Solutions already in the public domain</li><li>Repeating knowledge that is openly available</li><li>Work with no new knowledge, and no experiment or analysis</li></ul>') +
        sec("g-not", "What’s excluded",
          '<p>The definition rules out work on:</p><ul class="plain cols">' + FLAGS.filter(function (f) { return ["standard", "debug", "public"].indexOf(f[0]) < 0; }).map(function (f) { return "<li>" + esc(f[1]) + "</li>"; }).join("") + "</ul>" +
          '<p class="small muted">Excluded work can sit inside an eligible project. Keep its hours and costs separate.</p>') +
        sec("g-ex", "Examples from Manitoba industry", '<p class="small muted">Projects with RRC Polytech research centres: CAMTT (advanced manufacturing), VTEC and MotiveLab (vehicles), BETAC (building envelope) and TACAM (agriculture).</p><div class="exs">' + ex + "</div>") +
        sec("g-myths", "Myths that cost companies money", '<ul class="myths">' + myths + "</ul>") +
        sec("g-docs", "Records that make a claim stand up", '<ol class="docs">' + docs + "</ol>" +
          '<p><b>Useful evidence:</b> test plans and results, calculations, design revisions, prototypes, photos, code commits, tickets, technical emails, meeting notes and RRC reports.</p>') +
        sec("g-dates", "Deadlines",
          '<div class="trio"><div><b class="num big2">6 months</b><p class="small muted">Ideal: file with your corporate tax return, within 6 months of year end.</p></div>' +
          '<div><b class="num big2">18 months</b><p class="small muted">Final: the claim must reach CRA within 18 months of the tax year end. There is no extension.</p></div>' +
          '<div><b class="num big2">' + h.longDate(CLEAN_TECH_DUE) + '</b><p class="small muted">Key retroactive filing date for the Clean Technology ITC.</p></div></div>') +
        NOTE + "</section>";
    }

    /* ---------- membership ---------- */
    var PLANS = [
      {id: "starter", t: "Starter", m: 79, y: 790, who: "A small team with its first SR&ED project.",
       f: ["1 company, up to 5 people", "3 active projects", "Evidence locker, 10 GB", "Weekly time and gap alerts", "Eligibility check and SR&ED guide"], no: ["Other funding programs and application guides"]},
      {id: "growth", t: "Growth", m: 199, y: 1990, best: true, who: "Companies claiming every year.",
       f: ["Up to 25 people", "Unlimited projects", "Evidence locker, 100 GB", "Other funding: eligibility and how to apply", "Credit estimator and binder export", "1 free advisor seat (view only)", "Email support"]},
      {id: "scale", t: "Scale", m: 449, y: 4490, who: "Larger R&D teams and groups of companies.",
       f: ["Unlimited people", "Up to 3 related companies", "Evidence locker, 1 TB", "Other funding: eligibility and how to apply", "Funding review call each year", "Audit log export", "Priority support"]}
    ];
    var STATUS = {trialing: "free trial", active: "active", past_due: "payment overdue", unpaid: "unpaid", canceled: "cancelled",
                  incomplete: "payment not finished", incomplete_expired: "payment not finished", paused: "paused"};
    function planState() {
      if (h.mode !== "live") return {plan: gs.demoPlan || "growth", status: gs.demoPlan && gs.demoPlan !== "growth" ? "active" : "trialing", trialLeft: 14, sample: true};
      var b = h.billing;
      if (!b) return {plan: null, status: null};
      var left = b.trial_ends_at ? Math.max(0, Math.ceil((Date.parse(b.trial_ends_at) - Date.now()) / 86400000)) : null;
      return {plan: b.plan, status: b.status, period: b.period, trialLeft: left, end: b.current_period_end, cancelling: b.cancel_at_period_end};
    }
    function link(plan, period) { var l = (h.stripe.links || {})[plan + "_" + period]; return /^https:\/\/(buy|checkout)\.stripe\.com\//.test(l || "") ? l : ""; }
    function portalLink() { var p = h.stripe.portal || ""; return /^https:\/\/billing\.stripe\.com\//.test(p) ? p : ""; }
    function paidFlash() {
      if (!/[?&]paid=1/.test(location.search)) return "";
      try { history.replaceState(null, "", location.pathname + location.hash); } catch (e) {}
      return '<p class="flash" role="status">Thank you, your payment went through. Your plan updates here within a minute. Stripe emails your receipt.</p>';
    }
    function vPlans() {
      var yr = gs.bill === "year", st = planState(), paid = st.status === "active" || st.status === "past_due";
      var live = h.mode === "live", mgr = h.canManage;
      var cards = PLANS.map(function (p) {
        var cur = p.id === st.plan && (paid || st.status === "trialing");
        var url = link(p.id, yr ? "year" : "month");
        var label = paid ? (cur ? "Current plan" : "Switch to " + p.t) : (st.status === "trialing" && cur ? "Keep " + p.t : "Choose " + p.t);
        var btn;
        if (paid && cur) btn = '<button class="btn alt" type="button" disabled>Current plan</button>';
        else if (paid) btn = '<button class="btn alt" type="button" data-g="manage" data-fk="g-plan-' + p.id + '">' + label + "</button>";
        else btn = '<button class="btn' + (p.best ? "" : " alt") + '" type="button" data-g="choose" data-v="' + p.id + '" data-url="' + esc(url) + '" data-fk="g-plan-' + p.id + '">' + label + "</button>";
        return '<article class="card plan' + (p.best ? " best" : "") + '">' +
          '<div class="row between"><h2>' + p.t + "</h2>" + (cur ? '<span class="pill good">Your plan</span>' : p.best ? '<span class="pill quiet">Most chosen</span>' : "") + "</div>" +
          '<p class="small muted">' + esc(p.who) + "</p>" +
          '<p class="price"><b class="num">' + money.format(yr ? Math.round(p.y / 12) : p.m) + '</b><span>/ month' + (yr ? ", billed " + money.format(p.y) + " a year" : ", billed monthly") + "</span></p>" +
          '<ul class="ticks">' + p.f.map(function (x) { return "<li>" + icon("check-circle") + "<span>" + esc(x) + "</span></li>"; }).join("") +
            (p.no || []).map(function (x) { return '<li class="no">' + icon("lock-simple") + "<span>" + esc(x) + "</span></li>"; }).join("") + "</ul>" +
          (mgr ? btn : "") + "</article>";
      }).join("");
      var nowT, nowSub;
      if (!st.status) { nowT = "No plan yet"; nowSub = "Choose a plan below to keep using the portal."; }
      else {
        var name = (PLANS.find(function (p) { return p.id === st.plan; }) || {t: st.plan}).t;
        nowT = "<b>" + esc(name) + "</b>, " + esc(STATUS[st.status] || st.status) + (st.status === "trialing" && st.trialLeft != null ? ": " + st.trialLeft + (st.trialLeft === 1 ? " day" : " days") + " left" : "");
        nowSub = st.sample ? "Sample account. Nothing is charged." :
          st.status === "trialing" ? "Choose a plan before the trial ends. You won’t be charged until you do." :
          st.status === "past_due" || st.status === "unpaid" ? "Your last payment did not go through. Update your card in Manage billing." :
          st.end ? (st.cancelling ? "Ends on " : "Renews on ") + h.longDate(st.end.slice(0, 10)) + (st.period ? ", billed " + (st.period === "year" ? "yearly" : "monthly") : "") + "." : "";
      }
      var manage = live && mgr && portalLink() && (paid || st.status === "canceled") ? '<button class="btn alt small" type="button" data-g="manage" data-fk="g-manage">Manage billing and invoices</button>' : "";
      return '<section class="stack" aria-labelledby="h-main">' +
        head("Membership", '<span class="soft">One price a year.</span> Less than a day of consulting.',
          "Every plan includes the full binder, locked evidence and the eligibility tools. Prices are in Canadian dollars, plus tax. Pay yearly and get two months free.") +
        paidFlash() +
        (live ? "" : '<div class="card row between demo-prev"><div><p class="eyebrow">Demo only</p><p class="small muted">See the portal the way each plan sees it. Try Starter, then open Other funding.</p></div>' +
          '<div class="seg" role="group" aria-label="Preview as plan">' + PLANS.map(function (p) { var on = (gs.demoPlan || "growth") === p.id;
            return '<button type="button" class="seg-b' + (on ? " on" : "") + '" aria-pressed="' + on + '" data-g="demoplan" data-v="' + p.id + '" data-fk="g-demo-' + p.id + '">' + p.t + "</button>"; }).join("") + "</div></div>") +
        (live && !mgr ? '<p class="badge">Only a company admin can change the plan.</p>' : "") +
        '<div class="card plan-now row between"><div><p class="eyebrow">Current plan</p><p class="plan-now-t">' + nowT + '</p><p class="small muted">' + nowSub + "</p>" + (manage ? '<div class="row" style="margin-top:10px">' + manage + "</div>" : "") + "</div>" +
          '<div class="seg" role="group" aria-label="Billing period"><button type="button" class="seg-b' + (yr ? "" : " on") + '" aria-pressed="' + !yr + '" data-g="bill" data-v="month" data-fk="g-bill-m">Monthly</button><button type="button" class="seg-b' + (yr ? " on" : "") + '" aria-pressed="' + yr + '" data-g="bill" data-v="year" data-fk="g-bill-y">Yearly, 2 months free</button></div></div>' +
        '<div class="plans">' + cards + "</div>" +
        '<div class="card stack-sm"><div class="row between"><h2>For accountants and SR&amp;ED advisors</h2><span class="stamp">$49 per client company / month</span></div>' +
          "<p>Manage every client’s binder from one sign-in, with read-only access to records, the audit log and binder exports. Volume pricing from 20 clients. Contact KV WebDesign to set it up.</p></div>" +
        '<div class="card stack-sm"><h2>Questions about billing</h2><ul class="plain">' +
          "<li>Payments go through Stripe’s secure checkout. We never see or store card numbers.</li>" +
          "<li>You can change plans or cancel at any time in Manage billing. Stripe prorates the difference and emails every receipt.</li>" +
          "<li>If you cancel, you can still sign in and download your binders for 12 months. CRA can ask for records for at least six years.</li></ul></div>" +
        "</section>";
    }

    function overviewCard() {
      var left = days(h.today, CLEAN_TECH_DUE);
      return '<div class="card news-card stack-sm rv"><div class="row between"><h2>New in SR&amp;ED.</h2><a href="#learn">Read the guide</a></div>' +
        '<ul class="news">' + NEWS.slice(0, 2).map(function (n) { return '<li class="news-i"><span class="stamp">' + n.d + "</span><div><b>" + esc(n.t) + "</b><p>" + esc(n.b) + "</p></div></li>"; }).join("") + "</ul>" +
        (left >= 0 ? '<p class="small"><span class="chip strong">' + icon("clock") + left + ' days</span> to the Clean Technology ITC retroactive filing date. <a href="#programs">See other funding</a></p>' : "") +
        "</div>";
    }

    /* ---------- events ---------- */
    document.addEventListener("click", function (ev) {
      var b = ev.target.closest && ev.target.closest("[data-g]");
      if (!b || b.tagName === "INPUT" || b.tagName === "SELECT") return;
      var g = b.getAttribute("data-g"), v = b.getAttribute("data-v");
      if (g === "ans") { gs.elig[b.getAttribute("data-k")] = v; save(); h.render(); return; }
      if (g === "elig-reset") { gs.elig = {flags: []}; save(); h.render(); return; }
      if (g === "ohm") { gs.est = Object.assign(gs.est || estDefaults(), {overheadMode: v}); save(); h.render(); return; }
      if (g === "est-reset") { gs.est = null; save(); h.render(); return; }
      if (g === "bill") { gs.bill = v; save(); h.render(); return; }
      if (g === "demoplan") { gs.demoPlan = v; save(); h.render(); return; }
      if (g === "choose") {
        if (h.mode !== "live") { h.toast("This is the demo, so nothing is charged. Members go to Stripe’s secure checkout here."); return; }
        var url = b.getAttribute("data-url");
        if (!url) { h.toast("Online billing is not switched on yet. Contact KV WebDesign to change plans."); return; }
        // client_reference_id tells the webhook which company paid. It is the company id, not personal data.
        location.href = url + (url.indexOf("?") < 0 ? "?" : "&") + "client_reference_id=" + encodeURIComponent(h.orgId);
        return;
      }
      if (g === "manage") {
        var pl = portalLink();
        if (h.mode !== "live" || !pl) { h.toast(h.mode !== "live" ? "This is the demo, so there is no billing to manage." : "Billing management is not switched on yet. Contact KV WebDesign."); return; }
        window.open(pl, "_blank", "noopener");
        return;
      }
      if (g === "jump") {
        var t = document.getElementById(b.getAttribute("data-to"));
        if (t) { t.scrollIntoView({behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start"}); try { t.focus({preventScroll: true}); } catch (e) {} }
      }
    });
    function onField(t) {
      if (!t.getAttribute || !t.getAttribute("data-g")) return;
      var g = t.getAttribute("data-g");
      if (g === "fq") {
        gs.fq = gs.fq || {}; var sl = t.getAttribute("data-s"), arr = gs.fq[sl] || (gs.fq[sl] = []), ix = Number(t.value), at = arr.indexOf(ix);
        if (t.checked && at < 0) arr.push(ix);
        if (!t.checked && at >= 0) arr.splice(at, 1);
        save();
        var tot = t.closest("ul").querySelectorAll("input").length, st = document.getElementById("fq-" + sl);
        if (st) st.textContent = arr.length + " of " + tot + " met";
        return;
      }
      if (g === "flag") {
        var f = gs.elig.flags || (gs.elig.flags = []), i = f.indexOf(t.value);
        if (t.checked && i < 0) f.push(t.value);
        if (!t.checked && i >= 0) f.splice(i, 1);
        save();
        var side = document.querySelector(".elig-side");
        if (side) side.innerHTML = eligResult();
        return;
      }
      if (g === "est") {
        gs.est = gs.est || estDefaults();
        gs.est[t.getAttribute("data-k")] = t.tagName === "SELECT" ? t.value : Number(t.value);
        save();
        var out = document.getElementById("est-out");
        if (out) out.innerHTML = estOut(gs.est);
      }
    }
    document.addEventListener("input", function (e) { if (e.target.tagName === "INPUT") onField(e.target); });
    document.addEventListener("change", function (e) { if (e.target.tagName === "SELECT" || e.target.type === "checkbox") onField(e.target); });

    return {
      nav: [["eligibility", "09", "Eligibility check"], ["claimable", "10", "What you can claim"], ["programs", "11", "Other funding"], ["learn", "12", "SR&ED guide"], ["plans", "13", "Membership"]],
      icons: {eligibility: "seal-check", claimable: "calculator", programs: "hand-coins", learn: "graduation-cap", plans: "credit-card"},
      groups: {eligibility: "Plan and learn", plans: "Account"},
      views: {eligibility: vEligibility, claimable: vClaimable, programs: vPrograms, learn: vLearn, plans: vPlans},
      overviewCard: overviewCard,
      locked: function (r) { return r === "programs" && !fundingAccess(); }
    };
  };
})();
