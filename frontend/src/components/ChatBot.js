// src/components/ChatBot.js

import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';

function ChatBot() {
  const [message, setMessage] = useState('');
  const [chatLog, setChatLog] = useState([]);
  const [isLoading, setIsLoading] = useState(false); // State for loading
  const chatWindowRef = useRef(null); // Ref for the chat window for scrolling

  // Effect to scroll to the bottom when chatLog or isLoading updates
  useEffect(() => {
    if (chatWindowRef.current) {
      chatWindowRef.current.scrollTop = chatWindowRef.current.scrollHeight;
    }
  }, [chatLog, isLoading]); // Scroll when chat updates or loading state changes

  const sendMessage = async (e) => {
    e.preventDefault();
    const userMessage = message.trim(); // Trim whitespace
    if (!userMessage || isLoading) return; // Prevent sending empty or multiple messages

    // Add user message to log immediately
    setChatLog(prevChatLog => [...prevChatLog, { sender: 'User', text: userMessage }]);
    setMessage(''); // Clear input field right away
    setIsLoading(true); // Set loading state

    const requestBody = {
      message: userMessage
      // Note: SYSTEM_PROMPT and chat history are NOT sent in this simplified request.
      // Your backend is expected to handle the conversation context.
    };

    try {
      const response = await fetch('http://localhost:8000/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      setIsLoading(false); // Clear loading state

      if (!response.ok) {
         // Attempt to read error body if available, otherwise use status text
         const errorBody = await response.text().catch(() => response.statusText);
         throw new Error(`HTTP error! Status: ${response.status} - ${errorBody}`);
      }

      const data = await response.json();
      // Assuming the backend sends back just the bot's reply text in `data.response`
      setChatLog(prevChatLog => [...prevChatLog, { sender: 'Bot', text: data.response }]);

    } catch (error) {
      console.error("Error sending message:", error);
      setIsLoading(false); // Clear loading state on error
      // Add an error message to the chat log
      setChatLog(prevChatLog => [...prevChatLog, { sender: 'Bot', text: `*Error: Could not get a response. Please check the server connection. (${error.message})*` }]); // Use markdown for italics
    }
  };


  return (
    <div className="chatbot-container">
      <h2>Chat with AI Mentor</h2>
      {/* Add an optional subtitle or intro text */}
      <p className="page-subtitle">Ask me anything about career paths, skills, or job opportunities.</p> {/* Reused class */}

      {/* Assign the ref to the chat window */}
      <div className="chat-window" ref={chatWindowRef}>
        {/* Initial greeting - UI only, not sent to API */}
        {chatLog.length === 0 && !isLoading && (
            // Style this initial message slightly differently or center it
            <div className="chat-entry bot initial-message" style={{ alignSelf: 'center', textAlign: 'center', maxWidth: '85%', margin: '1rem auto' }}>
               <strong>Bot:</strong> Hello! I'm your AI Mentor, ready to help you with training and job seeking. Ask me anything!
            </div>
        )}
        {/* Render chat messages */}
        {chatLog.map((entry, idx) => (
          // Added key prop for list rendering performance
          // Added data-is-markdown attribute for CSS targeting if needed
          <div key={idx} className={`chat-entry ${entry.sender.toLowerCase()}`} data-is-markdown={entry.sender === 'Bot' ? "true" : undefined}>
            <strong>{entry.sender}:</strong> <ReactMarkdown>{entry.text}</ReactMarkdown>
          </div>
        ))}
         {/* Loading indicator message */}
        {isLoading && (
            // Keep the loading indicator aligned left and use a minimal style
            <div className="chat-entry bot loading-indicator" style={{ alignSelf: 'flex-start', maxWidth: 'max-content' /*, animation: 'pulse 1.5s infinite ease-in-out'*/ }}>
               <strong>Bot:</strong> ... {/* Or a typing indicator animation */}
            </div>
        )}
      </div>
      <form onSubmit={sendMessage} className="chat-form">
        {/* Assigned the class name "chat-input" */}
        <input
          className="chat-input"
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder={isLoading ? "Waiting for response..." : "Type your message here"}
          disabled={isLoading} // Disable input while loading
        />
        <button type="submit" disabled={!message.trim() || isLoading}>Send</button> {/* Disable button if input is empty or loading */}
      </form>
       {/* Optional loading spinner/message outside the chat form if preferred */}
       {/* {isLoading && <div className="loading-message">Sending...</div>} */}
    </div>
  );
}

export default ChatBot;