'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminLoginPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    loginId: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError('');
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    if (formData.loginId === 'hari.shinjuku@gmail.com' && formData.password === 'hari0801') {
      localStorage.setItem('admin_login_id', formData.loginId);
      localStorage.setItem('admin_password', formData.password);
      router.push('/admin/reservations');
    } else {
      setError('ログインIDまたはパスワードが間違っています');
    }
    
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full space-y-8">
        
        <div className="text-center">
          <div className="w-24 h-12 mx-auto bg-gray-200 rounded flex items-center justify-center mb-6">
            <span className="text-gray-600 text-sm">LOGO</span>
          </div>
          <h2 className="text-3xl font-bold text-gray-900">予約管理</h2>
          <p className="mt-2 text-sm text-gray-600">管理者ログイン</p>
        </div>

        <form onSubmit={handleLogin} className="mt-8 space-y-6">
          <div className="space-y-4">
            
            <div>
              <label htmlFor="loginId" className="block text-sm font-medium text-gray-700">
                ログインID
              </label>
              <input
                id="loginId"
                type="email"
                value={formData.loginId}
                onChange={(e) => handleInputChange('loginId', e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900 font-medium"
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                パスワード
              </label>
              <input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900 font-medium"
                required
              />
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-black hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50"
          >
            {isLoading ? 'ログイン中...' : 'Login'}
          </button>

        </form>
      </div>
    </div>
  );
}