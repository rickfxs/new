const STORAGE_KEY = "bullet-journal-entries";

const form = document.querySelector("#entry-form");
const list = document.querySelector("#entry-list");
const template = document.querySelector("#entry-template");
const filterButtons = document.querySelectorAll("[data-filter]");
const clearDoneButton = document.querySelector("#clear-done");
const entryCount = document.querySelector("#entry-count");
const doneCount = document.querySelector("#done-count");

let entries = loadEntries();
let activeFilter = "all";

function loadEntries() {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) {
    return [];
  }

  try {
    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.warn("Konnte gespeicherte Einträge nicht laden.", error);
    return [];
  }
}

function saveEntries() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

function createEntry(data) {
  return {
    id: crypto.randomUUID(),
    title: data.title.trim(),
    details: data.details.trim(),
    category: data.category,
    priority: data.priority,
    done: false,
    createdAt: new Date().toISOString(),
  };
}

function renderEntries() {
  list.innerHTML = "";

  const filteredEntries = entries.filter((entry) => {
    if (activeFilter === "done") return entry.done;
    if (activeFilter === "open") return !entry.done;
    return true;
  });

  if (filteredEntries.length === 0) {
    const empty = document.createElement("li");
    empty.className = "entry entry--empty";
    empty.textContent =
      activeFilter === "done"
        ? "Noch keine erledigten Einträge."
        : "Noch keine Einträge. Starte mit deinem ersten Fokus!";
    list.append(empty);
    updateSummary();
    return;
  }

  filteredEntries
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .forEach((entry) => {
      const node = template.content.cloneNode(true);
      const item = node.querySelector(".entry");
      item.dataset.id = entry.id;
      if (entry.done) {
        item.classList.add("entry--done");
      }

      node.querySelector(".entry__title").textContent = entry.title;
      node.querySelector(".entry__details").textContent =
        entry.details || "Ohne zusätzliche Details.";
      node.querySelector(".entry__category").textContent = entry.category;
      node.querySelector(".entry__priority").textContent = entry.priority;

      list.append(node);
    });

  updateSummary();
}

function updateSummary() {
  entryCount.textContent = entries.length;
  doneCount.textContent = entries.filter((entry) => entry.done).length;
}

function handleSubmit(event) {
  event.preventDefault();
  const formData = new FormData(form);
  const title = formData.get("title");

  if (!title || !title.trim()) {
    return;
  }

  const entry = createEntry({
    title,
    details: formData.get("details") || "",
    category: formData.get("category"),
    priority: formData.get("priority"),
  });

  entries = [entry, ...entries];
  saveEntries();
  form.reset();
  renderEntries();
}

function handleListClick(event) {
  const item = event.target.closest(".entry");
  if (!item) return;

  const entryId = item.dataset.id;
  if (!entryId) return;

  if (event.target.classList.contains("entry__delete")) {
    entries = entries.filter((entry) => entry.id !== entryId);
    saveEntries();
    renderEntries();
    return;
  }

  if (event.target.classList.contains("entry__toggle")) {
    entries = entries.map((entry) =>
      entry.id === entryId ? { ...entry, done: !entry.done } : entry
    );
    saveEntries();
    renderEntries();
  }
}

function handleFilterClick(event) {
  const button = event.target.closest("[data-filter]");
  if (!button) return;

  activeFilter = button.dataset.filter;
  filterButtons.forEach((filterButton) => {
    filterButton.setAttribute(
      "aria-pressed",
      filterButton === button ? "true" : "false"
    );
  });
  renderEntries();
}

function handleClearDone() {
  entries = entries.filter((entry) => !entry.done);
  saveEntries();
  renderEntries();
}

form.addEventListener("submit", handleSubmit);
list.addEventListener("click", handleListClick);
filterButtons.forEach((button) => {
  button.addEventListener("click", handleFilterClick);
});
clearDoneButton.addEventListener("click", handleClearDone);

renderEntries();
