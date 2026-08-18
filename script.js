//const allEpisodes = getAllEpisodes();

const root = document.getElementById("root");
const state = {
  allEpisodes: getAllEpisodes(),
  searchTerm: "",
};
function render() {
  const filteredFilms = state.allEpisodes.filter((film) =>
    film.title.includes(state.searchTerm),
  );
  const filmCards = filteredFilms.map(createFilmCard);
  document.body.append(...filmCards);
}

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
      episode.summary.toLowerCase().includes(state.searchTerm.toLowerCase()),
  );
  const searchCount = document.getElementById("search-count");
  searchCount.textContent = `Displaying ${filteredEpisodes.length}/${state.allEpisodes.length} episode(s)`;

  root.innerHTML = filteredEpisodes.map(createEpisodeCard).join("");
}
function populateEpisodeSelect() {
  const episodeSelect = document.getElementById("episode-select");

  state.allEpisodes.forEach((episode) => {
    const option = document.createElement("option");

    const seasonNumber = String(episode.season).padStart(2, "0");
    const episodeNumber = String(episode.number).padStart(2, "0");

    option.value = episode.id;
    option.textContent = `S${seasonNumber}E${episodeNumber} - ${episode.name}`;

    episodeSelect.appendChild(option);
  });
}
populateEpisodeSelect();
render();
const searchInput = document.getElementById("site-search");

searchInput.addEventListener("input", (event) => {
  state.searchTerm = event.target.value;
  render();
});
