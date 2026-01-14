const API_KEY = 'd86303cd506472b7fb4757bb3d4740ec';
const IMG_URL = 'https://image.tmdb.org/t/p/w500';

let heroTimer; // This will hold our 5-second countdown
let featuredItems = [];
let currentIndex = 0;

async function startApp() {
    // 1. Fetch Trending MIX (Movies + TV) for the big Hero Banner
    const hRes = await fetch(`https://api.themoviedb.org/3/trending/all/day?api_key=${API_KEY}`);
    const hData = await hRes.json();
    setupHero(hData.results.slice(0, 10)); // Send top 10 to the banner

    // 2. Fetch the 10 Trending Movies for the row
    const mRes = await fetch(`https://api.themoviedb.org/3/movie/popular?api_key=${API_KEY}`);
    const mData = await mRes.json();
    fillShelf(mData.results.slice(0, 10), 'movie-row', 'movie');

    // 3. Fetch the 10 Trending TV Shows for the row
    const tRes = await fetch(`https://api.themoviedb.org/3/tv/popular?api_key=${API_KEY}`);
    const tData = await tRes.json();
    fillShelf(tData.results.slice(0, 10), 'tv-row', 'tv');
}

let isTransitioning = false;

function setupHero(items) {
    const track = document.getElementById('hero-track');
    
    // 1. Create Clones
    const firstClones = items.slice(0, 5);
    const lastClones = items.slice(-5);
    featuredItems = [...lastClones, ...items, ...firstClones];
    
    // 2. Set Start Position
    currentIndex = 5;

    track.innerHTML = '';
    featuredItems.forEach((item, i) => {
        const img = document.createElement('img');
        img.src = IMG_URL + item.poster_path;
        img.className = 'slider-card';
        img.id = `hero-card-${i}`;
        img.onclick = () => { if(!isTransitioning) { currentIndex = i; updateHero(); } };
        track.appendChild(img);
    });

    // 3. THE FIX: Wait 100ms for the browser to render before positioning
    setTimeout(() => {
        moveTrack(false); // Jump to position 5 without animation
        updateHero();     // Highlight the correct card
    }, 100);
    
    // Only start the timer AFTER the setup is done
    setInterval(rotateHero, 5000);
}

function updateHero() {
    isTransitioning = true;
    
    // --- TIMER RESET START ---
    // This stops the old countdown so it doesn't "fire" early
    if (heroTimer) clearInterval(heroTimer);
    // This starts a fresh 5-second countdown for the new poster
    heroTimer = setInterval(rotateHero, 5000);
    // --- TIMER RESET END ---

    moveTrack(true);

    // Update the 'active' class (Big vs Small)
    featuredItems.forEach((_, i) => {
        const card = document.getElementById(`hero-card-${i}`);
        if (card) {
            card.classList.toggle('active', i === currentIndex);
        }
    });

    // Update Title and Year text
    const currentItem = featuredItems[currentIndex];
    const dateStr = currentItem.release_date || currentItem.first_air_date || "";
    const year = dateStr ? `(${dateStr.split('-')[0]})` : "";
    document.getElementById('hero-title').innerText = `${currentItem.title || currentItem.name} ${year}`;

    // Handle the "Infinite Loop" teleport
    setTimeout(() => {
        let needsJump = false;
        if (currentIndex >= featuredItems.length - 5) {
            currentIndex = 5;
            needsJump = true;
        } else if (currentIndex < 5) {
            currentIndex = featuredItems.length - 6;
            needsJump = true;
        }

        if (needsJump) {
            moveTrack(false); // Snap instantly
            // Re-apply active class to the real poster after snap
            featuredItems.forEach((_, i) => {
                const card = document.getElementById(`hero-card-${i}`);
                if (card) card.classList.toggle('active', i === currentIndex);
            });
        }
        isTransitioning = false;
    }, 700); 
}

function moveTrack(animate) {
    const track = document.getElementById('hero-track');
    const playBtn = document.getElementById('hero-play-btn');
    
    // Get the exact center of your screen
    const screenCenter = window.innerWidth / 2;
    
    // The width of one card + the gap (150 + 20)
    const cardSpace = 170; 
    
  // Change 82 to 78 to move it slightly back to the right
const slideAmount = (currentIndex * 170) - (window.innerWidth / 2) + 78;

    track.style.transition = animate ? 'transform 0.7s cubic-bezier(0.25, 1, 0.5, 1)' : 'none';
    track.style.transform = `translateX(${-slideAmount}px)`;
}

function rotateHero() {
    // Only rotate if we aren't already in the middle of a slide
    if (!isTransitioning) {
        currentIndex++;
        updateHero();
    }
}


// --- HERO BANNER LOGIC END ---

function fillShelf(items, shelfId, type) {
    const shelf = document.getElementById(shelfId);
    shelf.innerHTML = '';

    items.forEach(item => {
        const title = item.title || item.name;
        
        // Get the year
        const dateStr = item.release_date || item.first_air_date || "";
        const year = dateStr ? dateStr.split('-')[0] : "";

        const card = document.createElement('div');
        card.className = 'card';
        
        // Layout: Poster, then Title, then Year
        card.innerHTML = `
            <img src="${IMG_URL + item.poster_path}">
            <h4 style="margin-top:8px; font-size:13px; color:white;">${title}</h4>
            <span style="color:#888; font-size:11px; display:block;">${year}</span>
        `;
        
        card.onclick = () => playMedia(item.id, type);
        shelf.appendChild(card);
    });

    // Add the See More button at the end
    const moreCard = document.createElement('div');
    moreCard.className = 'see-more-card';
    moreCard.innerHTML = 'SEE MORE ➔';
    moreCard.onclick = () => { window.location.href = `explore.html?type=${type}`; };
    shelf.appendChild(moreCard);
}

function playMedia(id, type) {
    const overlay = document.getElementById('player-overlay');
    const iframe = document.getElementById('video-iframe');
    
    if (type === 'movie') {
        iframe.src = `https://vidsrc.cc/v2/embed/movie/${id}`;
    } else {
        iframe.src = `https://vidsrc.cc/v2/embed/tv/${id}/1/1`;
    }
    overlay.style.display = 'block';
}

function closePlayer() {
    const overlay = document.getElementById('player-overlay');
    const iframe = document.getElementById('video-iframe');
    overlay.style.display = 'none';
    iframe.src = ""; 
}

// Start everything
startApp();