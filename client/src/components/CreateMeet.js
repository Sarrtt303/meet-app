import React, { useState } from 'react';
import axios from 'axios';
import JoinMeet from './JoinMeet';


const CreateMeet = () => {
  const [session, setSession] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const createMeet = async () => {
    setLoading(true);
    setError(null);

    try {
      // Call backend to create the Google Meet event (no tokens needed in the frontend)
      const response = await axios.post('http://localhost:5000/create-meeting');
      setSession(response.data);  // Store the meeting data (like meetingLink, startTime, etc.)
      console.log('Meeting created:', response.data);
    } catch (error) {
      console.error('Error creating meeting:', error.response ? error.response.data : error.message);
      setError('Failed to create meeting. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center p-4 min-h-screen">
  <button
    onClick={createMeet}
    className="bg-black hover:bg-gray-600 text-white font-bold py-2 px-4 rounded"
    disabled={loading} // Disable button while loading
  >
    {loading ? 'Creating...' : 'Create Google Meet'}
  </button>
  
  {error && (
    <p className="text-red-500 mt-2">{error}</p>
  )}
  
  {session && (
    <div className="mt-4 bg-gray-100 p-4 rounded shadow-lg w-full max-w-lg">
      <p>
        Meet Link: <a href={session.meetingLink} target="_blank" rel="noreferrer" className="text-gray-800 hover:underline">{session.meetingLink}</a>
      </p>
      <p>Start Time: {new Date(session.startTime).toLocaleString()}</p>
      <p>End Time: {new Date(session.endTime).toLocaleString()}</p>
    </div>
  )}
  <JoinMeet/>
</div>
  );
};

export default CreateMeet;
