const API_BASE = "https://api.tvmaze.com";

const showsView = document.querySelector("#shows-view");
const episodesView = document.querySelector("#episodes-view");

const showsRoot = document.querySelector("#shows-root");
const showSearch = document.querySelector("#show-search");
const showSelect = document.querySelector("#show-select");
const showStatus = document.querySelector("#show-status");

const backToShows = document.querySelector("#back-to-shows");
const episodeSelect = document.querySelector("#episode-select");
const siteSearch = document.querySelector("#site-search");
const searchCount = document.querySelector("#search-count");
const root = document.querySelector("#root");

const episodeTemplate = document.querySelector("#episode-template");

let allShows = [];
let currentShow = null;
let currentEpisodes = [];

let showsLoaded = false;
const episodeCache = new Map();

/* =========================
   HELPERS
========================= */

function stripHtml(html = "") {
  const div = document.createElement("div");
  div.innerHTML = html;
  return div.textContent || div.innerText || "";
}

function escapeHtml(text = "") {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

function getImage(image, fallback = "https://via.placeholder.com/300x450?text=No+Image") {
  return image?.medium || image?.original || fallback;
}


/* =========================
   API
========================= */

async function fetchJson(url) {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }

  return response.json();
}


/* =========================
   LOAD SHOWS
========================= */

async function loadShows() {
  showStatus.textContent = "Loading shows, please wait...";

  try {
    /*
      This URL is fetched only once during the visit.
    */
    if (!showsLoaded) {
      allShows = await fetchJson(`${API_BASE}/shows`);
      showsLoaded = true;
    }

    populateShowSelector(allShows);

    showStatus.textContent =
      `Displaying ${allShows.length}/${allShows.length} shows`;

    renderShows(allShows);
  } catch (error) {
    console.error(error);

    showStatus.textContent =
      "Unable to load shows. Please try again later.";

    showsRoot.innerHTML = `
      <p class="error-message">
        There was a problem loading the shows.
      </p>
    `;
  }
}


/* =========================
   SHOW SELECTOR
========================= */

function populateShowSelector(shows) {
  showSelect.innerHTML = `
    <option value="">All Shows</option>
  `;

  shows.forEach((show) => {
    const option = document.createElement("option");

    option.value = String(show.id);
    option.textContent = show.name;

    showSelect.appendChild(option);
  });
}


/* =========================
   FILTER SHOWS
========================= */

function filterShows() {
  const searchTerm = showSearch.value
    .trim()
    .toLowerCase();

  const selectedShowId = showSelect.value;

  let filteredShows = allShows;

  /*
    First apply selector.
  */
  if (selectedShowId) {
    filteredShows = filteredShows.filter(
      (show) => String(show.id) === selectedShowId
    );
  }

  /*
    Then apply text search.

    Search checks:
    - show name
    - genres
    - summary
  */
  if (searchTerm) {
    filteredShows = filteredShows.filter((show) => {
      const name = show.name?.toLowerCase() || "";

      const genres =
        show.genres
          ?.join(" ")
          .toLowerCase() || "";

      const summary =
        stripHtml(show.summary)
          .toLowerCase();

      return (
        name.includes(searchTerm) ||
        genres.includes(searchTerm) ||
        summary.includes(searchTerm)
      );
    });
  }

  renderShows(filteredShows);

  showStatus.textContent =
    `Displaying ${filteredShows.length}/${allShows.length} shows`;
}


/* =========================
   RENDER SHOWS
========================= */

function renderShows(shows) {
  showsRoot.innerHTML = "";

  if (shows.length === 0) {
    showsRoot.innerHTML = `
      <p class="error-message">
        No shows found.
      </p>
    `;

    return;
  }

  shows.forEach((show) => {
    const article = document.createElement("article");

    article.className = "show-card";

    const image = getImage(show.image);

    const summary =
      stripHtml(show.summary) ||
      "No summary available.";

    const genres =
      show.genres?.length
        ? show.genres.join(", ")
        : "N/A";

    const status =
      show.status || "N/A";

    const rating =
      show.rating?.average ?? "N/A";

    const runtime =
      show.runtime ?? "N/A";

    article.innerHTML = `
      <img
        src="${image}"
        alt="${escapeHtml(show.name)} poster"
        loading="lazy"
      />

      <div class="show-content">

        <h2
          class="show-title"
          tabindex="0"
          role="button"
          data-show-id="${show.id}"
        >
          ${escapeHtml(show.name)}
        </h2>

        <p class="show-summary">
          ${escapeHtml(summary)}
        </p>

        <div class="show-details">

          <p>
            <strong>Genres:</strong>
            ${escapeHtml(genres)}
          </p>

          <p>
            <strong>Status:</strong>
            ${escapeHtml(status)}
          </p>

          <p>
            <strong>Rating:</strong>
            ${rating}
          </p>

          <p>
            <strong>Runtime:</strong>
            ${runtime} minutes
          </p>

        </div>

      </div>
    `;

    const title = article.querySelector(".show-title");

    title.addEventListener("click", () => {
      openShow(show);
    });

    title.addEventListener("keydown", (event) => {
      if (
        event.key === "Enter" ||
        event.key === " "
      ) {
        event.preventDefault();
        openShow(show);
      }
    });

    showsRoot.appendChild(article);
  });
}


/* =========================
   OPEN SHOW
========================= */

async function openShow(show) {
  currentShow = show;

  showsView.hidden = true;
  episodesView.hidden = false;

  /*
    Reset episode controls when opening
    a different show.
  */
  siteSearch.value = "";
  episodeSelect.value = "";

  root.innerHTML = `
    <p>Loading episodes, please wait...</p>
  `;

  searchCount.textContent =
    "Loading episodes...";

  try {
    const episodes = await getEpisodes(show.id);

    currentEpisodes = episodes;

    populateEpisodeSelector(episodes);

    renderEpisodes(episodes);

    updateEpisodeCount(episodes.length);
  } catch (error) {
    console.error(error);

    root.innerHTML = `
      <p class="error-message">
        Unable to load episodes for
        ${escapeHtml(show.name)}.
      </p>
    `;

    searchCount.textContent =
      "Unable to load episodes.";
  }
}


/* =========================
   EPISODE CACHE
========================= */

async function getEpisodes(showId) {
  /*
    Important Level 500 requirement:

    During one visit, never fetch the same
    URL more than once.

    We therefore cache episodes by show ID.
  */

  if (episodeCache.has(showId)) {
    return episodeCache.get(showId);
  }

  const url =
    `${API_BASE}/shows/${showId}/episodes`;

  const episodes = await fetchJson(url);

  episodeCache.set(showId, episodes);

  return episodes;
}


/* =========================
   EPISODE SELECTOR
========================= */

function populateEpisodeSelector(episodes) {
  episodeSelect.innerHTML = `
    <option value="">
      Select an episode
    </option>
  `;

  episodes.forEach((episode, index) => {
    const option = document.createElement("option");

    option.value = String(episode.id);

    option.textContent =
      `S${String(episode.season).padStart(2, "0")}E${String(
        episode.number
      ).padStart(2, "0")} - ${episode.name}`;

    episodeSelect.appendChild(option);
  });
}


/* =========================
   FILTER EPISODES
========================= */

function filterEpisodes() {
  const searchTerm = siteSearch.value
    .trim()
    .toLowerCase();

  const selectedEpisodeId =
    episodeSelect.value;

  let filteredEpisodes = currentEpisodes;

  /*
    Episode selector.
  */
  if (selectedEpisodeId) {
    filteredEpisodes =
      filteredEpisodes.filter(
        (episode) =>
          String(episode.id) ===
          selectedEpisodeId
      );
  }

  /*
    Free-text episode search.
  */
  if (searchTerm) {
    filteredEpisodes =
      filteredEpisodes.filter((episode) => {
        const name =
          episode.name?.toLowerCase() || "";

        const summary =
          stripHtml(episode.summary)
            .toLowerCase();

        return (
          name.includes(searchTerm) ||
          summary.includes(searchTerm)
        );
      });
  }

  renderEpisodes(filteredEpisodes);

  updateEpisodeCount(
    filteredEpisodes.length
  );
}


/* =========================
   EPISODE COUNT
========================= */

function updateEpisodeCount(count) {
  const total = currentEpisodes.length;

  searchCount.textContent =
    `Displaying ${count}/${total} episodes`;
}


/* =========================
   RENDER EPISODES
========================= */

function renderEpisodes(episodes) {
  root.innerHTML = "";

  if (episodes.length === 0) {
    root.innerHTML = `
      <p class="error-message">
        No episodes found.
      </p>
    `;

    return;
  }

  episodes.forEach((episode) => {
    const fragment =
      episodeTemplate.content.cloneNode(true);

    const article =
      fragment.querySelector(".card");

    const title =
      fragment.querySelector(".title");

    const image =
      fragment.querySelector("img");

    const content =
      fragment.querySelector(".content");

    title.textContent =
      `S${String(episode.season).padStart(2, "0")}E${String(
        episode.number
      ).padStart(2, "0")} - ${episode.name}`;

    image.src =
      getImage(episode.image);

    image.alt =
      `${episode.name} episode image`;

    const summary =
      stripHtml(episode.summary) ||
      "No summary available.";

    content.innerHTML =
      `<p>${escapeHtml(summary)}</p>`;

    root.appendChild(fragment);
  });
}


/* =========================
   BACK TO SHOWS
========================= */

function showShowsView() {
  episodesView.hidden = true;
  showsView.hidden = false;

  /*
    Keep the user's show search/selector state.
    This makes returning to the show listing
    predictable instead of unexpectedly resetting it.
  */
}


/* =========================
   EVENT LISTENERS
========================= */

/*
  Show text search
*/
showSearch.addEventListener(
  "input",
  filterShows
);


/*
  Show selector

  THIS is what makes the selector work.
*/
showSelect.addEventListener(
  "change",
  filterShows
);


/*
  Episode text search
*/
siteSearch.addEventListener(
  "input",
  filterEpisodes
);


/*
  Episode selector
*/
episodeSelect.addEventListener(
  "change",
  filterEpisodes
);


/*
  Back to shows
*/
backToShows.addEventListener(
  "click",
  showShowsView
);


/* =========================
   INITIALISE APP
========================= */

loadShows();