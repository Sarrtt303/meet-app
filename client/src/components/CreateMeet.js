

import React, { useState } from 'react';
import axios from 'axios';

const CreateMeet = ({ tokens }) => {
  const [session, setSession] = useState(null);
  const [error, setError] = useState(null);

  const createMeet = async () => {
    try {
      setError(null);
      const response = await axios.post('http://localhost:5000/create-meeting', { tokens });
      setSession(response.data);
      console.log('Meeting created:', response.data);
    } catch (error) {
      console.error('Error creating meeting:', error);
      setError('Failed to create meeting. Please try again.');
    }
  };

  return (
    <div className="p-4">
      <button 
        onClick={createMeet}
        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
      >
        Create Google Meet
      </button>
      {error && (
        <p className="text-red-500 mt-2">{error}</p>
      )}
      {session && (
        <div className="mt-4">
          <p>Meet Link: <a href={session.meetingLink} target="_blank" rel="noreferrer" className="text-blue-500 hover:underline">{session.meetingLink}</a></p>
          <p>Start Time: {new Date(session.startTime).toLocaleString()}</p>
          <p>End Time: {new Date(session.endTime).toLocaleString()}</p>
        </div>
      )}
    </div>
  );
};

export default CreateMeet;
