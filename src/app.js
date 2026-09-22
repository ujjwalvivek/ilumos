const initialRows = [
  {
    id: "element-1",
    number: "01",
    title: "A temperature control device with a wireless communication module",
    feature: "Acme Thermostat product page",
    featureDetail:
      "WiFi-enabled smart thermostat connects to your home network",
    reasoning:
      "The Acme device has WiFi capability, which satisfies the wireless communication module requirement.",
    source: "Acme product page",
    status: "supported",
    confidence: "High confidence",
  },
  {
    id: "element-2",
    number: "02",
    title: "A motion sensor for detecting occupancy",
    feature: "Acme technical specifications",
    featureDetail: "Built-in motion sensor detects when people are home",
    reasoning:
      "The technical specifications explicitly describe a motion sensor that detects occupancy, directly mapping to this claim element.",
    source: "Acme technical specifications",
    status: "supported",
    confidence: "High confidence",
  },
  {
    id: "element-3",
    number: "03",
    title:
      "Machine learning algorithm that learns user temperature preferences over time",
    feature: "Acme marketing materials",
    featureDetail: "Auto-Schedule learns your preferred temperatures",
    reasoning:
      "The learning behavior claim suggests an ML algorithm, though technical implementation details are not disclosed. Stronger technical evidence may be needed.",
    source: "Acme marketing materials",
    status: "review",
    confidence: "Needs corroboration",
  },
];

const state = {
  rows: structuredClone(initialRows),
  selectedRow: 2,
  documents: [
    {
      name: "US123456_claim_chart.xlsx",
      meta: "Claim chart · 34 KB",
      icon: "XLS",
    },
    {
      name: "Acme_technical_specs.pdf",
      meta: "Product document · 2.4 MB",
      icon: "PDF",
    },
    {
      name: "Acme_marketing_materials.pdf",
      meta: "Product document · 1.1 MB",
      icon: "PDF",
    },
  ],
  history: [],
  pendingSuggestions: new Map(),
  lastChangedRow: null,
  instructions:
    localStorage.getItem("ilumos-project-instructions") ||
    "Never invent evidence. Cite the source for every recommendation. Separate disclosed facts from inference, and flag missing technical support for analyst review.",
};

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

function escapeHTML(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function nowLabel() {
  return new Intl.DateTimeFormat("en", {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date());
}

function renderDocuments() {
  const list = $("#document-list");
  $("#document-count").textContent = state.documents.length;
  list.innerHTML = state.documents
    .map(
      (document) => `
    <div class="document-item ${document.isNew ? "is-new" : ""}">
      <span class="document-icon">${escapeHTML(document.icon || "DOC")}</span>
      <span>
        <span class="document-name" title="${escapeHTML(document.name)}">${escapeHTML(document.name)}</span>
        <span class="document-meta">${escapeHTML(document.meta)}</span>
      </span>
      <span class="document-check" aria-label="Ready">✓</span>
    </div>
  `,
    )
    .join("");
  state.documents.forEach((document) => delete document.isNew);
}

function statusMarkup(row) {
  const statusLabel =
    row.status === "supported"
      ? "Supported"
      : row.status === "recent"
        ? "Recently changed"
        : "Needs review";
  const statusClass =
    row.status === "supported"
      ? "supported"
      : row.status === "recent"
        ? "recent"
        : "review";
  return `<span class="status-badge ${statusClass}"><span class="status-dot ${row.status === "supported" ? "green" : row.status === "recent" ? "blue" : "amber"}"></span>${statusLabel}</span>`;
}

function renderRows() {
  const tbody = $("#claim-rows");
  tbody.innerHTML = state.rows
    .map(
      (row, index) => `
    <tr class="claim-row ${state.selectedRow === index ? "selected" : ""} ${state.lastChangedRow === index ? "recently-changed" : ""}" data-row-index="${index}" data-select-row="${index}" tabindex="0" aria-label="Focus ${escapeHTML(row.title)}">
      <td>
        <span class="element-index">${escapeHTML(row.number)}</span>
        <span class="element-title">${escapeHTML(row.title)}</span>
        <span class="cell-note">Claim 1 · element ${index + 1}</span>
      </td>
      <td>
        <span class="feature-name">${escapeHTML(row.feature)}</span>
        <span class="feature-detail">“${escapeHTML(row.featureDetail)}”</span>
      </td>
      <td>
        <span class="reasoning-copy">${escapeHTML(row.reasoning)}</span>
        <span class="source-row">
          ${statusMarkup(row)}
          <span class="source-chip">⌕ ${escapeHTML(row.source)}</span>
          <span class="confidence-chip">${escapeHTML(row.confidence)}</span>
        </span>
      </td>
    </tr>
  `,
    )
    .join("");
  updateStats();
}

function updateStats() {
  const supported = state.rows.filter(
    (row) => row.status === "supported" || row.status === "recent",
  ).length;
  const review = state.rows.length - supported;
  $("#stat-elements").textContent = state.rows.length;
  $("#stat-supported").textContent = supported;
  $("#stat-review").textContent = review;
  const selected = state.rows[state.selectedRow];
  $("#chat-context").textContent = selected
    ? `Element ${state.selectedRow + 1} · ${selected.title.replace(/^.*?(?=Machine|A motion|A temperature)/, "")}`
    : "All elements";
  $("#stat-note-text").textContent = selected
    ? `Element ${state.selectedRow + 1} is the active review target`
    : "Select an element to focus the chat";
}

function selectRow(index) {
  const previousRow = state.selectedRow;
  state.selectedRow = Number(index);
  state.lastChangedRow = null;
  renderRows();
  const selected = state.rows[state.selectedRow];
  if (selected) {
    $("#chat-context").textContent =
      `Element ${state.selectedRow + 1} · ${selected.title}`;
    showToast(`Chat focused on Element ${state.selectedRow + 1}`);
    if (previousRow !== state.selectedRow) {
      addMessage(
        "assistant",
        "I’m now focused on Element " +
          (state.selectedRow + 1) +
          ". What would you like to inspect?",
        {
          muted:
            "I can show the source, explain the current status, identify a missing technical document, or draft a reviewable refinement.",
        },
      );
    }
  }
}

function addMessage(role, text, options = {}) {
  const thread = $("#chat-thread");
  const wrapper = document.createElement("div");
  wrapper.className = `message ${role === "user" ? "user-message" : "assistant-message"}`;
  const avatar = document.createElement("div");
  avatar.className = "message-avatar";
  avatar.textContent = role === "user" ? "AV" : "✦";
  const content = document.createElement("div");
  content.className = "message-content";
  const meta = document.createElement("div");
  meta.className = "message-meta";
  meta.innerHTML = `<strong>${role === "user" ? "You" : "iLumos"}</strong><span>${nowLabel()}</span>`;
  const bubble = document.createElement("div");
  bubble.className = "message-bubble";
  const paragraph = document.createElement("p");
  paragraph.textContent = text;
  bubble.appendChild(paragraph);
  if (options.muted) {
    const muted = document.createElement("p");
    muted.className = "message-muted";
    muted.textContent = options.muted;
    bubble.appendChild(muted);
  }
  content.append(meta, bubble);
  wrapper.append(avatar, content);
  thread.appendChild(wrapper);
  if (options.suggestion) appendSuggestion(content, options.suggestion);
  thread.scrollTop = thread.scrollHeight;
  return wrapper;
}

function appendTyping() {
  const thread = $("#chat-thread");
  const wrapper = document.createElement("div");
  wrapper.className = "message assistant-message typing-message";
  wrapper.innerHTML = `<div class="message-avatar">✦</div><div class="message-content"><div class="message-meta"><strong>iLumos</strong><span>typing</span></div><div class="message-bubble typing"><i></i><i></i><i></i></div></div>`;
  thread.appendChild(wrapper);
  thread.scrollTop = thread.scrollHeight;
  return wrapper;
}

function appendSuggestion(content, suggestion) {
  const card = document.createElement("div");
  card.className = "suggestion-card";
  card.dataset.suggestionId = suggestion.id;
  card.dataset.rowIndex = suggestion.rowIndex;
  card.innerHTML = `
    <div class="suggestion-top">
      <span class="suggestion-label">${suggestion.evidenceGap ? "Evidence request" : "Proposed refinement"} · Element ${suggestion.rowIndex + 1}</span>
      <span class="suggestion-status">${escapeHTML(suggestion.statusLabel || "Needs review")}</span>
    </div>
    <div class="suggestion-text">${escapeHTML(suggestion.text)}</div>
    <div class="suggestion-source"><span class="status-dot ${suggestion.evidenceGap ? "amber" : "blue"}"></span><span>Source:</span> <strong>${escapeHTML(suggestion.source)}</strong></div>
    <div class="suggestion-actions">
      ${suggestion.evidenceGap ? `<button class="suggestion-action accept" type="button" data-suggestion-action="upload" data-suggestion-id="${suggestion.id}">Add source</button>` : `<button class="suggestion-action accept" type="button" data-suggestion-action="accept" data-suggestion-id="${suggestion.id}">Accept change</button>`}
      <button class="suggestion-action edit" type="button" data-suggestion-action="edit" data-suggestion-id="${suggestion.id}">Edit</button>
      <button class="suggestion-action reject" type="button" data-suggestion-action="reject" data-suggestion-id="${suggestion.id}">Reject</button>
    </div>
  `;
  content.appendChild(card);
  state.pendingSuggestions.set(suggestion.id, suggestion);
}

function makeSuggestion(rowIndex, prompt) {
  const row = state.rows[rowIndex];
  const lower = prompt.toLowerCase();
  const isElementThree = rowIndex === 2;
  const evidenceGap =
    lower.includes("cannot find") ||
    lower.includes("no evidence") ||
    lower.includes("more evidence") ||
    lower.includes("documentation") ||
    lower.includes("url");
  if (evidenceGap && !lower.includes("motion sensor")) {
    return {
      id: `suggestion-${Date.now()}`,
      rowIndex,
      text: `I could not locate enough technical evidence in the uploaded material to support a stronger conclusion for ${row.title.toLowerCase()}. I will not infer the missing implementation. Upload a technical specification, firmware note, or a public product URL and I can re-run the review.`,
      source: "No supporting source found",
      evidenceGap: true,
      statusLabel: "Evidence gap",
    };
  }
  if (
    lower.includes("wrong") ||
    lower.includes("incorrect") ||
    lower.includes("rule-based")
  )
    return null;
  const text = isElementThree
    ? "Acme’s Auto-Schedule feature is described as learning a user’s preferred temperature settings over time. That behavior is consistent with an adaptive control process, but the available marketing material does not disclose a model architecture, training method, or other implementation detail. Treat this as a lead requiring corroboration, not proof of a machine-learning algorithm."
    : rowIndex === 1
      ? "The technical specification expressly states that the built-in motion sensor detects when people are home. This is direct evidence for occupancy detection; retain the quoted language and identify the specification page in the exported chart."
      : "The product page identifies WiFi connectivity and describes the thermostat connecting to a home network. This directly supports the wireless communication module element, subject to confirming the quoted language in the source document.";
  return {
    id: `suggestion-${Date.now()}`,
    rowIndex,
    text,
    source: row.source,
    evidenceGap: false,
    statusLabel: isElementThree ? "Needs corroboration" : "Ready to review",
  };
}

function submitPrompt(prompt) {
  const value = prompt.trim();
  if (!value) return;
  addMessage("user", value);
  $("#chat-input").value = "";
  const typing = appendTyping();
  window.setTimeout(() => {
    typing.remove();
    conversationalRespondToPrompt(value);
  }, 620);
}

function hasAny(text, terms) {
  return terms.some((term) => {
    if (term.length <= 3)
      return new RegExp("(^|[^a-z])" + term + "([^a-z]|$)").test(text);
    return text.includes(term);
  });
}

function createChatSuggestion(rowIndex, text, options = {}) {
  const row = state.rows[rowIndex];
  return {
    id: "suggestion-" + Date.now(),
    rowIndex,
    text,
    source: options.source || row.source,
    evidenceGap: Boolean(options.evidenceGap),
    statusLabel:
      options.statusLabel ||
      (row.status === "review" ? "Needs corroboration" : "Ready to review"),
  };
}

function makeEvidenceGapSuggestion(rowIndex) {
  const row = state.rows[rowIndex];
  return createChatSuggestion(
    rowIndex,
    "I could not locate enough technical evidence in the uploaded material to support a stronger conclusion for " +
      row.title.toLowerCase() +
      ". I will not infer the missing implementation. Add a technical specification, firmware note, developer or API document, or a public product URL and I can re-run the review.",
    {
      source: "No supporting source found",
      evidenceGap: true,
      statusLabel: "Evidence gap",
    },
  );
}

function makeConciseSuggestion(rowIndex) {
  const text =
    rowIndex === 2
      ? "Acme’s marketing materials describe Auto-Schedule learning preferred temperatures over time, but do not disclose the technical implementation of a machine-learning algorithm."
      : rowIndex === 1
        ? "Acme’s technical specifications describe a built-in motion sensor that detects when people are home, supporting occupancy detection."
        : "Acme’s product page describes WiFi connectivity and connection to a home network, supporting the wireless communication module.";
  return createChatSuggestion(rowIndex, text);
}

function answerSource(rowIndex) {
  const row = state.rows[rowIndex];
  const element = "Element " + (rowIndex + 1);
  const message =
    "The current source for " +
    element +
    " is " +
    row.source +
    ". It says: “" +
    row.featureDetail +
    "”.";
  if (rowIndex === 2) {
    addMessage("assistant", message, {
      muted:
        "That is evidence of the product behavior. It does not disclose the algorithm, model architecture, training method, or implementation details needed to prove a machine-learning limitation.",
    });
    return;
  }
  addMessage("assistant", message, {
    muted:
      "That language directly describes the accused product behavior mapped to this claim element. I would still preserve the source reference in the exported chart.",
  });
}

function answerWhyReview(rowIndex) {
  const row = state.rows[rowIndex];
  const element = "Element " + (rowIndex + 1);
  if (row.status === "review") {
    addMessage(
      "assistant",
      element +
        " needs review because " +
        row.source +
        " describes the observed behavior, but does not disclose enough of the technical implementation to support the stronger claim language.",
      {
        muted:
          "Current evidence: “" +
          row.featureDetail +
          "”. The chart separates that disclosed fact from the inference that still needs corroboration.",
      },
    );
    return;
  }
  addMessage(
    "assistant",
    element +
      " is currently supported because " +
      row.source +
      " directly describes the product behavior mapped to the claim element.",
    {
      muted:
        "Current evidence: “" +
        row.featureDetail +
        "”. The reasoning can still be tightened, but the source-to-element relationship is direct.",
    },
  );
}

function answerChartSummary() {
  const supported = state.rows.filter(
    (row) => row.status === "supported" || row.status === "recent",
  ).length;
  const review = state.rows.length - supported;
  const reviewItems = state.rows
    .map((row, index) =>
      row.status === "review" ? "Element " + (index + 1) : null,
    )
    .filter(Boolean);
  addMessage(
    "assistant",
    "This chart has " +
      supported +
      " supported element" +
      (supported === 1 ? "" : "s") +
      " and " +
      review +
      " that need" +
      (review === 1 ? "s" : "") +
      " review.",
    {
      muted: reviewItems.length
        ? reviewItems.join(", ") +
          " " +
          (reviewItems.length === 1 ? "is" : "are") +
          " currently the review target. Select an element and I’ll keep the next answer tied to its evidence."
        : "All current elements have a supported status, subject to analyst review before export.",
    },
  );
}

function markWrongEvidence(rowIndex) {
  const row = state.rows[rowIndex];
  const element = "Element " + (rowIndex + 1);
  if (row.status !== "review") {
    state.history.push({
      rows: structuredClone(state.rows),
      description: "Marked " + element + " for evidence review",
      kind: "correction",
    });
    row.status = "review";
    row.confidence = "Needs corroboration";
    state.lastChangedRow = rowIndex;
    renderRows();
    updateHistoryLabel();
  }
  if (rowIndex === 2) {
    addMessage(
      "assistant",
      "Understood. I won’t treat the learning-behavior sentence as proof of a machine-learning implementation. I marked " +
        element +
        " for review and left the chart wording unchanged.",
      {
        muted:
          "The marketing source can remain as a product-behavior lead. Add a technical source before making a stronger implementation claim.",
      },
    );
    return;
  }
  addMessage(
    "assistant",
    "Understood. I won’t rely on the current mapping as settled evidence. I marked " +
      element +
      " for review and left its chart wording unchanged until a replacement source is identified.",
    {
      muted:
        "If you have the correct document or passage, add it to the source set and I can reassess the mapping.",
    },
  );
}

function conversationalRespondToPrompt(prompt) {
  const value = prompt.trim();
  const lower = value.toLowerCase();
  const rowIndex = state.selectedRow;

  if (!value) return;

  if (hasAny(lower, ["undo", "take that back", "revert"])) {
    undoLastChange();
    return;
  }

  if (
    hasAny(lower, [
      "hello",
      "hi",
      "hey",
      "good morning",
      "good afternoon",
      "what can you do",
      "help",
    ])
  ) {
    addMessage(
      "assistant",
      "I’m scoped to this claim chart and its uploaded evidence. I can inspect the focused source, explain why an element is supported or needs review, draft tighter reasoning, and identify missing technical support.",
      {
        muted:
          "I will not invent evidence or decide infringement. Any wording change stays a reviewable proposal until you accept it.",
      },
    );
    return;
  }

  if (
    hasAny(lower, [
      "what changed",
      "show history",
      "review history",
      "what have you applied",
    ])
  ) {
    if (!state.history.length) {
      addMessage(
        "assistant",
        "Nothing has been applied to the chart yet. I can draft a proposal, but the chart only changes after you accept it.",
      );
    } else {
      const recent = state.history
        .slice(-3)
        .map((entry) => entry.description)
        .join(" · ");
      addMessage(
        "assistant",
        "There " +
          (state.history.length === 1 ? "is" : "are") +
          " " +
          state.history.length +
          " recorded chart action" +
          (state.history.length === 1 ? "" : "s") +
          " in this session.",
        {
          muted: recent + ". You can ask me to undo the latest applied change.",
        },
      );
    }
    return;
  }

  if (hasAny(lower, ["export", "word document", "word file"])) {
    addMessage(
      "assistant",
      "When the evidence map is reviewed, use “Export draft” to generate the Word-compatible claim chart. I can help tighten the reasoning first, but export does not replace analyst approval.",
    );
    return;
  }

  if (
    hasAny(lower, ["thank", "thanks", "got it", "understood", "okay", "ok"])
  ) {
    addMessage(
      "assistant",
      "Of course. I’ll keep the next answer tied to the selected element and its source set.",
    );
    return;
  }

  if (rowIndex == null) {
    if (
      hasAny(lower, [
        "overall",
        "all elements",
        "claim elements",
        "chart status",
        "status of the chart",
        "how many",
      ])
    ) {
      answerChartSummary();
      return;
    }
    addMessage(
      "assistant",
      "I can answer chart-level questions without a focus, but for evidence or wording work select a claim element first. That keeps the response tied to the right source.",
    );
    return;
  }

  if (
    hasAny(lower, [
      "wrong",
      "incorrect",
      "rule-based",
      "not true",
      "doesn't say",
      "does not say",
    ])
  ) {
    markWrongEvidence(rowIndex);
    return;
  }

  if (
    hasAny(lower, [
      "cannot find",
      "can't find",
      "no evidence",
      "missing evidence",
      "more evidence",
      "stronger evidence",
      "technical document",
      "technical documentation",
      "documentation",
      "public url",
      "what should i upload",
      "what should i provide",
      "find technical",
      "find stronger",
    ])
  ) {
    const suggestion = makeEvidenceGapSuggestion(rowIndex);
    addMessage(
      "assistant",
      "I can look for a stronger basis for Element " +
        (rowIndex + 1) +
        ", but I can’t responsibly strengthen it from the current source set yet.",
      {
        muted:
          "The missing piece is technical disclosure of how the product implements the claimed behavior. Add a relevant technical document or public product URL and I can reassess it.",
        suggestion,
      },
    );
    return;
  }

  if (
    hasAny(lower, [
      "too long",
      "too wordy",
      "shorten",
      "shorter",
      "concise",
      "summarize",
      "tighten the wording",
      "make this brief",
    ])
  ) {
    const asksForSpecificDraft = hasAny(lower, [
      "reasoning",
      "wording",
      "chart",
      "claim",
      "rewrite",
      "rewrite this",
      "make it concise",
    ]);
    if (!asksForSpecificDraft && lower.split(/\s+/).length <= 5) {
      addMessage(
        "assistant",
        "Happy to shorten it. Do you mean the chart reasoning, the source summary, or my last explanation? I’ll keep the evidentiary meaning unchanged.",
      );
      return;
    }
    const suggestion = makeConciseSuggestion(rowIndex);
    addMessage(
      "assistant",
      "I can tighten the chart reasoning for Element " +
        (rowIndex + 1) +
        " without changing its evidentiary position. Review this concise draft before applying it.",
      { suggestion },
    );
    return;
  }

  if (
    hasAny(lower, [
      "show source",
      "show evidence",
      "show me evidence",
      "what does the source",
      "what does this source",
      "what does the current source",
      "disclose",
      "quote",
      "citation",
      "cite",
      "what supports",
      "supporting source",
      "evidence say",
    ])
  ) {
    answerSource(rowIndex);
    return;
  }

  if (
    hasAny(lower, [
      "why review",
      "why needs review",
      "need review",
      "needs review",
      "why is this a gap",
      "unsupported",
      "not supported",
      "confidence",
      "what is the status",
      "is this supported",
    ])
  ) {
    answerWhyReview(rowIndex);
    return;
  }

  if (
    hasAny(lower, [
      "strengthen",
      "refine",
      "improve",
      "add more detail",
      "technical detail",
      "fix the reasoning",
      "make the reasoning",
      "rewrite the reasoning",
      "draft",
    ])
  ) {
    const suggestion = makeSuggestion(rowIndex, value);
    addMessage(
      "assistant",
      "I can draft a source-grounded refinement for Element " +
        (rowIndex + 1) +
        ". It will keep disclosed facts separate from inference; review the proposal below before applying it.",
      { suggestion },
    );
    return;
  }

  if (
    hasAny(lower, [
      "what are we reviewing",
      "what is this matter",
      "what is this chart",
      "where are we",
    ])
  ) {
    addMessage(
      "assistant",
      "We’re reviewing Claim 1 of US123456 against Acme Thermostat. I’m currently focused on Element " +
        (rowIndex + 1) +
        ".",
      {
        muted:
          "The working source is " +
          state.rows[rowIndex].source +
          ". Ask me to show what it discloses, explain the status, or draft a refinement.",
      },
    );
    return;
  }

  addMessage(
    "assistant",
    "I can help with Element " +
      (rowIndex + 1) +
      ", but I want to keep the answer tied to the evidence. Ask me to show the source, explain why it needs review, identify a missing technical document, or draft a tighter reasoning statement.",
    {
      muted:
        "The chart will not change unless you explicitly accept a proposal.",
    },
  );
}

function acceptSuggestion(id, card) {
  const suggestion = state.pendingSuggestions.get(id);
  if (!suggestion || suggestion.evidenceGap) {
    showToast(
      "This suggestion needs another source before it can be accepted.",
    );
    return;
  }
  state.history.push({
    rows: structuredClone(state.rows),
    description: `Accepted refinement for Element ${suggestion.rowIndex + 1}`,
  });
  const row = state.rows[suggestion.rowIndex];
  row.reasoning = suggestion.text;
  row.status = "recent";
  row.confidence = "Source grounded";
  state.selectedRow = suggestion.rowIndex;
  state.lastChangedRow = suggestion.rowIndex;
  renderRows();
  card.classList.add("is-complete");
  card.querySelector(".suggestion-status").textContent = "Applied to chart";
  card.querySelectorAll("button").forEach((button) => {
    button.disabled = true;
  });
  addMessage(
    "assistant",
    "Applied the refinement to Element " +
      (suggestion.rowIndex + 1) +
      ". The updated reasoning is now visible in the chart. You can ask me to undo this change or refine it again.",
    {
      muted:
        "The change remains under analyst control until you export the draft.",
    },
  );
  updateHistoryLabel();
  showToast("Refinement applied to the claim chart");
}

function rejectSuggestion(id, card) {
  const suggestion = state.pendingSuggestions.get(id);
  if (!suggestion) return;
  card.classList.add("is-rejected");
  card.querySelector(".suggestion-status").textContent = "Rejected by analyst";
  card.querySelectorAll("button").forEach((button) => {
    button.disabled = true;
  });
  addMessage(
    "assistant",
    "Understood. I left the claim chart unchanged. You can provide a different source or ask me to take another angle.",
  );
  state.pendingSuggestions.delete(id);
}

function editSuggestion(id, card) {
  const suggestion = state.pendingSuggestions.get(id);
  if (!suggestion || card.querySelector("textarea")) return;
  const text = card.querySelector(".suggestion-text");
  const textarea = document.createElement("textarea");
  textarea.className = "suggestion-edit-textarea";
  textarea.value = suggestion.text;
  text.replaceWith(textarea);
  const editButton = card.querySelector('[data-suggestion-action="edit"]');
  editButton.textContent = "Save edit";
  editButton.dataset.suggestionAction = "save-edit";
}

function saveSuggestionEdit(id, card) {
  const suggestion = state.pendingSuggestions.get(id);
  const textarea = card.querySelector("textarea");
  if (!suggestion || !textarea) return;
  suggestion.text = textarea.value.trim() || suggestion.text;
  const text = document.createElement("div");
  text.className = "suggestion-text";
  text.textContent = suggestion.text;
  textarea.replaceWith(text);
  const editButton = card.querySelector('[data-suggestion-action="save-edit"]');
  editButton.textContent = "Edit";
  editButton.dataset.suggestionAction = "edit";
  showToast("Suggestion updated for review");
}

function undoLastChange() {
  const snapshot = state.history.pop();
  if (!snapshot) {
    addMessage(
      "assistant",
      "There is no applied refinement to undo yet. Review or accept a suggestion first.",
    );
    return;
  }
  state.rows = snapshot.rows;
  state.lastChangedRow = null;
  renderRows();
  updateHistoryLabel();
  addMessage(
    "assistant",
    "The last applied refinement has been undone. The claim chart is back to its previous state.",
  );
  showToast("Last refinement undone");
}

function updateHistoryLabel() {
  $("#history-label").textContent = state.history.length
    ? `${state.history.length} change${state.history.length === 1 ? "" : "s"}`
    : "No changes";
}

function renderHistory() {
  const list = $("#history-list");
  if (!state.history.length) {
    list.innerHTML = `<div class="empty-history">No applied changes yet.<br />Accepted refinements will appear here.</div>`;
    return;
  }
  list.innerHTML = [...state.history]
    .reverse()
    .map(
      (entry) => `
    <div class="history-entry"><span></span><p>${escapeHTML(entry.description)}<br /><small>${entry.kind === "correction" ? "Analyst correction" : "Analyst-approved change"}</small></p><time>${escapeHTML(nowLabel())}</time></div>
  `,
    )
    .join("");
}

function showToast(message) {
  const toast = $("#toast");
  toast.textContent = message;
  toast.classList.add("is-visible");
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(
    () => toast.classList.remove("is-visible"),
    2600,
  );
}

function exportChart() {
  const rows = state.rows
    .map(
      (row) => `
    <tr>
      <td><strong>${escapeHTML(row.title)}</strong></td>
      <td>${escapeHTML(row.feature)}<br /><em>${escapeHTML(row.featureDetail)}</em></td>
      <td>${escapeHTML(row.reasoning)}<br /><small>Status: ${escapeHTML(row.status === "review" ? "Needs review" : "Supported")} · Source: ${escapeHTML(row.source)}</small></td>
    </tr>
  `,
    )
    .join("");
  const html = `<!doctype html><html><head><meta charset="utf-8"><title>US123456 claim chart</title><style>body{font-family:Arial,sans-serif;color:#1d2939;margin:36px}h1{font-size:22px}p{color:#667085;font-size:12px}table{width:100%;border-collapse:collapse;margin-top:24px}th,td{border:1px solid #cfd7e3;padding:10px;vertical-align:top;text-align:left;font-size:11px;line-height:1.45}th{background:#eef2f7;font-size:10px;text-transform:uppercase;letter-spacing:.06em}em{color:#667085}small{color:#667085}</style></head><body><h1>US123456 vs. Acme Corp Thermostat</h1><p>Refined claim chart exported from iLumos · ${escapeHTML(new Date().toLocaleString())}</p><table><thead><tr><th>Patent claim element</th><th>Accused product feature</th><th>AI reasoning and evidence</th></tr></thead><tbody>${rows}</tbody></table></body></html>`;
  const blob = new Blob([html], { type: "application/msword" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "iLumos-refined-claim-chart.doc";
  link.click();
  URL.revokeObjectURL(url);
  showToast("Word-compatible claim chart downloaded");
}

function handleFileUpload(event) {
  const files = [...event.target.files];
  files.forEach((file) => {
    const extension = file.name.split(".").pop()?.toUpperCase() || "DOC";
    state.documents.push({
      name: file.name,
      meta: `Uploaded document · ${Math.max(1, Math.round(file.size / 1024))} KB`,
      icon: extension.slice(0, 3),
      isNew: true,
    });
  });
  renderDocuments();
  if (files.length)
    showToast(
      `${files.length} document${files.length === 1 ? "" : "s"} added to this matter`,
    );
  event.target.value = "";
}

function resetDemo() {
  state.rows = structuredClone(initialRows);
  state.history = [];
  state.pendingSuggestions.clear();
  state.lastChangedRow = null;
  state.selectedRow = 2;
  renderRows();
  updateHistoryLabel();
  showToast("Demo chart reset");
}

function focusWorkspaceSection(targetId) {
  $$(".workbench-nav a").forEach((link) => {
    link.classList.toggle(
      "is-active",
      link.getAttribute("href") === "#" + targetId,
    );
  });

  if (targetId === "claim-map") {
    const stage = $("#claim-map");
    stage.scrollTo({ top: 0, behavior: "smooth" });
    stage.classList.add("section-focus-flash");
    window.setTimeout(() => stage.classList.remove("section-focus-flash"), 720);
    return;
  }

  if (targetId === "sources-title") {
    const sourceTitle = $("#sources-title");
    const sourceSection = sourceTitle.closest(".source-section");
    sourceTitle.scrollIntoView({ behavior: "smooth", block: "start" });
    sourceSection?.classList.add("section-focus-flash");
    window.setTimeout(
      () => sourceSection?.classList.remove("section-focus-flash"),
      720,
    );
    return;
  }

  if (targetId === "chat-title") {
    const chatInput = $("#chat-input");
    chatInput.focus({ preventScroll: true });
    const dock = chatInput.closest(".review-dock");
    dock.classList.add("section-focus-flash");
    window.setTimeout(() => dock.classList.remove("section-focus-flash"), 720);
  }
}

document.addEventListener("click", (event) => {
  const navLink = event.target.closest(".workbench-nav a");
  if (navLink) {
    event.preventDefault();
    focusWorkspaceSection(navLink.getAttribute("href").slice(1));
    return;
  }

  const rowButton = event.target.closest("[data-select-row]");
  if (rowButton) {
    selectRow(rowButton.dataset.selectRow);
    return;
  }

  const promptButton = event.target.closest("[data-prompt]");
  if (promptButton) {
    $("#chat-input").value = promptButton.dataset.prompt;
    $("#chat-input").focus();
    return;
  }

  const suggestionButton = event.target.closest("[data-suggestion-action]");
  if (suggestionButton) {
    const id = suggestionButton.dataset.suggestionId;
    const card = suggestionButton.closest(".suggestion-card");
    const action = suggestionButton.dataset.suggestionAction;
    if (action === "accept") acceptSuggestion(id, card);
    if (action === "reject") rejectSuggestion(id, card);
    if (action === "edit") editSuggestion(id, card);
    if (action === "save-edit") saveSuggestionEdit(id, card);
    if (action === "upload") $("#file-upload").click();
    return;
  }
});

$("#chat-form").addEventListener("submit", (event) => {
  event.preventDefault();
  submitPrompt($("#chat-input").value);
});

$("#chat-input").addEventListener("keydown", (event) => {
  if (event.key === "Enter" && !event.shiftKey) {
    event.preventDefault();
    $("#chat-form").requestSubmit();
  }
});

$("#file-upload").addEventListener("change", handleFileUpload);
$("#save-instructions").addEventListener("click", () => {
  state.instructions = $("#system-prompt").value.trim();
  localStorage.setItem("ilumos-project-instructions", state.instructions);
  $("#saved-state").textContent = "Saved just now";
  showToast("Project instructions saved");
  window.setTimeout(() => {
    $("#saved-state").textContent = "Saved";
  }, 2400);
});
$("#export-button").addEventListener("click", exportChart);
$("#refresh-chart").addEventListener("click", resetDemo);
$("#share-button").addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(window.location.href);
    showToast("Demo link copied to clipboard");
  } catch {
    showToast("Copy this page URL to share the demo");
  }
});
$("#clear-context").addEventListener("click", () => {
  state.selectedRow = null;
  renderRows();
  $("#chat-context").textContent = "All elements";
  $("#stat-note-text").textContent = "Select an element to focus the chat";
});
$("#open-history").addEventListener("click", () => {
  renderHistory();
  $("#history-modal").hidden = false;
});
$("#close-history").addEventListener("click", () => {
  $("#history-modal").hidden = true;
});
$("#history-modal").addEventListener("click", (event) => {
  if (event.target === $("#history-modal")) $("#history-modal").hidden = true;
});
document.addEventListener("keydown", (event) => {
  const row = event.target.closest("[data-select-row]");
  if (row && (event.key === "Enter" || event.key === " ")) {
    event.preventDefault();
    selectRow(row.dataset.selectRow);
    return;
  }
  if (event.key === "Escape") $("#history-modal").hidden = true;
});

$("#system-prompt").value = state.instructions;
renderDocuments();
renderRows();
updateHistoryLabel();
