/* Help and training panel.
   Answers to common questions are open to every plan, so nobody gets stuck.
   Live training (onboarding, webinars, walkthroughs) is part of Growth and Scale. */
(function () {
  "use strict";

  window.SRED_HELP = function (h) {
    var esc = h.esc, icon = h.icon;
    // Each answer lists the pages it belongs to, so the panel shows the relevant ones first.
    var FAQ = [
      {q: "What counts as SR&ED?", a: "Work that tries to resolve a technological uncertainty through a systematic investigation: a hypothesis, tests and analysis. Routine testing, debugging and using a supplier’s technology as intended do not count.", go: "eligibility", goT: "Run the eligibility check", on: ["eligibility", "learn", "overview"]},
      {q: "When is our claim due?", a: "18 months after your tax year ends. File it with your T2 return, 6 months after year end, to get your refund sooner. The exact dates are worked out from your year end.", go: "deadlines", goT: "See your deadlines", on: ["deadlines", "overview"]},
      {q: "How do I file a record?", a: "Select File a record on the Evidence page or on a project page. Describe it, choose the project and person, and attach a file if you have one. It is dated the day you file it.", go: "evidence", goT: "Open Evidence", on: ["evidence", "project", "overview"]},
      {q: "Can I change a record after filing it?", a: "No. Records are locked so the date and content can be trusted in a CRA review. If something was wrong, file a new record that corrects it.", go: "evidence", goT: "Open Evidence", on: ["evidence", "project"]},
      {q: "How do I log weekly time?", a: "Each Monday, split last week’s hours by project on the Weekly time page, then select Submit week. It takes about two minutes per person.", go: "time", goT: "Open Weekly time", on: ["time", "project"]},
      {q: "Why doesn’t my timesheet match payroll?", a: "The hours logged for the week are more than 1 hour away from the hours payroll paid. Correct the split, or ask your bookkeeper to check the payroll hours.", go: "time", goT: "Open Weekly time", on: ["time", "gaps"]},
      {q: "What should I write on the T661 lines?", a: "Line 242: what you could not do with existing knowledge. Line 244: what you tried and why. Line 246: what you learned, with dates and numbers. Plain language works best.", go: "projects", goT: "Open Projects", on: ["projects", "project"]},
      {q: "What is a gap alert?", a: "Something a reviewer would question: a timesheet that does not match payroll, a missing contract, a project with no recent records, or results not written up. Fix the gaps and your binder is ready.", go: "gaps", goT: "Open Gap alerts", on: ["gaps", "overview"]},
      {q: "How is claim strength scored?", a: "Each item CRA expects has a weight from 1 to 3. The score is the weight of what you have divided by the weight of everything that applies. 85% and up is strong.", go: "strength", goT: "Open Claim strength", on: ["strength"]},
      {q: "How much could we get back?", a: "Use the estimator on What you can claim. It applies the federal and provincial rates to your costs and subtracts any grants. Your advisor confirms the final figure.", go: "claimable", goT: "Estimate your credit", on: ["claimable", "overview"]},
      {q: "Do grants reduce our claim?", a: "Yes. Government grants and subsidies for the same work come off the costs you claim. Log every one in Finance and funding so the claim stays accurate.", go: "funding", goT: "Open Finance and funding", on: ["funding", "programs", "claimable"]},
      {q: "Who can see our records?", a: "Only people you invite. Company admins manage the team, staff file records and log hours, and advisors can read everything but change nothing.", go: "overview", goT: "Go to the overview", on: ["team", "overview"]},
      {q: "How do I hand the binder to my advisor?", a: "Close the open gaps, then open Export. The binder is ordered the way a reviewer reads it, with any open gaps listed on the cover.", go: "export", goT: "Open Export", on: ["export"]},
      {q: "How do I change plans or cancel?", a: "Company admins can do both on the Membership page, through Stripe’s secure billing page. Changes are prorated.", go: "plans", goT: "Open Membership", on: ["plans"]},
      {q: "Are there keyboard shortcuts?", a: "Yes. Ctrl or Cmd + K searches the whole portal. Ctrl or Cmd + B shows or hides the sidebar. Esc closes any panel.", go: "", goT: "", on: []}
    ];
    var TRAINING = [
      ["Onboarding session", "45 minutes with your team: set up projects, timesheets and evidence the right way from day one.", "booking", "Book a session"],
      ["Monthly SR&ED training", "A live webinar each month on writing strong T661 lines, keeping records and avoiding common mistakes.", "webinar", "Join the next webinar"],
      ["Guided claim walkthrough", "Before you file, we walk through your binder and claim-strength score with you and your advisor.", "booking", "Book a walkthrough"],
      ["Funding application coaching", "Step-by-step help applying to IRAP, Mitacs, PrairiesCan and the clean technology credit.", "booking", "Book coaching"]
    ];
    var q = "", returnTo = null;

    function faqHtml() {
      var route = h.route, term = q.trim().toLowerCase();
      var list = FAQ.filter(function (f) { return !term || (f.q + " " + f.a).toLowerCase().indexOf(term) >= 0; });
      if (!term) list.sort(function (a, b) { return (b.on.indexOf(route) >= 0) - (a.on.indexOf(route) >= 0); });
      var here = term ? 0 : list.filter(function (f) { return f.on.indexOf(route) >= 0; }).length;
      if (!list.length) return '<p class="hint">No answers match. Try other words, or use Search (Ctrl or Cmd + K) to find a page.</p>';
      return list.map(function (f, i) {
        return (i === 0 && here ? '<p class="help-g">On this page</p>' : i === here && here ? '<p class="help-g">More answers</p>' : "") +
          '<details class="help-q"' + (i === 0 && here ? " open" : "") + "><summary>" + esc(f.q) + icon("caret-down", "help-car") + "</summary>" +
          "<p>" + esc(f.a) + "</p>" + (f.go ? '<a class="link-sm" href="#' + f.go + '" data-help-close>' + esc(f.goT) + "</a>" : "") + "</details>";
      }).join("");
    }
    function trainingHtml() {
      var paid = h.paid();
      var links = h.training || {};
      var items = TRAINING.map(function (t) {
        var url = /^https:\/\//.test(links[t[2]] || "") ? links[t[2]] : "";
        var action = !paid ? "" : url ? '<a class="btn alt small" href="' + esc(url) + '" target="_blank" rel="noopener">' + t[3] + "</a>" :
          '<span class="small muted">Booking opens soon. Ask KV WebDesign for a time.</span>';
        return '<li class="tr-i' + (paid ? "" : " locked") + '">' + icon(paid ? "graduation-cap" : "lock-simple") + "<div><b>" + esc(t[0]) + '</b><span class="small muted">' + esc(t[1]) + "</span>" + (action ? '<div class="tr-a">' + action + "</div>" : "") + "</div></li>";
      }).join("");
      return '<div class="help-train"><div class="row between"><h3>Training and support</h3>' + (paid ? '<span class="pill good">In your plan</span>' : '<span class="pill quiet">Growth and Scale</span>') + "</div>" +
        '<ul class="tr-l">' + items + "</ul>" +
        (paid ? "" : '<p class="small">Answers above are free on every plan. Live training with your team is part of Growth and Scale.</p><a class="btn" href="#plans" data-help-close>See Growth and Scale</a>') + "</div>";
    }
    function panel() {
      return '<div class="drawer help-drawer" id="helpDrawer"><div class="drawer-scrim" data-help-close></div>' +
        '<aside class="drawer-panel" role="dialog" aria-modal="true" aria-labelledby="help-t">' +
        '<header class="drawer-head"><h2 id="help-t">Help and training</h2><button class="icon-btn" type="button" data-help-close aria-label="Close help">' + icon("x-circle") + "</button></header>" +
        '<div class="drawer-body stack-sm">' +
          '<label class="dt-search help-search"><span class="sr">Search help</span>' + icon("magnifying-glass") + '<input type="search" id="helpQ" placeholder="Search answers, for example deadline" value="' + esc(q) + '"></label>' +
          '<div id="helpList">' + faqHtml() + "</div>" +
          '<div class="help-setup"><div><b>New to the portal?</b><span class="small muted">A two-minute guided setup: year end, first project and team.</span></div><button class="btn alt small" type="button" data-act="wizard" data-help-close>Run guided setup</button></div>' +
          trainingHtml() +
        "</div></aside></div>";
    }
    function open() {
      close(true);
      returnTo = document.activeElement;
      document.body.insertAdjacentHTML("beforeend", panel());
      document.body.classList.add("drawer-open");
      setTimeout(function () { var i = document.getElementById("helpQ"); if (i) i.focus(); }, 60);
    }
    function close(silent) {
      var d = document.getElementById("helpDrawer"); if (!d) return;
      d.remove(); document.body.classList.remove("drawer-open");
      if (!silent && returnTo && returnTo.focus && document.contains(returnTo)) returnTo.focus();
    }
    document.addEventListener("click", function (e) {
      if (e.target.closest && e.target.closest("#helpBtn")) { open(); return; }
      var c = e.target.closest && e.target.closest("[data-help-close]");
      if (c) close(!!c.getAttribute("href"));
    });
    document.addEventListener("input", function (e) {
      if (e.target.id !== "helpQ") return;
      q = e.target.value;
      var l = document.getElementById("helpList"); if (l) l.innerHTML = faqHtml();
    });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape" && document.getElementById("helpDrawer")) { e.preventDefault(); close(); } });
    return {open: open};
  };
})();
