import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, ChefHat, ArrowRight } from 'lucide-react';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import useAuthStore from '../stores/authStore';
import { APP_NAME } from '../utils/constants';
import toast from 'react-hot-toast';

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await login(email, password);

    if (result.success) {
      toast.success('Selamat datang kembali!', { icon: '👋' });
      navigate('/');
    } else {
      setError(result.error || 'Terjadi kesalahan saat masuk');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen min-h-[100dvh] flex items-center justify-center p-4 pt-16 bg-warm-50 dark:bg-dark-900">
      <div className="w-full max-w-md animate-scale-in">
        {/* Header */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-12 h-12 bg-gradient-brand rounded-2xl flex items-center justify-center shadow-lg shadow-brand-500/30">
              <ChefHat size={28} className="text-white" />
            </div>
          </Link>
          <h1 className="text-2xl font-extrabold text-warm-900 dark:text-white mb-1">
            Masuk ke {APP_NAME}
          </h1>
          <p className="text-warm-500 dark:text-warm-400">
            Masuk dengan akun terdaftar untuk melanjutkan.
          </p>
        </div>

        {/* Form */}
        <div className="bg-white dark:bg-dark-800 rounded-2xl border border-warm-100 dark:border-dark-600 p-6 md:p-8 shadow-card">
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 rounded-xl p-3 text-sm text-red-600 dark:text-red-400 animate-fade-in">
                {error}
              </div>
            )}

            <Input
              label="Email"
              type="email"
              icon={Mail}
              placeholder="contoh@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <Input
              label="Password"
              type="password"
              icon={Lock}
              placeholder="Masukkan password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <Button type="submit" fullWidth size="lg" loading={loading} icon={ArrowRight} iconPosition="right">
              Masuk
            </Button>
          </form>

          <p className="text-center text-sm text-warm-500 dark:text-warm-400 mt-6">
            Belum punya akun?{' '}
            <Link to="/register" className="text-brand-600 dark:text-brand-400 font-semibold hover:underline">
              Daftar Gratis
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
