import React, { useEffect, useState } from 'react';
import axios from 'axios';

const JoinMeet = () => {
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch valid meetings when the component loads
  useEffect(() => {
    const fetchMeetings = async () => {
      try {
        const response = await axios.get('http://localhost:5000/valid-meetings');
        setMeetings(response.data);
      } catch (err) {
        setError('Failed to load meetings.');
      } finally {
        setLoading(false);
      }
    };

    fetchMeetings();
  }, []);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>{error}</div>;

  return (
    <div className="max-w-md mx-auto p-6 mt-10 bg-gray-100 border border-gray-300 rounded-lg shadow-lg">
      <h2 className="text-xl font-bold mb-4 text-center">Join a Meeting</h2>
      {meetings.length > 0 ? (
        <ul>
          {meetings.map((meeting) => (
            <li key={meeting.eventId} className="mb-2">
              <a
                href={meeting.meetingLink}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 underline"
              >
                Join Meet (expires at {new Date(meeting.endTime).toLocaleString()})
              </a>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-center">No valid meetings available.</p>
      )}
    </div>
  );
};

export default JoinMeet;
