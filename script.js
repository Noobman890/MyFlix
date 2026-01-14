const API_KEY = 'd86303cd506472b7fb4757bb3d4740ec';
const IMG_URL = 'https://image.tmdb.org/t/p/w500';

async function startApp() {
    // 1. Fetch the first 10 Movies
    const mRes = await fetch(`https://api.themoviedb.org/3/movie/popular?api_key=${API_KEY}`);
    const mData = await mRes.json();
    fillShelf(mData.results.slice(0, 10), 'movie-row', 'movie');

    // 2. Fetch the first 10 TV Shows
    const tRes = await fetch(`https://api.themoviedb.org/3/tv/popular?api_key=${API_KEY}`);
    const tData = await tRes.json();
    fillShelf(tData.results.slice(0, 10), 'tv-row', 'tv');
}

function fillShelf(items, shelfId, type) {
    const shelf = document.getElementById(shelfId);
    shelf.innerHTML = ''; // Clear the "Loading..." text

    // Loop through the 10 items and create cards
    items.forEach(item => {
        const title = item.title || item.name;
        const card = document.createElement('div');
        card.className = 'card';
        card.innerHTML = `
            <img src="${IMG_URL + item.poster_path}">
            <h4>${title}</h4>
        `;
        
        // This will be for the player later!
        card.onclick = () => console.log("Clicked " + title);
        
        shelf.appendChild(card);
    });

    // --- THIS IS THE PART YOU WERE LOOKING FOR ---
    // We create the "See More" box at the end of the row
    const moreCard = document.createElement('div');
    moreCard.className = 'see-more-card';
    moreCard.innerHTML = 'SEE MORE ➔';

    // This tells the browser: "When clicked, go to explore.html and tell it what type (movie/tv) to show"
    moreCard.onclick = () => {
        window.location.href = `explore.html?type=${type}`;
    };

    shelf.appendChild(moreCard);
}

// Kick off the app
startApp();