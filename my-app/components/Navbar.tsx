'use client'
import React, { useState } from 'react';
import { User, Menu, X } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '../contexts/AuthContext';
import { useGoogleAuth } from '../hooks/useGoogleAuth';

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user } = useAuth();
  const { signIn, signOut, isLoading, error } = useGoogleAuth();

  const handleSignIn = async () => {
    await signIn();
  };

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <>
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <span className="block sm:inline">{error}</span>
          <button 
            onClick={() => window.location.reload()} 
            className="absolute top-0 bottom-0 right-0 px-4 py-3"
          >
            <span className="sr-only">Dismiss</span>
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
      <nav className="bg-white shadow-lg border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex-shrink-0">
            <Link href="/" className="text-2xl font-bold text-gray-900 hover:text-purple-600 transition-colors">
              InterviewAI
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-4">
             
           
            
            </div>
          </div>

          {/* Sign In/User Menu */}
          <div className="hidden md:block">
            {!user ? (
              <div className="flex items-center space-x-3">
                <button
                  onClick={handleSignIn}
                  disabled={isLoading}
                  className="bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  {isLoading ? 'Signing In...' : 'Sign In'}
                </button>
                <button className="text-gray-700 hover:text-purple-600 px-4 py-2 rounded-md text-sm font-medium border border-gray-300 hover:border-purple-600 transition-colors">
                  Sign Up
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2">
                  {user.photoURL ? (
                    <img 
                      src={user.photoURL} 
                      alt={user.displayName || 'User'} 
                      className="h-8 w-8 rounded-full"
                    />
                  ) : (
                    <User className="h-8 w-8 text-gray-600 bg-gray-100 rounded-full p-1" />
                  )}
                  <span className="text-gray-700 text-sm font-medium">
                    {user.displayName || user.email || 'User'}
                  </span>
                </div>
                <button
                  onClick={handleSignOut}
                  disabled={isLoading}
                  className="text-gray-700 hover:text-red-600 disabled:text-gray-400 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  {isLoading ? 'Signing Out...' : 'Sign Out'}
                </button>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
                          <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="text-gray-700 hover:text-purple-600 inline-flex items-center justify-center p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-inset focus:ring-purple-500"
              >
              {isMenuOpen ? (
                <X className="block h-6 w-6" />
              ) : (
                <Menu className="block h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-gray-50">
            <Link href="/" className="text-gray-700 hover:text-purple-600 block px-3 py-2 rounded-md text-base font-medium">
              Home
            </Link>
            {user && (
              <Link href="/" className="text-gray-700 hover:text-purple-600 block px-3 py-2 rounded-md text-base font-medium">
                Dashboard
              </Link>
            )}
            <a href="#" className="text-gray-700 hover:text-purple-600 block px-3 py-2 rounded-md text-base font-medium">
              About
            </a>
            <a href="#" className="text-gray-700 hover:text-purple-600 block px-3 py-2 rounded-md text-base font-medium">
              Roles
            </a>
            <a href="#" className="text-gray-700 hover:text-purple-600 block px-3 py-2 rounded-md text-base font-medium">
              Contact
            </a>
            
            {/* Mobile Sign In/Out */}
            <div className="pt-4 pb-3 border-t border-gray-200">
              {!user ? (
                <div className="space-y-2">
                  <button
                    onClick={handleSignIn}
                    disabled={isLoading}
                    className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white px-3 py-2 rounded-md text-base font-medium transition-colors"
                  >
                    {isLoading ? 'Signing In...' : 'Sign In'}
                  </button>
                  <button className="w-full text-gray-700 hover:text-purple-600 px-3 py-2 rounded-md text-base font-medium border border-gray-300 hover:border-purple-600 transition-colors">
                    Sign Up
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center px-3 py-2">
                    {user.photoURL ? (
                      <img 
                        src={user.photoURL} 
                        alt={user.displayName || 'User'} 
                        className="h-8 w-8 rounded-full mr-2"
                      />
                    ) : (
                      <User className="h-8 w-8 text-gray-600 bg-gray-100 rounded-full p-1 mr-2" />
                    )}
                    <span className="text-gray-700 text-base font-medium">
                      {user.displayName || user.email || 'User'}
                    </span>
                  </div>
                  <button
                    onClick={handleSignOut}
                    disabled={isLoading}
                    className="w-full text-left text-gray-700 hover:text-red-600 disabled:text-gray-400 px-3 py-2 rounded-md text-base font-medium transition-colors"
                  >
                    {isLoading ? 'Signing Out...' : 'Sign Out'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
    </>
  );
};

export default Navbar;