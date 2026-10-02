const API_BASE_URL = "http://localhost:4000/api";
let fikas = [];
let currentFika;
let interests = [];
let conversationStarter;
let currentUser;
let authMode = "login";
let selectedType = "coffee";
let activeFilters = { type: "all", time: "anytime" };

const typeIcons = { coffee: "☕", food: "🍜", walk: "🚶", conversation: "💬", chat: "💬", gaming: "🎮", study: "📚", networking: "🤝", creative: "🎨", sports: "⚽", music: "🎵" };
const typeArt = { coffee: "peach", food: "yellow", walk: "green", conversation: "lavender", chat: "lavender", gaming: "green", study: "lavender", networking: "yellow", creative: "peach", sports: "green", music: "yellow" };

async function apiRequest(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, { credentials: "include", ...options, headers: { "Content-Type": "application/json", ...(options.headers || {}) } });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.message || "The API request failed.");
  return payload.data;
}

function updateAuthUi() {
  const name = currentUser?.name || "there";
  const initials = currentUser ? currentUser.name.split(" ").map(part => part[0]).join("").slice(0, 2).toUpperCase() : "?";
  $("#auth-button").textContent = initials;
  $("#hero-name").textContent = name.split(" ")[0];
  $("#profile-avatar").textContent = initials;
  $("#profile-name").innerHTML = currentUser ? `${currentUser.name} <span>✦</span>` : "Your profile <span>✦</span>";
  $("#profile-handle").textContent = currentUser ? `@${currentUser.username}${currentUser.location ? ` · ${currentUser.location}` : ""}` : "Sign in to personalize your Fika space";
  $("#profile-bio").textContent = currentUser?.bio || "Meet thoughtful people around simple, real-world moments.";
  $("#auth-action").innerHTML = currentUser ? "Sign out <span>↗</span>" : "Sign in <span>↗</span>";
}

async function loadSession() {
  try { currentUser = await apiRequest("/auth/me"); } catch (_error) { currentUser = undefined; }
  updateAuthUi();
}

function setAuthMode(mode) {
  authMode = mode;
  const isRegistering = mode === "register";
  $("#auth-modal").classList.toggle("register-mode", isRegistering);
  $("#auth-eyebrow").textContent = isRegistering ? "MAKE ROOM FOR PEOPLE" : "WELCOME BACK";
  $("#auth-title").textContent = isRegistering ? "Create your Fika account" : "Sign in to Fika";
  $("#auth-subtitle").textContent = isRegistering ? "A few details, then you can start making plans." : "Keep your plans and connections in one place.";
  $("#auth-submit").innerHTML = isRegistering ? "Create account <span>→</span>" : "Sign in <span>→</span>";
  $("#auth-switch").textContent = isRegistering ? "Already have an account? Sign in" : "Create an account";
  $("#auth-password").autocomplete = isRegistering ? "new-password" : "current-password";
}

function openAuthModal() {
  setAuthMode(currentUser ? "login" : authMode);
  $("#auth-error").textContent = "";
  $("#join-modal").style.display = "none";
  $("#auth-modal").classList.add("show");
  $("#modal-backdrop").classList.add("show");
}

async function submitAuth(event) {
  event.preventDefault();
  const isRegistering = authMode === "register";
  const body = isRegistering
    ? { name: $("#auth-name").value.trim(), username: $("#auth-username").value.trim(), email: $("#auth-email").value.trim(), password: $("#auth-password").value }
    : { email: $("#auth-email").value.trim(), password: $("#auth-password").value };
  try {
    currentUser = await apiRequest(isRegistering ? "/auth/register" : "/auth/login", { method: "POST", body: JSON.stringify(body) });
    updateAuthUi();
    $("#auth-form").reset();
    toggleModal(false);
    loadPeople();
  } catch (error) {
    $("#auth-error").textContent = error.message;
  }
}

function formatFikaTime(date, startTime) {
  const fikaDate = new Date(`${date}T${startTime}:00`);
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  const dateLabel = fikaDate.toDateString() === today.toDateString() ? "Today" : fikaDate.toDateString() === tomorrow.toDateString() ? "Tomorrow" : fikaDate.toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" });
  return `${dateLabel} · ${fikaDate.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}`;
}

function normalizeFika(item) {
  const type = item.type.toLowerCase();
  return {
    id: item.id, title: item.title, host: item.host?.name || "Fika host", initials: (item.host?.name || "F").split(" ").map(part => part[0]).join("").slice(0, 2).toUpperCase(),
    type, icon: typeIcons[type] || "✦", time: formatFikaTime(item.date, item.startTime), location: item.locationName, distance: "Near you",
    attendees: item._count?.participants || item.participants?.length || 0, max: item.maxParticipants, tags: item.interests?.map(entry => entry.interest.name) || [],
    art: typeArt[type] || "peach", description: item.description, status: item.status
  };
}

async function loadFikas() {
  const result = await apiRequest("/fikas?limit=50&page=1");
  fikas = result.items.map(normalizeFika);
  renderFikas();
}

async function loadInterests() {
  interests = await apiRequest("/interests");
  $$(".interests-select .chip").forEach(button => {
    const interest = interests.find(item => item.name.toLowerCase() === button.textContent.trim().toLowerCase());
    if (interest) button.dataset.interestId = interest.id;
  });
}

async function loadPeople() {
  try {
    const suggestions = await apiRequest("/matching/suggestions");
    const people = suggestions.slice(0, 4).map(item => {
      const name = item.user.name;
      return [name, name.charAt(0).toUpperCase(), "green", item.sharedInterests.slice(0, 2).join(" · ") || "A new connection", `${item.compatibility}% connection match`];
    });
    $(".people-row").innerHTML = people.length ? people.map(([name, initial, shade, interestsText, common]) => `<article class="person-card"><span class="avatar ${shade}">${initial}</span><h3>${name}</h3><p>${interestsText}</p><p class="common-count">✦ ${common}</p></article>`).join("") : "<p>Sign in to see people who match your interests.</p>";
  } catch (_error) {
    $(".people-row").innerHTML = "<p>Sign in to see people who match your interests.</p>";
  }
}

async function loadStarter() {
  try {
    conversationStarter = await apiRequest("/conversation-starters/random");
    $(".starter-card h3").textContent = conversationStarter.prompt;
  } catch (_error) {
    $(".starter-card h3").textContent = "Start with a question and see where the conversation goes.";
  }
}

const $ = (selector, scope = document) => scope.querySelector(selector);
const $$ = (selector, scope = document) => [...scope.querySelectorAll(selector)];

function makeTags(tags) { return tags.map(tag => `<span>${tag}</span>`).join(""); }

function homeCard(fika) {
  return `<article class="fika-card">
    <div class="fika-card-art art-${fika.art}"><span class="fika-type-icon">${fika.icon}</span><span class="card-attendees">${fika.attendees}/${fika.max} going</span></div>
    <div class="fika-card-body"><h3>${fika.title}</h3><p class="hosted">Hosted by ${fika.host}</p>
      <div class="card-info"><span><b>⌖</b>${fika.distance}</span><span><b>◷</b>${fika.time.replace("Today · ", "")}</span></div>
      <div class="card-tags">${makeTags(fika.tags.slice(0, 3))}</div>
      <div class="card-footer"><span class="distance">${fika.location}</span><button class="view-link" data-fika-id="${fika.id}">View Fika →</button></div>
    </div></article>`;
}

function discoverCard(fika) {
  return `<article class="discover-card" data-type="${fika.type}" data-time="${fika.time.includes("Today") ? "today" : fika.time.includes("Tomorrow") ? "tomorrow" : "weekend"}">
    <div class="discover-art art-${fika.art}">${fika.icon}</div><div class="discover-main">
      <div class="discover-top"><div><h3>${fika.title}</h3><p class="discover-host">Hosted by ${fika.host}</p></div><button class="mini-join" data-fika-id="${fika.id}">View</button></div>
      <div class="discover-detail"><span><b>⌖</b>${fika.location}</span><span><b>◷</b>${fika.time}</span><span><b>♧</b>${fika.attendees}/${fika.max}</span></div>
      <div class="card-tags">${makeTags(fika.tags)}</div></div></article>`;
}

function renderFikas() {
  $(".home-fikas").innerHTML = fikas.slice(0, 3).map(homeCard).join("");
  renderDiscover();
}

function renderDiscover() {
  const query = $("#search-input")?.value.toLowerCase().trim() || "";
  const matches = fikas.filter(fika => {
    const haystack = `${fika.title} ${fika.host} ${fika.location} ${fika.tags.join(" ")}`.toLowerCase();
    const typeMatch = activeFilters.type === "all" || fika.type === activeFilters.type || (activeFilters.type === "coffee" && fika.tags.includes("Coffee"));
    const timeMatch = activeFilters.time === "anytime" || (activeFilters.time === "today" && fika.time.includes("Today")) || (activeFilters.time === "tomorrow" && fika.time.includes("Tomorrow")) || (activeFilters.time === "weekend" && /Saturday|Sunday/.test(fika.time));
    return haystack.includes(query) && typeMatch && timeMatch;
  });
  $(".discover-list").innerHTML = matches.length ? matches.map(discoverCard).join("") : `<div class="empty-messages" style="display:block;grid-column:1/-1"><div>☕</div><h3>Nothing quite fits yet</h3><p>Try changing a filter, or create the Fika you want to find.</p><button class="button button-dark" data-nav="create">Create a Fika</button></div>`;
  $("#discover-results").textContent = `${matches.length} Fika${matches.length === 1 ? "" : "s"} near you`;
}

function showScreen(screen) {
  $$(".screen").forEach(node => node.classList.toggle("active", node.dataset.screen === screen));
  $$(".nav-item").forEach(node => node.classList.toggle("active", node.dataset.nav === screen));
  $("#notification-popover").classList.remove("show");
  $("#modal-backdrop").classList.remove("show");
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function updateDetail(fika) {
  currentFika = fika;
  $("#detail-title").textContent = fika.title;
  $("#detail-time").textContent = `${fika.time} · 1 hour`;
  $("#detail-description").textContent = fika.description;
  $("#detail-location").textContent = fika.location;
  $("#host-name").textContent = fika.host;
  $("#host-avatar").textContent = fika.initials;
  $("#detail-type").textContent = `${fika.icon} ${fika.type === "chat" ? "Conversation" : fika.type[0].toUpperCase() + fika.type.slice(1)}`;
  $("#participant-count").textContent = `${fika.attendees} of ${fika.max} people`;
  $("#detail-spots").textContent = `${fika.max - fika.attendees} spot${fika.max - fika.attendees === 1 ? "" : "s"} left`;
  $("#detail-tags").innerHTML = makeTags(fika.tags);
  $("#joined-fika-title").textContent = fika.title;
  const detailHero = $(".detail-hero");
  detailHero.style.background = fika.art === "green" ? "#cfddc0" : fika.art === "yellow" ? "#f7d982" : fika.art === "lavender" ? "#ded8ef" : "#f3d5bf";
  $(".detail-pattern span").textContent = fika.icon;
}

function openDetail(id) {
  const fika = fikas.find(item => String(item.id) === String(id));
  if (!fika) return;
  updateDetail(fika);
  showScreen("detail");
}

async function joinCurrentFika() {
  if (!currentFika) return;
  try {
    const result = await apiRequest(`/fikas/${currentFika.id}/join`, { method: "POST" });
    currentFika = normalizeFika(result.fika);
    await loadFikas();
    updateDetail(currentFika);
    toggleModal(true);
  } catch (error) {
    alert(error.message);
  }
}

function toggleModal(show) {
  if (!show) {
    $("#join-modal").style.display = "";
    $("#auth-modal").classList.remove("show");
  }
  $("#modal-backdrop").classList.toggle("show", show);
}

function addChatMessage(message) {
  const clean = message.trim();
  if (!clean) return;
  const now = new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  $(".chat-messages").insertAdjacentHTML("beforeend", `<div class="chat-message mine"><div><p>${clean.replace(/</g, "&lt;")}</p><small>${now}</small></div></div>`);
  $(".chat-messages").scrollTop = $(".chat-messages").scrollHeight;
}

document.addEventListener("click", event => {
  if (event.target.closest("#auth-button, #auth-action")) {
    if (currentUser && event.target.closest("#auth-action")) {
      apiRequest("/auth/logout", { method: "POST" }).then(() => { currentUser = undefined; updateAuthUi(); loadPeople(); showScreen("home"); }).catch(error => alert(error.message));
    } else if (currentUser && event.target.closest("#auth-button")) {
      showScreen("profile");
    } else {
      openAuthModal();
    }
    return;
  }
  if (event.target.closest("#auth-switch")) { setAuthMode(authMode === "login" ? "register" : "login"); return; }
  const nav = event.target.closest("[data-nav]");
  if (nav) { showScreen(nav.dataset.nav); return; }

  const fikaButton = event.target.closest("[data-fika-id]");
  if (fikaButton) { openDetail(fikaButton.dataset.fikaId); return; }

  if (event.target.closest(".notification-trigger")) {
    $("#notification-popover").classList.toggle("show");
    return;
  }

  if (event.target.closest("#filter-toggle")) {
    $("#filter-panel").classList.toggle("show");
    return;
  }

  const filter = event.target.closest("[data-filter]");
  if (filter) {
    const group = filter.closest("[data-filter-group]").dataset.filterGroup;
    activeFilters[group] = filter.dataset.filter;
    $$("[data-filter-group='" + group + "'] .chip").forEach(button => button.classList.toggle("selected", button === filter));
    const count = [activeFilters.type !== "all", activeFilters.time !== "anytime"].filter(Boolean).length;
    $("#filter-count").textContent = count || "";
    $("#filter-count").style.display = count ? "grid" : "none";
    renderDiscover();
    return;
  }

  const activity = event.target.closest(".activity-option");
  if (activity) {
    selectedType = activity.dataset.type;
    $$(".activity-option").forEach(button => button.classList.toggle("selected", button === activity));
    return;
  }

  const interest = event.target.closest(".interests-select .chip");
  if (interest) { interest.classList.toggle("selected"); return; }

  if (event.target.closest("#join-button")) { joinCurrentFika(); return; }
  if (event.target.closest(".modal-close")) { toggleModal(false); return; }
  if (event.target.closest("#open-room")) { showScreen("room"); return; }
  if (event.target === $("#modal-backdrop")) { toggleModal(false); }
});

$("#search-input").addEventListener("input", renderDiscover);
$("#auth-form").addEventListener("submit", submitAuth);

$("#create-form").addEventListener("submit", async event => {
  event.preventDefault();
  const title = $("#fika-title").value.trim() || "A lovely new Fika";
  const timeValue = $("#fika-time").value || "17:00";
  const date = $("#fika-date").value || new Date().toISOString().slice(0, 10);
  const selectedInterestIds = $$(".interests-select .chip.selected").map(button => button.dataset.interestId).filter(Boolean);
  try {
    const created = await apiRequest("/fikas", { method: "POST", body: JSON.stringify({
      title, description: $("#fika-description").value.trim() || "A simple invitation to pause, meet new people and have a good conversation.",
      type: selectedType === "chat" ? "CONVERSATION" : selectedType.toUpperCase(), date, startTime: timeValue, duration: 60,
      locationName: $("#fika-location").value.trim() || "Accra", maxParticipants: Number($("#fika-size").value.match(/\d+/)[0]), interestIds: selectedInterestIds
    }) });
    const newFika = normalizeFika(created);
    fikas.unshift(newFika);
    renderFikas();
    updateDetail(newFika);
    $("#create-form").reset();
    selectedType = "coffee";
    $$(".activity-option").forEach(button => button.classList.toggle("selected", button.dataset.type === "coffee"));
    showScreen("detail");
  } catch (error) {
    alert(error.message);
  }
});

$(".chat-compose").addEventListener("submit", event => {
  event.preventDefault();
  const input = $("#chat-input");
  addChatMessage(input.value);
  input.value = "";
});

$("#new-starter").addEventListener("click", loadStarter);

renderFikas();
loadFikas().catch(error => { $(".discover-list").innerHTML = `<p>Unable to load Fikas: ${error.message}</p>`; });
loadInterests().catch(() => {});
loadSession();
loadPeople();
loadStarter();
