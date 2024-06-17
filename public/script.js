// Replace with your YouTube Data API key
const apiKey = 'AIzaSyDnJmxP8a2QFQZOJ8QTwsxLtiVfcpzkSik';

// Function to search for videos
const searchVideos = async (query) => {
    const response = await fetch(`/search?query=${query}`);
    const data = await response.json();
    return data.items;
};

// Function to initialize YouTube Player
let player;
function onYouTubeIframeAPIReady() {
    player = new YT.Player('player', {
        height: '360',
        width: '640',
        videoId: '', // Initial video ID
        events: {
            'onReady': onPlayerReady,
            'onStateChange': onPlayerStateChange
        }
    });
}

// Function called when player is ready
function onPlayerReady(event) {
    console.log('YouTube Player is ready');
}

// Function called when player state changes
function onPlayerStateChange(event) {
    console.log('Player state changed');
}

// Event listener for form submission
document.getElementById('searchForm').addEventListener('submit', async function(event) {
    event.preventDefault();
    const query = document.getElementById('query').value.trim();
    if (query === '') return;

    // Call function to search for videos
    const results = await searchVideos(query);
    displaySearchResults(results);
});

// Function to display search results
function displaySearchResults(results) {
    const searchResults = document.getElementById('searchResults');
    searchResults.innerHTML = ''; // Clear previous results

    results.forEach(item => {
        const videoId = item.id.videoId;
        const title = item.snippet.title;
        const thumbnail = item.snippet.thumbnails.default.url;

        // Create HTML elements for each video result
        const resultItem = document.createElement('div');
        resultItem.classList.add('video-result');
        resultItem.innerHTML = `
            <img src="${thumbnail}" alt="${title}">
            <p>${title}</p>
        `;
        
        // Add click event to play the video
        resultItem.addEventListener('click', function() {
            player.loadVideoById(videoId);
        });

        // Append to search results container
        searchResults.appendChild(resultItem);
    });
}