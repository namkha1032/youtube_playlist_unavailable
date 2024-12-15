import React, { useState, useEffect } from 'react';

const YouTubeVideoApp5 = () => {
    const [accessToken, setAccessToken] = useState(null);
    const [likedVideos, setLikedVideos] = useState([]);
    const [error, setError] = useState(null);
    const [playlistItemId, setPlaylistItemId] = useState('');
    const [deleteSuccess, setDeleteSuccess] = useState(false);

    // YouTube API OAuth Configuration
    const CLIENT_ID = '';
    const CLIENT_SECRET = '';
    const REDIRECT_URI = '';
    const SCOPES = [
        'https://www.googleapis.com/auth/youtube.force-ssl'
    ];

    // Generate authorization URL
    const getAuthorizationUrl = () => {
        const baseUrl = 'https://accounts.google.com/o/oauth2/v2/auth';
        const params = new URLSearchParams({
            client_id: CLIENT_ID,
            redirect_uri: REDIRECT_URI,
            response_type: 'code',
            scope: SCOPES.join(' '),
            access_type: 'offline',
            prompt: 'consent'
        });

        return `${baseUrl}?${params.toString()}`;
    };

    // Initiate OAuth login
    const handleLogin = () => {
        window.location.href = getAuthorizationUrl();
    };

    // Logout function
    const handleLogout = () => {
        try {
            // Revoke the access token
            const revokeTokenEndpoint = `https://oauth2.googleapis.com/revoke?token=${accessToken}`;

            fetch(revokeTokenEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            }).then(response => {
                console.log('Token revocation response:', response.status);
            }).catch(err => {
                console.error('Error during token revocation:', err);
            });

            // Clear local storage
            localStorage.removeItem('youtube_access_token');
            localStorage.removeItem('youtube_refresh_token');

            // Reset state
            setAccessToken(null);
            setLikedVideos([]);
            setError(null);
        } catch (err) {
            console.error('Logout error:', err);
            setError('Logout failed');
        }
    };

    // Exchange authorization code for tokens
    const exchangeCodeForToken = async (authorizationCode) => {
        try {
            const response = await fetch('https://oauth2.googleapis.com/token', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: new URLSearchParams({
                    code: authorizationCode,
                    client_id: CLIENT_ID,
                    client_secret: CLIENT_SECRET,
                    redirect_uri: REDIRECT_URI,
                    grant_type: 'authorization_code'
                })
            });

            if (!response.ok) {
                throw new Error('Token exchange failed');
            }

            const tokenData = await response.json();

            // Store tokens
            localStorage.setItem('youtube_access_token', tokenData.access_token);
            localStorage.setItem('youtube_refresh_token', tokenData.refresh_token);

            setAccessToken(tokenData.access_token);

            // Fetch liked videos immediately after authentication
            fetchLikedVideos(tokenData.access_token);
        } catch (err) {
            setError(err.message);
            console.error('Token exchange error:', err);
        }
    };

    // Refresh access token
    const refreshAccessToken = async () => {
        const refreshToken = localStorage.getItem('youtube_refresh_token');

        if (!refreshToken) {
            setError('No refresh token available');
            return;
        }

        try {
            const response = await fetch('https://oauth2.googleapis.com/token', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: new URLSearchParams({
                    client_id: CLIENT_ID,
                    client_secret: CLIENT_SECRET,
                    refresh_token: refreshToken,
                    grant_type: 'refresh_token'
                })
            });

            if (!response.ok) {
                throw new Error('Token refresh failed');
            }

            const tokenData = await response.json();

            // Update access token
            localStorage.setItem('youtube_access_token', tokenData.access_token);
            setAccessToken(tokenData.access_token);

            // Fetch liked videos with new token
            fetchLikedVideos(tokenData.access_token);
        } catch (err) {
            setError(err.message);
            console.error('Token refresh error:', err);
        }
    };

    // Fetch liked videos
    const fetchLikedVideos = async (token) => {
        try {
            const response = await fetch(
                `https://youtube.googleapis.com/youtube/v3/videos?part=snippet&myRating=like&maxResults=50`,
                {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Accept': 'application/json'
                    }
                }
            );

            if (!response.ok) {
                throw new Error('Failed to fetch liked videos');
            }

            const data = await response.json();

            // Process and set liked videos
            const processedVideos = data.items.map(video => ({
                title: video.snippet.title,
                videoId: video.id,
                channelTitle: video.snippet.channelTitle,
                publishedAt: video.snippet.publishedAt,
                thumbnailUrl: video.snippet.thumbnails.default.url
            }));

            setLikedVideos(processedVideos);
            console.log('Liked Videos:', processedVideos);

            // Handle pagination if needed
            if (data.nextPageToken) {
                console.log('Next Page Token:', data.nextPageToken);
                // Implement pagination logic if you want to fetch more than 50 videos
            }
        } catch (err) {
            setError(err.message);
            console.error('Error fetching liked videos:', err);
        }
    };

    // Delete playlist item
    const deletePlaylistItem = async () => {
        // Reset previous states
        setError(null);
        setDeleteSuccess(false);

        // Validate input
        if (!playlistItemId.trim()) {
            setError('Please enter a valid Playlist Item ID');
            return;
        }

        try {
            const response = await fetch(
                `https://youtube.googleapis.com/youtube/v3/playlistItems?id=${playlistItemId}`,
                {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${accessToken}`,
                        'Accept': 'application/json'
                    }
                }
            );

            if (response.ok) {
                setDeleteSuccess(true);
                setPlaylistItemId(''); // Clear input after successful deletion
            } else {
                // Try to parse error response
                const errorData = await response.json();
                setError(`Failed to delete playlist item: ${errorData.error.message}`);
            }
        } catch (err) {
            console.error('Error deleting playlist item:', err);
            setError('An error occurred while deleting the playlist item');
        }
    };

    // Render liked videos
    const renderLikedVideos = () => {
        return likedVideos.map((video) => (
            <div key={video.videoId} style={{
                border: '1px solid #ddd',
                margin: '10px',
                padding: '10px',
                display: 'flex',
                alignItems: 'center'
            }}>
                <img
                    src={video.thumbnailUrl}
                    alt={video.title}
                    style={{ marginRight: '10px', width: '120px' }}
                />
                <div>
                    <h3>{video.title}</h3>
                    <p>Channel: {video.channelTitle}</p>
                    <p>Published: {new Date(video.publishedAt).toLocaleDateString()}</p>
                    <a
                        href={`https://www.youtube.com/watch?v=${video.videoId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        Watch Video
                    </a>
                </div>
            </div>
        ));
    };

    // Handle OAuth callback
    useEffect(() => {
        // Check for existing token in local storage
        const storedToken = localStorage.getItem('youtube_access_token');
        if (storedToken) {
            setAccessToken(storedToken);
            fetchLikedVideos(storedToken);
            return;
        }

        // Check for authorization code in URL
        const urlParams = new URLSearchParams(window.location.search);
        const authCode = urlParams.get('code');

        if (authCode) {
            // Exchange authorization code for tokens
            exchangeCodeForToken(authCode);
        }
    }, []);

    return (
        <div style={{
            fontFamily: 'Arial, sans-serif',
            maxWidth: '800px',
            margin: '0 auto',
            padding: '20px'
        }}>
            <h1>YouTube Video Management</h1>

            {!accessToken ? (
                <button
                    onClick={handleLogin}
                    style={{
                        backgroundColor: '#4285F4',
                        color: 'white',
                        border: 'none',
                        padding: '10px 20px',
                        borderRadius: '5px',
                        cursor: 'pointer'
                    }}
                >
                    Login with YouTube
                </button>
            ) : (
                <div>
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '20px'
                    }}>
                        <button
                            onClick={refreshAccessToken}
                            style={{
                                backgroundColor: '#34A853',
                                color: 'white',
                                border: 'none',
                                padding: '10px 20px',
                                borderRadius: '5px',
                                cursor: 'pointer'
                            }}
                        >
                            Refresh Token
                        </button>

                        <button
                            onClick={handleLogout}
                            style={{
                                backgroundColor: '#EA4335',
                                color: 'white',
                                border: 'none',
                                padding: '10px 20px',
                                borderRadius: '5px',
                                cursor: 'pointer'
                            }}
                        >
                            Logout
                        </button>
                    </div>

                    {/* Playlist Item Deletion Section */}
                    <div style={{
                        marginTop: '20px',
                        padding: '15px',
                        backgroundColor: '#f0f0f0',
                        borderRadius: '5px'
                    }}>
                        <h2>Delete Playlist Item</h2>
                        <div style={{
                            display: 'flex',
                            gap: '10px',
                            marginBottom: '10px'
                        }}>
                            <input
                                type="text"
                                value={playlistItemId}
                                onChange={(e) => setPlaylistItemId(e.target.value)}
                                placeholder="Enter Playlist Item ID"
                                style={{
                                    flex: 1,
                                    padding: '10px',
                                    borderRadius: '5px',
                                    border: '1px solid #ddd'
                                }}
                            />
                            <button
                                onClick={deletePlaylistItem}
                                style={{
                                    backgroundColor: '#EA4335',
                                    color: 'white',
                                    border: 'none',
                                    padding: '10px 20px',
                                    borderRadius: '5px',
                                    cursor: 'pointer'
                                }}
                            >
                                Delete Playlist Item
                            </button>
                        </div>

                        {deleteSuccess && (
                            <div style={{
                                backgroundColor: '#4CAF50',
                                color: 'white',
                                padding: '10px',
                                borderRadius: '5px',
                                marginTop: '10px'
                            }}>
                                Playlist item deleted successfully!
                            </div>
                        )}
                    </div>

                    <h2>Your Liked Videos ({likedVideos.length})</h2>
                    {likedVideos.length > 0 ? (
                        renderLikedVideos()
                    ) : (
                        <p>No liked videos found.</p>
                    )}
                </div>
            )}

            {error && (
                <div style={{
                    color: 'red',
                    marginTop: '20px',
                    padding: '10px',
                    backgroundColor: '#ffeeee',
                    border: '1px solid red'
                }}>
                    Error: {error}
                </div>
            )}
        </div>
    );
};

export default YouTubeVideoApp5;