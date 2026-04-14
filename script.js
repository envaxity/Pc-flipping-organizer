const STORAGE_KEY = "flipforge-dashboard-v1";

const defaultState = {
  builds: [
    {
      id: crypto.randomUUID(),
      name: "1080p Budget Beast",
      spec: "Ryzen 5 3600 / RTX 2060 / 16GB DDR4 / 1TB NVMe",
      stage: "Ready To List",
      cost: 430,
      listPrice: 650,
      salePrice: 0,
      notes: "Fresh Windows install, stress tested, needs listing photos.",
    },
    {
      id: crypto.randomUUID(),
      name: "White RGB Midrange",
      spec: "i5-12400F / RX 6700 XT / 32GB DDR4 / 1TB SSD",
      stage: "Testing",
      cost: 710,
      listPrice: 980,
      salePrice: 0,
      notes: "Watching hotspot temp after repaste. Cosmetics already cleaned.",
    },
    {
      id: crypto.randomUUID(),
      name: "Streaming Starter",
      spec: "Ryzen 7 3700X / RTX 3060 / 32GB DDR4 / 2TB SSD",
      stage: "Sold",
      cost: 590,
      listPrice: 825,
      salePrice: 790,
      notes: "Local pickup completed. Follow up for referral request.",
    },
  ],
  parts: [
    {
      id: crypto.randomUUID(),
      name: "RTX 3070 Founders Edition",
      category: "GPU",
      cost: 250,
      resale: 320,
      status: "Available",
      notes: "Tested clean. Box included.",
    },
    {
      id: crypto.randomUUID(),
      name: "Corsair RM750x",
      category: "PSU",
      cost: 65,
      resale: 95,
      status: "Reserved",
      notes: "Reserved for next AM5 build.",
    },
    {
      id: crypto.randomUUID(),
      name: "B550 Aorus Elite",
      category: "Motherboard",
      cost: 70,
      resale: 110,
      status: "Needs testing",
      notes: "Boots to BIOS, needs longer memory stability test.",
    },
  ],
  leads: [
    {
      id: crypto.randomUUID(),
      buyer: "Marcus - Facebook Marketplace",
      system: "White RGB Midrange",
      offer: 900,
      status: "Negotiating",
      notes: "Asked if monitor bundle is possible.",
    },
    {
      id: crypto.randomUUID(),
      buyer: "Tina - OfferUp",
      system: "1080p Budget Beast",
      offer: 620,
      status: "Ready to close",
      notes: "Free after 6pm tomorrow. Wants FPS screenshots.",
    },
  ],
};

const formBlueprints = {
  build: [
    { name: "name", label: "Build name", type: "text", required: true },
    { name: "spec", label: "Specs", type: "text", required: true },
    { name: "stage", label: "Stage", type: "select", required: true, options: ["Sourcing", "Needs Parts", "Testing", "Ready To List", "Listed", "Sold"] },
    { name: "cost", label: "Total cost", type: "number", required: true, step: "0.01" },
    { name: "listPrice", label: "List price", type: "number", required: true, step: "0.01" },
    { name: "salePrice", label: "Sale price", type: "number", required: false, step: "0.01" },
    { name: "notes", label: "Notes", type: "textarea", full: true, required: false },
  ],
  part: [
    { name: "name", label: "Part name", type: "text", required: true },
    { name: "category", label: "Category", type: "text", required: true },
    { name: "cost", label: "Buy cost", type: "number", required: true, step: "0.01" },
    { name: "resale", label: "Expected resale", type: "number", required: true, step: "0.01" },
    { name: "status", label: "Status", type: "select", required: true, options: ["Available", "Reserved", "Installed", "Needs testing"] },
    { name: "notes", label: "Notes", type: "textarea", full: true, required: false },
  ],
  lead: [
    { name: "buyer", label: "Buyer or platform", type: "text", required: true },
    { name: "system", label: "Interested in", type: "text", required: true },
    { name: "offer", label: "Current offer", type: "number", required: true, step: "0.01" },
    { name: "status", label: "Status", type: "select", required: true, options: ["New", "Negotiating", "Ready to close", "Ghosted", "Closed"] },
    { name: "notes", label: "Notes", type: "textarea", full: true, required: false },
  ],
};

const state = loadState();

const buildBoard = document.getElementById("buildBoard");
const partsList = document.getElementById("partsList");
const leadsList = document.getElementById("leadsList");
const buildTemplate = document.getElementById("buildTemplate");
const listTemplate = document.getElementById("listTemplate");
const entryDialog = document.getElementById("entryDialog");
const entryForm = document.getElementById("entryForm");
const formFields = document.getElementById("formFields");
const dialogTag = document.getElementById("dialogTag");
const dialogTitle = document.getElementById("dialogTitle");

let currentFormMode = { type: "build", id: null };

document.getElementById("addBuildButton").addEventListener("click", () => openEntryDialog("build"));
document.getElementById("addPartButton").addEventListener("click", () => openEntryDialog("part"));
document.getElementById("addLeadButton").addEventListener("click", () => openEntryDialog("lead"));

document.querySelectorAll("[data-jump]").forEach((button) => {
  button.addEventListener("click", () => {
    document.querySelector(button.dataset.jump)?.scrollIntoView({ behavior: "smooth", block: "start" });
  });
});

entryForm.addEventListener("submit", (event) => {
  event.preventDefault();
  saveEntry();
});

entryDialog.addEventListener("close", () => {
  entryForm.reset();
  formFields.innerHTML = "";
});

render();

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return structuredClone(defaultState);
    }
    return { ...structuredClone(defaultState), ...JSON.parse(raw) };
  } catch (error) {
    console.warn("Could not load saved state. Using defaults instead.", error);
    return structuredClone(defaultState);
  }
}

function persistState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function render() {
  renderBuilds();
  renderParts();
  renderLeads();
  renderSummary();
  persistState();
}

function renderBuilds() {
  buildBoard.innerHTML = "";

  if (!state.builds.length) {
    buildBoard.appendChild(createEmptyState("No builds yet. Add the next rig you want to source, repair, or flip."));
    return;
  }

  state.builds.forEach((build) => {
    const node = buildTemplate.content.firstElementChild.cloneNode(true);
    node.querySelector(".build-card__name").textContent = build.name;
    node.querySelector(".build-card__spec").textContent = build.spec;
    const stagePill = node.querySelector(".build-card__stage");
    stagePill.textContent = build.stage;
    stagePill.dataset.stage = build.stage;

    const metrics = node.querySelector(".build-card__metrics");
    [
      ["Cost", formatCurrency(build.cost)],
      ["List", formatCurrency(build.listPrice)],
      ["Sale", formatCurrency(build.salePrice || 0)],
      ["Profit", formatCurrency(calculateBuildProfit(build))],
    ].forEach(([label, value]) => {
      const row = document.createElement("div");
      row.className = "metric-row";
      row.innerHTML = `<span>${label}</span><strong>${value}</strong>`;
      metrics.appendChild(row);
    });

    node.querySelector(".build-card__notes").textContent = build.notes || "No notes yet.";
    node.querySelector(".action-edit").addEventListener("click", () => openEntryDialog("build", build.id));
    node.querySelector(".action-delete").addEventListener("click", () => removeEntry("builds", build.id));
    buildBoard.appendChild(node);
  });
}

function renderParts() {
  partsList.innerHTML = "";

  if (!state.parts.length) {
    partsList.appendChild(createEmptyState("No parts logged. Add incoming hardware so you can see tied-up cash and resale value."));
    return;
  }

  state.parts.forEach((part) => {
    const node = listTemplate.content.firstElementChild.cloneNode(true);
    node.querySelector(".list-card__content").innerHTML = `
      <strong>${part.name}</strong>
      <p>${part.category} · ${part.status}</p>
      <small>Cost ${formatCurrency(part.cost)} · Resale ${formatCurrency(part.resale)}</small>
      <p>${part.notes || "No notes yet."}</p>
    `;
    node.querySelector(".action-edit").addEventListener("click", () => openEntryDialog("part", part.id));
    node.querySelector(".action-delete").addEventListener("click", () => removeEntry("parts", part.id));
    partsList.appendChild(node);
  });
}

function renderLeads() {
  leadsList.innerHTML = "";

  if (!state.leads.length) {
    leadsList.appendChild(createEmptyState("No buyer leads yet. Save names and offers so warm conversations do not slip away."));
    return;
  }

  state.leads.forEach((lead) => {
    const node = listTemplate.content.firstElementChild.cloneNode(true);
    node.querySelector(".list-card__content").innerHTML = `
      <strong>${lead.buyer}</strong>
      <p>${lead.system} · ${lead.status}</p>
      <small>Offer ${formatCurrency(lead.offer)}</small>
      <p>${lead.notes || "No notes yet."}</p>
    `;
    node.querySelector(".action-edit").addEventListener("click", () => openEntryDialog("lead", lead.id));
    node.querySelector(".action-delete").addEventListener("click", () => removeEntry("leads", lead.id));
    leadsList.appendChild(node);
  });
}

function renderSummary() {
  const cashInvested = state.parts.reduce((sum, part) => sum + Number(part.cost || 0), 0)
    + state.builds.reduce((sum, build) => sum + Number(build.cost || 0), 0);
  const inventoryValue = state.parts.reduce((sum, part) => sum + Number(part.resale || 0), 0);
  const margins = state.builds
    .filter((build) => Number(build.listPrice) > 0)
    .map((build) => ((calculateBuildProfit(build) / Number(build.listPrice)) * 100));
  const averageMargin = margins.length
    ? `${Math.round(margins.reduce((sum, margin) => sum + margin, 0) / margins.length)}%`
    : "0%";
  const weeklyProfit = state.builds.reduce((sum, build) => sum + Math.max(calculateBuildProfit(build), 0), 0);
  const activeDeals = state.leads.filter((lead) => lead.status !== "Closed" && lead.status !== "Ghosted").length;
  const readyToList = state.builds.filter((build) => build.stage === "Ready To List" || build.stage === "Listed").length;
  const stageCounts = {
    needsParts: state.builds.filter((build) => build.stage === "Needs Parts").length,
    testing: state.builds.filter((build) => build.stage === "Testing").length,
    sold: state.builds.filter((build) => build.stage === "Sold").length,
  };

  document.getElementById("cashInvested").textContent = formatCurrency(cashInvested);
  document.getElementById("inventoryValue").textContent = formatCurrency(inventoryValue);
  document.getElementById("averageMargin").textContent = averageMargin;
  document.getElementById("weeklyProfit").textContent = formatCurrency(weeklyProfit);
  document.getElementById("activeDeals").textContent = String(activeDeals);
  document.getElementById("readyToList").textContent = String(readyToList);
  document.getElementById("needsPartsCount").textContent = String(stageCounts.needsParts);
  document.getElementById("testingCount").textContent = String(stageCounts.testing);
  document.getElementById("soldCount").textContent = String(stageCounts.sold);
}

function openEntryDialog(type, id = null) {
  currentFormMode = { type, id };
  const titleMap = {
    build: ["Build entry", id ? "Edit build" : "Add build"],
    part: ["Inventory entry", id ? "Edit part" : "Add part"],
    lead: ["Lead entry", id ? "Edit lead" : "Add lead"],
  };
  const [tag, title] = titleMap[type];
  dialogTag.textContent = tag;
  dialogTitle.textContent = title;
  formFields.innerHTML = "";

  const existing = id ? findEntry(type, id) : {};
  formBlueprints[type].forEach((field) => {
    formFields.appendChild(createField(field, existing[field.name]));
  });

  entryDialog.showModal();
}

function createField(field, value = "") {
  const wrapper = document.createElement("div");
  wrapper.className = `field${field.full ? " field--full" : ""}`;

  const label = document.createElement("label");
  label.textContent = field.label;
  label.htmlFor = field.name;

  let input;
  if (field.type === "textarea") {
    input = document.createElement("textarea");
  } else if (field.type === "select") {
    input = document.createElement("select");
    field.options.forEach((option) => {
      const optionNode = document.createElement("option");
      optionNode.value = option;
      optionNode.textContent = option;
      input.appendChild(optionNode);
    });
  } else {
    input = document.createElement("input");
    input.type = field.type;
    if (field.step) {
      input.step = field.step;
    }
  }

  input.id = field.name;
  input.name = field.name;
  input.required = Boolean(field.required);
  input.value = value ?? "";

  wrapper.append(label, input);
  return wrapper;
}

function saveEntry() {
  const formData = new FormData(entryForm);
  const payload = Object.fromEntries(formData.entries());

  ["cost", "listPrice", "salePrice", "resale", "offer"].forEach((key) => {
    if (key in payload) {
      payload[key] = Number(payload[key] || 0);
    }
  });

  const collectionName = `${currentFormMode.type}s`;
  const collection = state[collectionName];

  if (currentFormMode.id) {
    const index = collection.findIndex((item) => item.id === currentFormMode.id);
    collection[index] = { ...collection[index], ...payload };
  } else {
    collection.unshift({ id: crypto.randomUUID(), ...payload });
  }

  entryDialog.close();
  render();
}

function removeEntry(collectionName, id) {
  state[collectionName] = state[collectionName].filter((item) => item.id !== id);
  render();
}

function findEntry(type, id) {
  return state[`${type}s`].find((item) => item.id === id);
}

function createEmptyState(message) {
  const node = document.createElement("div");
  node.className = "empty-state";
  node.textContent = message;
  return node;
}

function calculateBuildProfit(build) {
  const saleTarget = Number(build.salePrice) > 0 ? Number(build.salePrice) : Number(build.listPrice);
  return saleTarget - Number(build.cost || 0);
}

function formatCurrency(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}
