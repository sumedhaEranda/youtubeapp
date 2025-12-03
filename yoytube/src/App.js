import './App.css';
import React, { useState } from 'react';

function App() {
  const [accessToken, setAccessToken] = useState(null);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [channelId, setChannelId] = useState('UClE78KZQ32HSA_Ff_vo2MuQ'); // default channel to subscribe

  const GOOGLE_CLIENT_ID =
    process.env.REACT_APP_GOOGLE_CLIENT_ID || 'YOUR_GOOGLE_OAUTH_CLIENT_ID';

  const requestAccessToken = () => {
    if (!window.google || !window.google.accounts || !window.google.accounts.oauth2) {
      setMessage('Google Identity script not loaded. Please refresh the page.');
      return;
    }

    const tokenClient = window.google.accounts.oauth2.initTokenClient({
      client_id: GOOGLE_CLIENT_ID,
      scope: 'https://www.googleapis.com/auth/youtube',
      callback: (tokenResponse) => {
        if (tokenResponse && tokenResponse.access_token) {
          setAccessToken(tokenResponse.access_token);
          setIsAuthorized(true);
          setMessage('Signed in with Google. You can now subscribe to channels.');
        } else {
          setMessage('Failed to obtain access token.');
        }
      },
    });

    tokenClient.requestAccessToken();
  };

  const handleSubscribe = async () => {
    if (!accessToken) {
      setMessage('You must sign in with Google first.');
      return;
    }

    if (!channelId) {
      setMessage('Please enter a channel ID.');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const response = await fetch(
        'https://www.googleapis.com/youtube/v3/subscriptions?part=snippet',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            snippet: {
              resourceId: {
                kind: 'youtube#channel',
                channelId: channelId.trim(),
              },
            },
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        const errorMessage =
          (data && data.error && data.error.message) ||
          'Failed to subscribe to channel.';
        throw new Error(errorMessage);
      }

      setMessage('Successfully subscribed to the channel!');
    } catch (err) {
      setMessage(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>Yoytube – Subscribe Channel</h1>
        <p>Sign in with your Google account and subscribe to a YouTube channel using the API.</p>

        <div className="card">
          <div className="field">
            <label htmlFor="channelId">Channel ID</label>
            <input
              id="channelId"
              type="text"
              value={channelId}
              onChange={(e) => setChannelId(e.target.value)}
              placeholder="Enter YouTube channel ID"
            />
          </div>

          <div className="buttons">
            <button type="button" onClick={requestAccessToken}>
              {isAuthorized ? 'Re-authorize Google' : 'Sign in with Google'}
            </button>
            <button
              type="button"
              onClick={handleSubscribe}
              disabled={loading || !isAuthorized}
            >
              {loading ? 'Subscribing...' : 'Subscribe to Channel'}
            </button>
          </div>

          {message && <p className="message">{message}</p>}
        </div>

        <p className="note">
          You must configure <code>REACT_APP_GOOGLE_CLIENT_ID</code> in a <code>.env</code> file
          with a Web OAuth 2.0 client from Google Cloud that has YouTube Data API v3 enabled.
        </p>
      </header>
    </div>
  );
}

export default App;
