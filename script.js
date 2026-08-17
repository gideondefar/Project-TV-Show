const allEpisodes = getAllEpisodes();

const root = document.getElementById("root");

root.innerHTML = allEpisodes
  .map((ep) => {
    const seasonNumber = String(ep.season).padStart(2, "0"); // 01
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
  })
  .join("");