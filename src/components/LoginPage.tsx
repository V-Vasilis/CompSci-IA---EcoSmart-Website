import { useState } from 'react';
import { Card } from './ui/card';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Trash2, AlertCircle } from 'lucide-react';

interface LoginPageProps {
  onLogin: (schoolId: string) => void;
}

export function LoginPage({ onLogin }: LoginPageProps) {
  const [schoolId, setSchoolId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // Simulate authentication delay
    setTimeout(() => {
      // Mock authentication - accept any numeric school ID with password "demo"
      if (!schoolId.trim()) {
        setError('Please enter a School ID');
        setIsLoading(false);
      } else if (isNaN(Number(schoolId.trim())) || !Number.isInteger(Number(schoolId.trim()))) {
        setError('School ID must be a number');
        setIsLoading(false);
      } else if (!password) {
        setError('Please enter a password');
        setIsLoading(false);
      } else if (password !== 'demo') {
        setError('Invalid credentials. Use password "demo" to login.');
        setIsLoading(false);
      } else {
        onLogin(schoolId.trim());
      }
    }, 800);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div 
              className="p-3 rounded-xl"
              style={{ backgroundColor: '#2196F315' }}
            >
              <Trash2 size={40} style={{ color: '#2196F3' }} />
            </div>
          </div>
          <h1 style={{ color: '#2196F3' }}>EcoSmartBins</h1>
          <p className="text-gray-600 mt-2">
            AI-Powered Waste Management System
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="schoolId">School ID</Label>
            <Input
              id="schoolId"
              type="text"
              placeholder="Enter your school ID"
              value={schoolId}
              onChange={(e) => setSchoolId(e.target.value)}
              disabled={isLoading}
              className="h-11"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
              className="h-11"
            />
          </div>

          {error && (
            <div 
              className="p-3 rounded-lg flex items-center gap-2 text-sm"
              style={{ backgroundColor: '#F4433615', color: '#F44336' }}
            >
              <AlertCircle size={18} />
              {error}
            </div>
          )}

          <Button 
            type="submit" 
            className="w-full h-11"
            style={{ backgroundColor: '#2196F3' }}
            disabled={isLoading}
          >
            {isLoading ? 'Logging in...' : 'Login'}
          </Button>

          <div className="text-center">
            <p className="text-xs text-gray-500">
              Demo credentials: School ID "1" with password "demo"
            </p>
          </div>
        </form>

        <div className="mt-8 pt-6 border-t border-gray-200">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl" style={{ color: '#2196F3' }}>10+</div>
              <div className="text-xs text-gray-500 mt-1">Schools</div>
            </div>
            <div>
              <div className="text-2xl" style={{ color: '#4CAF50' }}>500+</div>
              <div className="text-xs text-gray-500 mt-1">Smart Bins</div>
            </div>
            <div>
              <div className="text-2xl" style={{ color: '#FF9800' }}>85%</div>
              <div className="text-xs text-gray-500 mt-1">Avg Recycling</div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
