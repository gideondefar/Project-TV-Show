const root = document.getElementById("root");
const searchInput = document.getElementById("site-search");
const episodeSelect = document.getElementById("episode-select");
const searchCount = document.getElementById("search-count");

const state = {
  allEpisodes: [],
  searchTerm: "",
};

function createEpisodeCard(ep) {
  const seasonNumber = String(ep.season).padStart(2, "0");
  const episodeNumber = String(ep.number).padStart(2, "0");

  return `
    <div class="card">
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

function render() {
  const filteredEpisodes = state.allEpisodes.filter(
    (episode) =>
      episode.name.toLowerCase().includes(state.searchTerm.toLowerCase()) ||
      (episode.summary || "")
        .toLowerCase()
        .includes(state.searchTerm.toLowerCase()),
  );

  searchCount.textContent = `Displaying ${filteredEpisodes.length}/${state.allEpisodes.length} episodes`;

  root.innerHTML = filteredEpisodes.map(createEpisodeCard).join("");
}

function populateEpisodeSelect() {
  episodeSelect.innerHTML = '<option value="">Select an episode</option>';

  state.allEpisodes.forEach((episode) => {
    const option = document.createElement("option");

    const seasonNumber = String(episode.season).padStart(2, "0");
    const episodeNumber = String(episode.number).padStart(2, "0");

    option.value = episode.id;
    option.textContent = `S${seasonNumber}E${episodeNumber} - ${episode.name}`;

    episodeSelect.appendChild(option);
  });
}

async function fetchEpisodes() {
  root.innerHTML = "<p>Loading episodes, please wait...</p>";

  try {
    const response = await fetch(
      "https://api.tvmaze.com/shows/82/episodes",
    );

    if (!response.ok) {
      throw new Error("Failed to load episodes");
    }

    state.allEpisodes = await response.json();

    populateEpisodeSelect();
    render();
  } catch (error) {
    root.innerHTML =
      "<p>Sorry, there was a problem loading the episodes. Please try again later.</p>";

    searchCount.textContent = "Unable to load episodes.";
  }
}

searchInput.addEventListener("input", (event) => {
  state.searchTerm = event.target.value;
  render();
});

fetchEpisodes();