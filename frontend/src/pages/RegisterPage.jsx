import React from 'react';
import { Link, useNavigate } from 'react-router';
import { useAuth } from '../context/AuthContext';
import PhoneAuthFlow from '../components/PhoneAuthFlow';

export default function RegisterPage() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  React.useEffect(() => {
    if (isAuthenticated) {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  return (
    <div className="max-w-md mx-auto">
      <div className="bg-white p-8 rounded-3xl shadow-sm border border-border">
        <PhoneAuthFlow
          onSuccess={() => {
            navigate('/', { replace: true });
          }}
        />

        <div className="mt-6 pt-6 border-t border-border text-center">
          <p className="text-xs text-gray-500">
            Mini D-Mart Staff or Store Manager?{' '}
            <Link to="/login" className="text-primary font-semibold hover:underline">
              Sign in with Work Email
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
