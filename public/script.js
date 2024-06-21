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
    const userId = document.getElementById('userId').value; // Ensure userId is available in your HTML

    if (query === '') return;

    // Call function to search for videos
    const results = await searchVideos(query);

    // Save search query to user's search history
    await fetch('/save-search', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId, query }),
    });

    // Display search results
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

        // Add click event to play the video and save video details
        resultItem.addEventListener('click', function() {
            if (player && typeof player.loadVideoById === 'function') {
                player.loadVideoById(videoId);
                saveVideoDetails(title, `https://www.youtube.com/watch?v=${videoId}`);
            } else {
                console.error('YouTube Player is not ready');
            }
        });

        // Append to search results container
        searchResults.appendChild(resultItem);
    });
}

async function saveVideoDetails(title, link) {
    const userId = document.getElementById('userId').value;
    try {
      const response = await fetch('/save-video', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId, title, link }),
      });
      const data = await response.json();
      console.log(data);
    } catch (error) {
      console.error('Error saving video details:', error);
    }
  }

function toggleDropdown() {
    var dropdownMenu = document.getElementById("dropdownMenu");
    dropdownMenu.classList.toggle("show");
}

// Close the dropdown menu if the user clicks outside of it
window.onclick = function(event) {
    if (!event.target.matches('.dropbtn')) {
        var dropdowns = document.getElementsByClassName("dropdown-content");
        for (var i = 0; i < dropdowns.length; i++) {
            var openDropdown = dropdowns[i];
            if (openDropdown.classList.contains('show')) {
                openDropdown.classList.remove('show');
            }
        }
    }
}
