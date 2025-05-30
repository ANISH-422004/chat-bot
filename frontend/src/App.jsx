import { useState } from 'react';
import axios from 'axios';

function App() {
  const [input, setInput] = useState('');
  const [chat, setChat] = useState([]);
  const [loading, setLoading] = useState(false);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const newChat = [...chat, { role: 'user', content: input }];
    setChat(newChat);
    setInput('');
    setLoading(true);

    try {
      const res = await axios.post('/chat', {
        messages: newChat.map(msg => ({
          role: msg.role,
          content: msg.content,
        }))
      });

      const steps = res.data.messages || [];
      const botSteps = steps.map(step => ({
        role: 'assistant',
        content: `${step.step.toUpperCase()}: ${step.content}`
      }));

      setChat([...newChat, ...botSteps]);
    } catch (err) {
      console.error(err);
      alert('Error sending message');
    } finally {
      setLoading(false);
    }
  };

  return (
<div className="min-h-screen w-full bg-gray-900 text-white flex items-center justify-center px-4">
  <div className="w-full flex flex-col bg-gray-800 rounded-lg shadow-lg overflow-hidden">

    {/* Header */}
    <header className="px-6 py-4 text-center text-xl font-bold bg-gray-700">
      HiteshSir – Reasoning Chat AI
    </header>

    {/* Chat Area */}
    <main className="flex-1 px-4 py-4 overflow-y-auto h-[65vh] bg-gray-900">
      <div className="space-y-4 flex flex-col">
        {chat.map((msg, idx) => (
          <div
            key={idx}
            className={`p-3 rounded-xl max-w-[80%] break-words ${
              msg.role === 'user'
                ? 'bg-blue-600 self-end text-right'
                : 'bg-gray-700 self-start text-left'
            }`}
          >
            <p className="whitespace-pre-line text-sm md:text-base">{msg.content}</p>
          </div>
        ))}
        {loading && (
          <div className="text-center text-gray-400 animate-pulse">Thinking...</div>
        )}
      </div>
    </main>

    {/* Footer */}
    <footer className="px-4 py-3 flex items-center gap-2 bg-gray-800">
      <input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
        placeholder="Ask something..."
        className="flex-1 px-4 py-2 rounded-lg bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      <button
        onClick={sendMessage}
        className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg text-white font-medium"
      >
        Send
      </button>
    </footer>
  </div>
</div>

  );
}

export default App;
