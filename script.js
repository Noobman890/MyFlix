const API_KEY = 'd86303cd506472b7fb4757bb3d4740ec';
const IMG_URL = 'https://image.tmdb.org/t/p/w500';

let heroTimer; 
let featuredItems = [];
let currentIndex = 5; 
let isTransitioning = false;

async function startApp() {
    try {
        // 1. Hero Banner
        const hRes = await fetch(`https://api.themoviedb.org/3/trending/all/day?api_key=${API_KEY}`);
        const hData = await hRes.json();
        setupHero(hData.results.slice(0, 10));

        // 2. Row 1: New Movie Releases -> target: 'new-releases-row'
        const nRes = await fetch(`https://api.themoviedb.org/3/movie/now_playing?api_key=${API_KEY}&region=US`);
        const nData = await nRes.json();
        fillShelf(nData.results.slice(0, 10), 'new-releases-row', 'movie');

        // 3. Row 2: Airing Now (TV) -> target: 'new-tv-row'
        const ntRes = await fetch(`https://api.themoviedb.org/3/tv/on_the_air?api_key=${API_KEY}`);
        const ntData = await ntRes.json();
        fillShelf(ntData.results.slice(0, 10), 'new-tv-row', 'tv');

        // 4. Row 3: Trending Movies -> target: 'movie-row'
        const mRes = await fetch(`https://api.themoviedb.org/3/movie/popular?api_key=${API_KEY}`);
        const mData = await mRes.json();
        fillShelf(mData.results.slice(0, 10), 'movie-row', 'movie');

        // 5. Row 4: Trending TV Shows -> target: 'tv-row'
        const tRes = await fetch(`https://api.themoviedb.org/3/tv/popular?api_key=${API_KEY}`);
        const tData = await tRes.json();
        fillShelf(tData.results.slice(0, 10), 'tv-row', 'tv');
        
    } catch (error) {
        console.error("Error starting the app:", error);
    }
}

function setupHero(items) {
    const track = document.getElementById('hero-track');
    const firstClones = items.slice(0, 5);
    const lastClones = items.slice(-5);
    featuredItems = [...lastClones, ...items, ...firstClones];
    
    track.innerHTML = '';
    featuredItems.forEach((item, i) => {
        const img = document.createElement('img');
        img.src = IMG_URL + item.poster_path;
        img.className = 'slider-card';
        img.id = `hero-card-${i}`;
        img.onclick = () => { if(!isTransitioning) { currentIndex = i; updateHero(); } };
        track.appendChild(img);
    });

    if (heroTimer) clearInterval(heroTimer);
    heroTimer = setInterval(rotateHero, 5000);

    setTimeout(() => {
        moveTrack(false); 
        updateHero();     
    }, 100);
}

function updateHero() {
    isTransitioning = true;
    
    // Refresh the 5-second window so it doesn't jump early
    if (heroTimer) clearInterval(heroTimer);
    heroTimer = setInterval(rotateHero, 5000);

    moveTrack(true);

    const currentItem = featuredItems[currentIndex];
    
    // 1. Update the 'active' class (Big vs Small)
    featuredItems.forEach((_, i) => {
        const card = document.getElementById(`hero-card-${i}`);
        if (card) {
            card.classList.toggle('active', i === currentIndex);
        }
    });

    // 2. Prepare Data (Year and Rating)
    const dateStr = currentItem.release_date || currentItem.first_air_date || "";
    const year = dateStr ? `(${dateStr.split('-')[0]})` : "";
    const rating = currentItem.vote_average ? currentItem.vote_average.toFixed(1) : "N/A";

    // 3. Update Title, Year, and Rating with Neon Style
    const titleElem = document.getElementById('hero-title');
    titleElem.innerHTML = `
        ${currentItem.title || currentItem.name} 
        <span style="font-size: 0.6em; color: #888; font-weight: normal; margin-left: 8px;">${year}</span>
        <span style="color: #ccff00; margin-left: 15px; font-size: 0.7em;">⭐ ${rating}</span>
    `;

    // 4. Update Play Button Link
    const type = currentItem.media_type || 'movie';
    document.getElementById('hero-play-btn').onclick = () => playMedia(currentItem.id, type);

    // 5. Teleport logic for infinite loop
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
            moveTrack(false); 
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
    // Using the +78 centering math we found works best
    const slideAmount = (currentIndex * 170) - (window.innerWidth / 2) + 78;
    track.style.transition = animate ? 'transform 0.7s cubic-bezier(0.25, 1, 0.5, 1)' : 'none';
    track.style.transform = `translateX(${-slideAmount}px)`;
}

function rotateHero() {
    if (!isTransitioning) {
        currentIndex++;
        updateHero();
    }
}

function fillShelf(items, shelfId, type) {
    const shelf = document.getElementById(shelfId);
    shelf.innerHTML = '';

    items.forEach(item => {
        const title = item.title || item.name;
        const dateStr = item.release_date || item.first_air_date || "";
        const year = dateStr ? dateStr.split('-')[0] : "N/A";
        const rating = item.vote_average ? item.vote_average.toFixed(1) : "N/A";

        const card = document.createElement('div');
        card.className = 'card';
        
        card.innerHTML = `
            <div class="card-img-container">
                <img src="${IMG_URL + item.poster_path}" alt="${title}">
            </div>
            <div class="card-info">
                <h4 class="card-title">${title}</h4>
                <div class="card-meta">
                    <span style="color: #ccff00; font-weight: bold;">⭐ ${rating}</span>
                    <span style="color: #444;">•</span>
                    <span class="card-year">${year}</span>
                </div>
            </div>
        `;
        
        card.onclick = () => playMedia(item.id, type);
        shelf.appendChild(card);
    });

    // IMPROVED SEE MORE LOGIC
    // We determine the "category" based on the shelfId
    let category = 'popular'; 
    if (shelfId === 'new-releases-row') category = 'now_playing';
    if (shelfId === 'new-tv-row') category = 'on_the_air';

    const moreCard = document.createElement('div');
    moreCard.className = 'see-more-card';
    moreCard.innerHTML = '<span>SEE MORE</span>';
    
    // This sends both the type (movie/tv) AND the category (new/popular) to explore.html
    moreCard.onclick = () => { 
        window.location.href = `explore.html?type=${type}&category=${category}`; 
    };
    shelf.appendChild(moreCard);
}

function playMedia(id, type) {
    const overlay = document.getElementById('player-overlay');
    const iframe = document.getElementById('video-iframe');
    iframe.src = type === 'movie' ? 
        `https://vidsrc.cc/v2/embed/movie/${id}` : 
        `https://vidsrc.cc/v2/embed/tv/${id}/1/1`;
    overlay.style.display = 'block';
}

function closePlayer() {
    document.getElementById('player-overlay').style.display = 'none';
    document.getElementById('video-iframe').src = ""; 
}
startApp();

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

// Your Firebase Config (Same as before)
const firebaseConfig = {
  apiKey: "AIzaSyBRCZ76Axl5mk5ajLvEXIdtbP9VD4Ni0nQ",
  authDomain: "myflix-a64b4.firebaseapp.com",
  projectId: "myflix-a64b4",
  storageBucket: "myflix-a64b4.firebasestorage.app",
  messagingSenderId: "101704238237",
  appId: "1:101704238237:web:6666079060abef8fc8c074"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Check login status and update profile icon
onAuthStateChanged(auth, (user) => {
    const profileBtn = document.getElementById('user-profile-btn');
    const userIcon = document.getElementById('user-icon');
    const userAvatar = document.getElementById('user-avatar');

    if (user) {
        // USER LOGGED IN: Show a colored profile box
        userIcon.style.display = "none";
        userAvatar.style.display = "block";
        
        // Use a default colorful avatar (Netflix-style)
        userAvatar.src = "https://upload.wikimedia.org/wikipedia/commons/0/0b/Netflix-avatar.png";
        profileBtn.style.borderColor = "#e50914"; // Red ring around active profile
        
        // Clicking takes you to a "Logout" confirmation or Profile page
        profileBtn.onclick = () => {
            if(confirm("Do you want to logout?")) {
                signOut(auth).then(() => location.reload());
            }
        };
        console.log("Active user:", user.email);
    } else {
        // USER LOGGED OUT: Show grey silhouette
        userIcon.style.display = "block";
        userAvatar.style.display = "none";
        profileBtn.style.background = "#333";
        profileBtn.style.borderColor = "transparent";
        profileBtn.onclick = () => window.location.href = 'auth.html';
    }
})
// This checks if a user is logged in or out
onAuthStateChanged(auth, (user) => {
    const loginIcon = document.getElementById('logged-out-icon');
    const avatarContainer = document.getElementById('avatar-container');
    const profileBtn = document.getElementById('user-profile-btn');

    if (user) {
        // --- LOGGED IN ---
        loginIcon.style.display = "none";
        avatarContainer.style.display = "block";
        profileBtn.classList.add('profile-logged-in');
        
        profileBtn.onclick = () => {
            if(confirm("Logout of your account?")) {
                signOut(auth).then(() => location.reload());
            }
        };
    } else {
        // --- LOGGED OUT ---
        loginIcon.style.display = "block";
        avatarContainer.style.display = "none";
        profileBtn.classList.remove('profile-logged-in');
        
        profileBtn.onclick = () => {
            window.location.href = 'auth.html';
        };
    }
});
// Function to handle the search filtering
window.searchMovies = function() {
    const term = document.getElementById('movie-search').value.toLowerCase();
    const movieCards = document.querySelectorAll('.movie-card'); // Make sure your movie cards have this class

    movieCards.forEach(card => {
        // This looks at the title inside each card
        const title = card.querySelector('h3').innerText.toLowerCase();
        
        if (title.includes(term)) {
            card.style.display = "block";
        } else {
            card.style.display = "none";
        }
    });
};

// Helper to focus the input when clicking the icon
window.focusSearch = function() {
    document.getElementById('movie-search').focus();
};