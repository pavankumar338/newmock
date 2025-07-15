import React, { useState } from 'react'
import { Calendar, Users, MessageSquare, Settings, Home, Target, Award, Clock } from 'lucide-react'
import MockInterview from './MockInterview'

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState('overview')

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Home },
    { id: 'practice', label: 'Practice Sessions', icon: Calendar },
    { id: 'analytics', label: 'Analytics', icon: Target },
    { id: 'interview', label: 'Mock Interview', icon: MessageSquare },
    { id: 'settings', label: 'Settings', icon: Settings }
  ]

  const renderTabContent = () => {
    switch (activeTab) {
      case 'interview':
        return <MockInterview />
      case 'overview':
        return (
          <div className="p-6">
            <h2 className="text-2xl font-bold mb-6">Interview Practice Dashboard</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white p-6 rounded-lg shadow">
                <div className="flex items-center">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Calendar className="w-6 h-6 text-purple-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Practice Sessions</p>
                    <p className="text-2xl font-semibold text-gray-900">0</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow">
                <div className="flex items-center">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Award className="w-6 h-6 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Average Score</p>
                    <p className="text-2xl font-semibold text-gray-900">-</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow">
                <div className="flex items-center">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Clock className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Practice Time</p>
                    <p className="text-2xl font-semibold text-gray-900">0h</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow">
                <div className="flex items-center">
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <Target className="w-6 h-6 text-orange-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Roles Practiced</p>
                    <p className="text-2xl font-semibold text-gray-900">0</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mt-8">
              <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button 
                  onClick={() => setActiveTab('interview')}
                  className="p-4 bg-purple-50 border border-purple-200 rounded-lg hover:bg-purple-100 transition-colors text-left"
                >
                  <MessageSquare className="w-8 h-8 text-purple-600 mb-2" />
                  <h4 className="font-medium text-gray-900">Start New Interview</h4>
                  <p className="text-sm text-gray-600">Practice with AI interviewer</p>
                </button>
                
                <button 
                  onClick={() => setActiveTab('practice')}
                  className="p-4 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-colors text-left"
                >
                  <Calendar className="w-8 h-8 text-green-600 mb-2" />
                  <h4 className="font-medium text-gray-900">View Practice History</h4>
                  <p className="text-sm text-gray-600">Review past sessions</p>
                </button>
                
                <button 
                  onClick={() => setActiveTab('analytics')}
                  className="p-4 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors text-left"
                >
                  <Target className="w-8 h-8 text-blue-600 mb-2" />
                  <h4 className="font-medium text-gray-900">View Analytics</h4>
                  <p className="text-sm text-gray-600">Performance insights</p>
                </button>
              </div>
            </div>

            <div className="mt-8">
              <h3 className="text-lg font-semibold mb-4">Recent Practice Sessions</h3>
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-900">Session History</span>
                    <button className="text-sm text-purple-600 hover:text-purple-800">View All</button>
                  </div>
                </div>
                <div className="px-6 py-8 text-center">
                  <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 text-sm">No practice sessions yet</p>
                  <p className="text-gray-400 text-xs mt-1">Start your first interview to see your history here</p>
                </div>
              </div>
            </div>
          </div>
        )
      case 'practice':
        return (
          <div className="p-6">
            <h2 className="text-2xl font-bold mb-6">Practice Sessions</h2>
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-4">Your Interview Practice History</h3>
              <div className="text-center py-12">
                <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 text-lg mb-2">No practice sessions yet</p>
                <p className="text-gray-400 text-sm mb-6">Start your first mock interview to build your practice history</p>
                <button 
                  onClick={() => setActiveTab('interview')}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-md font-medium transition-colors"
                >
                  Start First Interview
                </button>
              </div>
            </div>
          </div>
        )
      case 'analytics':
        return (
          <div className="p-6">
            <h2 className="text-2xl font-bold mb-6">Analytics</h2>
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-4">Interview Performance Analytics</h3>
              <div className="text-center py-12">
                <Target className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 text-lg mb-2">Analytics coming soon</p>
                <p className="text-gray-400 text-sm">Detailed insights and performance analytics will be available after you complete your first interview</p>
              </div>
            </div>
          </div>
        )
      default:
        return (
          <div className="p-6">
            <h2 className="text-2xl font-bold mb-6">{tabs.find(tab => tab.id === activeTab)?.label}</h2>
            <p className="text-gray-600">This feature is coming soon...</p>
          </div>
        )
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Tab Navigation */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                    activeTab === tab.id
                      ? 'border-purple-500 text-purple-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              )
            })}
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      <div className="max-w-7xl mx-auto">
        {renderTabContent()}
      </div>
    </div>
  )
}

export default Dashboard