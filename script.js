// Replace with your Spotify API credentials
// require('dotenv').config();

let clientId, clientSecret;

if (typeof window !== 'undefined' && window.ENV) {
  clientId = window.ENV.SPOTIFY_CLIENT_ID;
  clientSecret = window.ENV.SPOTIFY_CLIENT_SECRET;
} else if (typeof process !== 'undefined' && process.env) {
  clientId = process.env.SPOTIFY_CLIENT_ID;
  clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
} else {
  console.error('Spotify credentials not found');
}

let accessToken;

function updateStatus(message) {
    const statusElement = document.getElementById('status');
    statusElement.textContent = message;
    console.log(message);
}

async function getAccessToken() {
    updateStatus('Attempting to get access token...');
    try {
        const response = await fetch('https://accounts.spotify.com/api/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': 'Basic ' + btoa(clientId + ':' + clientSecret)
            },
            body: 'grant_type=client_credentials'
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        accessToken = data.access_token;
        updateStatus('Access token obtained successfully');
    } catch (error) {
        updateStatus('Error obtaining access token: ' + error.message);
    }
}

async function generatePlaylist(mood, genre, activity) {
    updateStatus('Generating playlist...');
    if (!accessToken) {
        updateStatus('No access token available. Trying to obtain one...');
        await getAccessToken();
    }

    const seedGenres = genre;
    const params = new URLSearchParams({
        seed_genres: seedGenres,
        limit: 10,
        market: 'US',
        target_valence: getMoodValue(mood),
        target_energy: getActivityValue(activity)
    });

    updateStatus('Fetching playlist from Spotify API...');

    try {
        const response = await fetch(`https://api.spotify.com/v1/recommendations?${params}`, {
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        updateStatus('Playlist data received from Spotify API');
        return data.tracks;
    } catch (error) {
        updateStatus('Error generating playlist: ' + error.message);
        throw error;
    }
}

function getMoodValue(mood) {
    const moodValues = {
        'happy': 0.8,
        'sad': 0.2,
        'energetic': 0.7,
        'relaxed': 0.4
    };
    return moodValues[mood] || 0.5;
}

function getActivityValue(activity) {
    const activityValues = {
        'workout': 0.8,
        'study': 0.4,
        'party': 0.9,
        'relax': 0.3
    };
    return activityValues[activity] || 0.5;
}

let globalAudio = new Audio();
let currentlyPlayingButton = null;

document.getElementById('playlist-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    updateStatus('Form submitted');

    const mood = document.getElementById('mood').value;
    const genre = document.getElementById('genre').value;
    const activity = document.getElementById('activity').value;

    updateStatus(`Selected: Mood - ${mood}, Genre - ${genre}, Activity - ${activity}`);

    const playlistResult = document.getElementById('playlist-result');
    playlistResult.innerHTML = '';

    try {
        const playlist = await generatePlaylist(mood, genre, activity);

        if (!playlist || playlist.length === 0) {
            throw new Error('No tracks found for the given criteria');
        }

        updateStatus('Displaying playlist');
        
        const maxTracks = 12;
        playlist.slice(0, maxTracks).forEach((track, index) => {
            const trackElement = document.createElement('div');
trackElement.className = 'track-item';
trackElement.innerHTML = `
    <img class="track-image" src="${track.album.images[0].url}" alt="${track.name} album cover">
    <div class="track-info">
        <h3>${track.name}</h3>
        <p>${track.artists[0].name}</p>
    </div>
    <button class="play-button" data-preview-url="${track.preview_url || ''}" ${!track.preview_url ? 'disabled' : ''}>
        ${track.preview_url ? 'Play' : 'No Preview'}
    </button>
`;
            playlistResult.appendChild(trackElement);
        });

        // Show the playlist page
        document.getElementById('playlist-page').style.display = 'block';
        document.getElementById('preferences-page').style.display = 'none';
        document.getElementById('status-container').style.display = 'none';
        document.getElementById('playlist-title').style.display = 'block';

        // Add event listeners for play buttons
        document.querySelectorAll('.play-button').forEach(button => {
            button.addEventListener('click', function() {
                const previewUrl = this.getAttribute('data-preview-url');
                if (!previewUrl) {
                    console.log('No preview URL available for this track');
                    return;
                }
                
                if (currentlyPlayingButton && currentlyPlayingButton !== this) {
                    currentlyPlayingButton.textContent = 'Play';
                }

                if (globalAudio.src !== previewUrl) {
                    globalAudio.src = previewUrl;
                    globalAudio.play();
                    this.textContent = 'Pause';
                    currentlyPlayingButton = this;
                } else {
                    if (globalAudio.paused) {
                        globalAudio.play();
                        this.textContent = 'Pause';
                    } else {
                        globalAudio.pause();
                        this.textContent = 'Play';
                    }
                }
            });
        });

        globalAudio.onended = () => {
            if (currentlyPlayingButton) {
                currentlyPlayingButton.textContent = 'Play';
                currentlyPlayingButton = null;
            }
        };

        console.log('Playlist page should be visible now');
        console.log('Number of play buttons:', document.querySelectorAll('.play-button').length);
    } catch (error) {
        updateStatus('Error: ' + error.message);
    }
});

document.getElementById('back-button').addEventListener('click', () => {
    document.getElementById('playlist-page').style.display = 'none';
    document.getElementById('preferences-page').style.display = 'block';
    document.getElementById('status-container').style.display = 'block'; // Show the status message again
    updateStatus('Returned to preferences page');
});

// Initial setup
document.addEventListener('DOMContentLoaded', () => {
    updateStatus('Page loaded. Getting access token...');
    getAccessToken();
});