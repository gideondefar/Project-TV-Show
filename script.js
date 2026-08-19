const root = document.getElementById("root");
const showSelect = document.getElementById("show-select");
const searchInput = document.getElementById("site-search");
const episodeSelect = document.getElementById("episode-select");
const searchCount = document.getElementById("search-count");

const state = {
  allShows: [],
  allEpisodes: [],
  episodesByShow: {},
  searchTerm: "",
  currentShowId: null,
};


// -------------------------
// SHOWS
// -------------------------

async function fetchShows() {
  try {
    const response = await fetch("https://api.tvmaze.com/shows");

    if (!response.ok) {
      throw new Error("Failed to load shows");
    }

    state.allShows = await response.json();

    populateShowSelect();

    // Start with Breaking Bad (show ID 169)
    showSelect.value = "169";
    await changeShow("169");

  } catch (error) {
    searchCount.textContent =
      "Sorry, we couldn't load the TV shows.";
  }
}


function populateShowSelect() {
  const sortedShows = [...state.allShows].sort((a, b) =>
    a.name.localeCompare(b.name, undefined, {
      sensitivity: "base",
    }),
  );

  showSelect.innerHTML = '<option value="">Select a show</option>';

  sortedShows.forEach((show) => {
    const option = document.createElement("option");

    option.value = show.id;
    option.textContent = show.name;

    showSelect.appendChild(option);
  });
}


// -------------------------
// EPISODES
// -------------------------

async function fetchEpisodes(showId) {
  // If we have already fetched this show's episodes,
  // use the saved result instead of fetching again.
  if (state.episodesByShow[showId]) {
    return state.episodesByShow[showId];
  }

  root.innerHTML = "<p>Loading episodes, please wait...</p>";

  const episodePromise = fetch(
    `https://api.tvmaze.com/shows/${showId}/episodes`,
  )
    .then((response) => {
      if (!response.ok) {
        throw new Error("Failed to load episodes");
      }

      return response.json();
    });

  // Save the promise immediately.
  // This prevents the same URL being fetched twice.
  state.episodesByShow[showId] = episodePromise;

  return episodePromise;
}


// -------------------------
// CHANGE SHOW
// -------------------------

async function changeShow(showId) {
  if (!showId) {
    return;
  }

  state.currentShowId = showId;
  state.searchTerm = "";

  searchInput.value = "";
  episodeSelect.innerHTML =
    '<option value="">Select an episode</option>';

  try {
    state.allEpisodes = await fetchEpisodes(showId);

    populateEpisodeSelect();
    render();

  } catch (error) {
    root.innerHTML =
      "<p>Sorry, there was a problem loading the episodes.</p>";

    searchCount.textContent =
      "Unable to load episodes.";
  }
}


// -------------------------
// EPISODE CARDS
// -------------------------

function createEpisodeCard(ep) {
  const seasonNumber = String(ep.season).padStart(2, "0");
  const episodeNumber = String(ep.number).padStart(2, "0");

  return `
    <div class="card" id="episode-${ep.id}">
      <h1 class="title">
        S${seasonNumber}E${episodeNumber} - ${ep.name}
      </h1>

      ${
        ep.image?.medium
          ? `
            <img
              src="${ep.image.medium}"
              alt="${ep.name} episode poster"
            />
          `
          : ""
      }

      <div class="content">
        ${ep.summary || "<p>No summary available.</p>"}
      </div>
    </div>
  `;
}


// -------------------------
// RENDER EPISODES
// -------------------------

function render() {
  const searchTerm = state.searchTerm.toLowerCase().trim();

  const filteredEpisodes = state.allEpisodes.filter(
    (episode) =>
      episode.name.toLowerCase().includes(searchTerm) ||
      (episode.summary || "").toLowerCase().includes(searchTerm),
  );

  searchCount.textContent =
    `Displaying ${filteredEpisodes.length}/${state.allEpisodes.length} episodes`;

  root.innerHTML = filteredEpisodes
    .map(createEpisodeCard)
    .join("");
}


// -------------------------
// EPISODE SELECTOR
// -------------------------

function populateEpisodeSelect() {
  episodeSelect.innerHTML =
    '<option value="">Select an episode</option>';

  state.allEpisodes.forEach((episode) => {
    const option = document.createElement("option");

    const seasonNumber = String(episode.season).padStart(2, "0");
    const episodeNumber = String(episode.number).padStart(2, "0");

    option.value = episode.id;

    option.textContent =
      `S${seasonNumber}E${episodeNumber} - ${episode.name}`;

    episodeSelect.appendChild(option);
  });
}


// -------------------------
// EVENT LISTENERS
// -------------------------

showSelect.addEventListener("change", (event) => {
  changeShow(event.target.value);
});


searchInput.addEventListener("input", (event) => {
  state.searchTerm = event.target.value;

  render();
});


episodeSelect.addEventListener("change", (event) => {
  const selectedEpisodeId = Number(event.target.value);

  if (!selectedEpisodeId) {
    return;
  }

  const selectedEpisode = state.allEpisodes.find(
    (episode) => episode.id === selectedEpisodeId,
  );

  if (!selectedEpisode) {
    return;
  }

  // Clear the search so the selected episode is visible.
  searchInput.value = "";
  state.searchTerm = "";

  render();

  const episodeElement = document.getElementById(
    `episode-${selectedEpisode.id}`,
  );

  if (episodeElement) {
    episodeElement.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }
});


// -------------------------
// START THE APP
// -------------------------

fetchShows();