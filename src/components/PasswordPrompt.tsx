import React, { useState } from 'react';
import { Lock } from 'lucide-react';

interface PasswordPromptProps {
  onAuthenticated: () => void;
}

const PasswordPrompt: React.FC<PasswordPromptProps> = ({ onAuthenticated }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);
  const [isShaking, setIsShaking] = useState(false);

  // Hash stored as hex - derived from SHA-256 of the passphrase
  // The original passphrase is a combination of "open" + "exhibit"
  const TARGET_HASH = 'd3fa1b39c2577808150b8e987ac0e34829e8bedd1d187fd8287a24fce831e26a';

  const hashPassword = async (input: string): Promise<string> => {
    const encoder = new TextEncoder();
    const data = encoder.encode(input);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const inputHash = await hashPassword(password);

    if (inputHash === TARGET_HASH) {
      sessionStorage.setItem('gallery_auth', 'true');
      onAuthenticated();
    } else {
      setError(true);
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 500);
      setPassword('');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
      <div className={`bg-white p-8 rounded-2xl shadow-xl max-w-md w-full mx-4 ${isShaking ? 'animate-shake' : ''}`}>
        <div className="flex flex-col items-center mb-6">
          <div className="bg-blue-100 p-4 rounded-full mb-4">
            <Lock className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800">Show & Tell Gallery</h1>
          <p className="text-gray-600 mt-2 text-center">Enter the passphrase to view the gallery</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <input
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError(false);
              }}
              placeholder="Enter passphrase"
              className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
                error ? 'border-red-500' : 'border-gray-300'
              }`}
              autoFocus
            />
            {error && (
              <p className="text-red-500 text-sm mt-2">Incorrect passphrase. Please try again.</p>
            )}
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Enter Gallery
          </button>
        </form>
      </div>

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-8px); }
          20%, 40%, 60%, 80% { transform: translateX(8px); }
        }
        .animate-shake {
          animation: shake 0.5s;
        }
      `}</style>
    </div>
  );
};

export default PasswordPrompt;
