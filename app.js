const fikas = [
  { id: 1, title: "Coffee & conversation", host: "Kojo A.", initials: "K", type: "coffee", icon: "☕", time: "Today · 4:00 PM", location: "Café Mondo, Osu", distance: "2.1 km", attendees: 3, max: 5, tags: ["Technology", "Conversation", "Startups"], art: "peach", description: "A relaxed afternoon coffee for people who enjoy discussing ideas, building things and meeting thoughtful new faces." },
  { id: 2, title: "A walk with no agenda", host: "Esi O.", initials: "E", type: "walk", icon: "🚶", time: "Today · 5:30 PM", location: "Legon Botanical Gardens", distance: "3.8 km", attendees: 2, max: 4, tags: ["Walk", "Books", "Life"], art: "green", description: "Let’s take a gentle walk, enjoy the late-afternoon air and see where the conversation takes us." },
  { id: 3, title: "The bookish brunch club", host: "Jemima K.", initials: "J", type: "food", icon: "🥐", time: "Tomorrow · 11:00 AM", location: "Bistro 22, Cantonments", distance: "4.2 km", attendees: 4, max: 6, tags: ["Books", "Food", "Stories"], art: "yellow", description: "Bring the book you can’t stop talking about and meet a few other curious readers over brunch." },
  { id: 4, title: "Build & brainstorm", host: "Nana B.", initials: "N", type: "study", icon: "💻", time: "Tomorrow · 3:00 PM", location: "Impact Hub, Osu", distance: "1.6 km", attendees: 2, max: 4, tags: ["Technology", "Design", "Work"], art: "lavender", description: "A friendly co-working Fika for builders with a small idea, a side project or just an open notebook." },
  { id: 5, title: "Level up together", host: "Kwesi M.", initials: "K", type: "gaming", icon: "🎮", time: "Saturday · 2:00 PM", location: "Game Lounge, East Legon", distance: "5.4 km", attendees: 3, max: 5, tags: ["Gaming", "Music", "Fun"], art: "green", description: "Casual multiplayer games and lovely company. Beginners and button-mashers both very welcome." },
  { id: 6, title: "Sketch, sip, repeat", host: "Ada A.", initials: "A", type: "creative", icon: "🎨", time: "Saturday · 4:00 PM", location: "Untamed Empire, Osu", distance: "2.7 km", attendees: 1, max: 4, tags: ["Art", "Creative", "Coffee"], art: "peach", description: "A low-key creative afternoon. Bring a sketchbook, your favourite pens, or simply an open mind." },
  { id: 7, title: "Real talk for founders", host: "Michael T.", initials: "M", type: "chat", icon: "💬", time: "Sunday · 3:30 PM", location: "Theia House, Airport", distance: "4.8 km", attendees: 4, max: 6, tags: ["Business", "Startups", "Career"], art: "yellow", description: "An honest, easy-going chat about making things happen, navigating uncertainty and staying human while doing it." },
  { id: 8, title: "Sunday study session", host: "Yaa D.", initials: "Y", type: "study", icon: "📚", time: "Sunday · 1:00 PM", location: "Balme Library, Legon", distance: "5.2 km", attendees: 3, max: 6, tags: ["Study", "Education", "Career"], art: "lavender", description: "Set a gentle goal, find your focus, and reward yourself with a conversation break midway through." }
];

let currentFika = fikas[0];
let selectedType = "coffee";
let activeFilters = { type: "all", time: "anytime" };

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

function renderPeople() {
  const people = [
    ["David", "D", "purple", "Technology · Gaming", "4 interests in common"],
    ["Nana", "N", "green", "Books · Photography", "3 interests in common"],
    ["Laila", "L", "peach", "Food · Travel", "3 interests in common"],
    ["Tomi", "T", "purple", "Design · Music", "2 interests in common"]
  ];
  $(".people-row").innerHTML = people.map(([name, initial, shade, interests, common]) => `<article class="person-card"><span class="avatar ${shade}">${initial}</span><h3>${name}</h3><p>${interests}</p><p class="common-count">✦ ${common}</p></article>`).join("");
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
  const fika = fikas.find(item => item.id === Number(id));
  if (!fika) return;
  updateDetail(fika);
  showScreen("detail");
}

function toggleModal(show) {
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

  if (event.target.closest("#join-button")) { toggleModal(true); return; }
  if (event.target.closest(".modal-close")) { toggleModal(false); return; }
  if (event.target.closest("#open-room")) { showScreen("room"); return; }
  if (event.target === $("#modal-backdrop")) { toggleModal(false); }
});

$("#search-input").addEventListener("input", renderDiscover);

$("#create-form").addEventListener("submit", event => {
  event.preventDefault();
  const title = $("#fika-title").value.trim() || "A lovely new Fika";
  const timeValue = $("#fika-time").value || "17:00";
  const [hours, minutes] = timeValue.split(":");
  const date = $("#fika-date").value;
  const time = `${date ? "Soon" : "Today"} · ${Number(hours) % 12 || 12}:${minutes} ${Number(hours) >= 12 ? "PM" : "AM"}`;
  const typeIcons = { coffee: "☕", food: "🍜", walk: "🚶", chat: "💬", gaming: "🎮", study: "📚" };
  const selectedTags = $$(".interests-select .chip.selected").map(button => button.textContent.trim());
  const newFika = { id: Date.now(), title, host: "Amara Mensah", initials: "AM", type: selectedType, icon: typeIcons[selectedType], time, location: $("#fika-location").value.trim() || "Accra", distance: "Near you", attendees: 1, max: Number($("#fika-size").value.match(/\d+/)[0]), tags: selectedTags.length ? selectedTags : ["Conversation"], art: "peach", description: $("#fika-description").value.trim() || "A simple invitation to pause, meet new people and have a good conversation." };
  fikas.unshift(newFika);
  renderFikas();
  updateDetail(newFika);
  $("#create-form").reset();
  selectedType = "coffee";
  $$(".activity-option").forEach(button => button.classList.toggle("selected", button.dataset.type === "coffee"));
  showScreen("detail");
});

$(".chat-compose").addEventListener("submit", event => {
  event.preventDefault();
  const input = $("#chat-input");
  addChatMessage(input.value);
  input.value = "";
});

$("#new-starter").addEventListener("click", () => {
  const prompts = [
    "What’s a tiny thing that made your week better?",
    "If you could borrow someone’s expertise for a day, what would it be?",
    "What place in Accra do you think deserves more love?",
    "What are you making more room for lately?"
  ];
  const heading = $(".starter-card h3");
  const current = heading.textContent;
  heading.textContent = prompts.find(prompt => prompt !== current) || prompts[0];
});

renderFikas();
renderPeople();
