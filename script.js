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
  const filteredEpisodes = state.allEpisodes.filter((episode) =>
    episode.name.toLowerCase().includes(state.searchTerm.toLowerCase()),
  );

  root.innerHTML = filteredEpisodes.map(createEpisodeCard).join("");
}
render();
const searchInput = document.getElementById("site-search");

searchInput.addEventListener("input", (event) => {
  state.searchTerm = event.target.value;
  render();
});