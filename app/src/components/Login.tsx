// Hotel Maintenance Pro - Login Component

import { useState } from 'react';
import { LogIn, Shield, Building2, Mail, Lock, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { getUsers, setCurrentUser } from '@/data/store';
import { isSupabaseAuth, signInWithSupabaseAndError, authenticateUser, createSession } from '@/lib/auth';
import { toast } from 'sonner';

interface LoginProps {
  onLoginSuccess: () => void;
  onAdminSettings?: () => void;
}

export function Login({ onLoginSuccess, onAdminSettings }: LoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const trimmedEmail = email.trim();
    const trimmedPassword = password.trim();
    if (!trimmedEmail || !trimmedPassword) {
      setError('Ingresa correo y contraseña.');
      return;
    }
    if (isSupabaseAuth() && trimmedPassword.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }
    setIsLoading(true);

    try {
      if (isSupabaseAuth()) {
        const { user, error: signInError } = await signInWithSupabaseAndError(trimmedEmail, trimmedPassword);
        if (signInError) {
          const msg = signInError.message || 'Invalid email or password';
          let displayMsg = msg === 'Invalid login credentials' ? 'Correo o contraseña incorrectos' : msg;
          if (msg.toLowerCase().includes('confirm')) {
            displayMsg = 'Correo sin confirmar. En Supabase ve a Authentication > Providers > Email y desactiva "Confirm email" para que los usuarios puedan entrar sin confirmar.';
          }
          if (signInError.status === 422 || (msg.toLowerCase().includes('password') && msg.toLowerCase().includes('6'))) {
            displayMsg = 'Revisa el correo y la contraseña. La contraseña debe tener al menos 6 caracteres.';
          }
          setError(displayMsg);
          setIsLoading(false);
          return;
        }
        if (!user) {
          setError('Usuario sin perfil. Crea el usuario en Supabase (Authentication) y revisa que exista una fila en la tabla profiles.');
          setIsLoading(false);
          return;
        }
        setCurrentUser(user!);
        toast.success(`Welcome back, ${user!.name}!`);
        onLoginSuccess();
        return;
      }

      const users = getUsers();
      const user = authenticateUser(email, password, users);
      if (!user) {
        setError('Invalid email or password');
        setIsLoading(false);
        return;
      }
      createSession(user.id);
      setCurrentUser(user);
      toast.success(`Welcome back, ${user.name}!`);
      onLoginSuccess();
    } catch (err) {
      setError('An error occurred during login');
      console.error('Login error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Logo/Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl mb-4">
            <Building2 className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Hotel Maintenance Pro</h1>
          <p className="text-gray-600">Sign in to your account</p>
        </div>

        {/* Login Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LogIn className="w-5 h-5" />
              Login
            </CardTitle>
            <CardDescription>
              Enter your credentials to access the system
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
                  <AlertCircle className="w-4 h-4" />
                  <span className="text-sm">{error}</span>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="your.email@hotel.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    required
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10"
                    required
                    disabled={isLoading}
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? 'Signing in...' : 'Sign In'}
              </Button>
            </form>

            {onAdminSettings && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={onAdminSettings}
                >
                  <Shield className="w-4 h-4 mr-2" />
                  Admin Settings
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Footer */}
        <p className="text-center text-xs text-gray-500">
          Hotel Maintenance Management System
        </p>
      </div>
    </div>
  );
}
