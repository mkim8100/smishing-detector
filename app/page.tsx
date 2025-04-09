'use client';

import React, { useState, FormEvent } from 'react';

type Message = { 
  sender: 'suspicious' | 'user' | 'ai'; 
  text: string;
};

export default function ChatPage(): JSX.Element {
  // Fixed suspicious SMS text.
  const suspiciousText: string = "Hey, your package is ready for pickup! Click here to confirm: example.com";
  
  // Initialize conversation state, starting with the suspicious message.
  const [messages, setMessages] = useState<Message[]>([{ sender: 'suspicious', text: suspiciousText }]);
  
  // User input (question) and loading state.
  const [userQuery, setUserQuery] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  // Handler for submitting the form.
  const handleSend = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault(); // Prevent the default form submission behavior.
    if (!userQuery.trim()) return;

    // Append the user's query to the conversation.
    setMessages((prev) => [...prev, { sender: 'user', text: userQuery }]);
    setLoading(true);

    try {
      // Make a POST request to the API endpoint.
      const res = await fetch('/api/smishing-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          suspiciousText, // The fixed suspicious text.
          userQuestion: userQuery // Note: the API expects this key to be named "userQuestion".
        }),
      });

      // Parse the JSON response.
      const data: { response?: string } = await res.json();
      const aiReply = data.response || "No response from AI.";

      // Append the AI's reply to the conversation.
      setMessages((prev) => [...prev, { sender: 'ai', text: aiReply }]);
    } catch (error) {
      console.error("Error during API call:", error);
      setMessages((prev) => [...prev, { sender: 'ai', text: 'Error processing your request.' }]);
    } finally {
      setLoading(false);
      setUserQuery(''); // Clear the input field.
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4 flex flex-col items-center">
      <h1 className="text-2xl font-bold mb-4">Smishing Message Analysis Chat</h1>
      <div className="w-full max-w-md bg-white p-4 rounded-2xl shadow-md mb-4 space-y-2 overflow-y-auto">
        {messages.map((msg, idx) => {
          let alignment = "self-center";
          let bubbleColor = "bg-yellow-100 text-gray-900";
          if (msg.sender === 'user') {
            alignment = "self-end";
            bubbleColor = "bg-blue-500 text-white";
          } else if (msg.sender === 'ai') {
            alignment = "self-start";
            bubbleColor = "bg-gray-200 text-gray-900";
          }
          return (
            <div key={idx} className={`${alignment} p-2 rounded-lg max-w-xs ${bubbleColor}`}>
              {msg.text}
            </div>
          );
        })}
      </div>
      <form onSubmit={handleSend} className="flex w-full max-w-md space-x-2">
        <input
          type="text"
          value={userQuery}
          onChange={(e) => setUserQuery(e.target.value)}
          placeholder="Ask about the message..."
          className="flex-1 border border-gray-300 rounded px-3 py-2"
        />
        <button
          type="submit"
          disabled={loading}
          className="bg-blue-500 text-white rounded px-4 py-2"
        >
          {loading ? "Sending..." : "Send"}
        </button>
      </form>
    </div>
  );
}