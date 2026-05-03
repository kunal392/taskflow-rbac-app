import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Card } from '../components/Card';

export const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await register(name, email, password);
      navigate('/');
    } catch (err) {
      setError(err.message || 'Failed to create account');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex-center" style={{ minHeight: '100dvh', padding: '1rem' }}>
      <Card style={{ width: '100%', maxWidth: '400px' }}>
        <div className="text-center mb-8">
          <h1>Create Account</h1>
          <p className="text-muted">Join TaskFlow to manage your projects</p>
        </div>

        <form onSubmit={handleSubmit}>
          {error && <div className="form-error mb-4 text-center">{error}</div>}
          
          <Input
            label="Full Name"
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="John Doe"
            required
          />

          <Input
            label="Email"
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@example.com"
            required
          />
          
          <Input
            label="Password"
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
            minLength={6}
          />
          
          <Button type="submit" className="mt-4" style={{ width: '100%' }} isLoading={isLoading}>
            Sign Up
          </Button>
        </form>

        <p className="text-center mt-8 text-muted" style={{ fontSize: '0.875rem' }}>
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </Card>
    </div>
  );
};
