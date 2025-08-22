import React, { useState, useEffect } from 'react';
import { Star, Bell, MessageSquare, Settings, BarChart3, Search, Filter, Send, AlertTriangle, CheckCircle, Clock, ExternalLink, Plus, ArrowUpRight } from 'lucide-react';

// Import our Firebase APIs
import { 
  getBusinessReviews, 
  getReviewStats,
  createResponse,
  getBusinessesByUser 
} from '../api/index.js';

const ReviewManagementApp = () => {
  // State management
  const [reviews, setReviews] = useState([]);
  const [businesses, setBusinesses] = useState([]);
  const [selectedBusiness, setSelectedBusiness] = useState(null);
  const [selectedReview, setSelectedReview] = useState(null);
  const [responseText, setResponseText] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    flagged: 0,
    avgRating: 0,
    responseRate: 0
  });

  // Demo user ID - in real app, this would come from authentication
  const userId = 'demo_user_123';

  // Load initial data
  useEffect(() => {
    loadBusinesses();
  }, []);

  useEffect(() => {
    if (selectedBusiness) {
      loadReviews();
      loadStats();
    }
  }, [selectedBusiness, searchTerm, filterStatus]);

  const loadBusinesses = async () => {
    try {
      const response = await getBusinessesByUser(userId);
      if (response.success && response.data.documents.length > 0) {
        setBusinesses(response.data.documents);
        setSelectedBusiness(response.data.documents[0]); // Select first business
      }
    } catch (error) {
      console.error('Error loading businesses:', error);
    }
  };

  const loadReviews = async () => {
    if (!selectedBusiness) return;
    
    setLoading(true);
    try {
      const options = {
        limit: 50,
        includeArchived: false
      };

      // Add filters based on current filter status
      if (filterStatus === 'flagged') {
        options.flagged = true;
      } else if (filterStatus === 'pending') {
        options.flagged = true;
        options.hasResponse = false;
      } else if (filterStatus === 'responded') {
        options.hasResponse = true;
      }

      const response = await getBusinessReviews(selectedBusiness.id, options);
      if (response.success) {
        let reviewData = response.data.documents || [];
        
        // Client-side search filter
        if (searchTerm) {
          reviewData = reviewData.filter(review => 
            review.text.toLowerCase().includes(searchTerm.toLowerCase()) ||
            review.author.name.toLowerCase().includes(searchTerm.toLowerCase())
          );
        }

        setReviews(reviewData);
      }
    } catch (error) {
      console.error('Error loading reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    if (!selectedBusiness) return;
    
    try {
      const response = await getReviewStats(selectedBusiness.id);
      if (response.success) {
        setStats({
          total: response.data.total || 0,
          flagged: response.data.flaggedCount || 0,
          avgRating: response.data.avgRating || 0,
          responseRate: response.data.responseRate || 0
        });
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const generateResponse = async (review) => {
    // AI response generation based on rating
    const responses = {
      negative: [
        `Hi ${review.author.name.split(' ')[0]}, thank you for your feedback. We sincerely apologize for not meeting your expectations. We'd love the opportunity to make this right. Please contact us directly so we can address your concerns.`,
        `Dear ${review.author.name.split(' ')[0]}, we're sorry to hear about your experience. This doesn't reflect our usual standards. We'd appreciate the chance to discuss this with you personally.`
      ],
      positive: [
        `Thank you so much ${review.author.name.split(' ')[0]}! We're thrilled you had such a great experience. Reviews like yours make our day!`,
        `${review.author.name.split(' ')[0]}, thank you for the wonderful review! We're so happy you enjoyed your visit.`
      ]
    };

    const responseType = review.rating <= 3 ? 'negative' : 'positive';
    const suggestions = responses[responseType];
    return suggestions[Math.floor(Math.random() * suggestions.length)];
  };

  const handleGenerateResponse = async (review) => {
    const suggestion = await generateResponse(review);
    setResponseText(suggestion);
  };

  const handleSubmitResponse = async () => {
    if (!selectedReview || !responseText.trim()) return;

    try {
      const responseData = {
        reviewId: selectedReview.id,
        businessId: selectedBusiness.id,
        userId: userId,
        responseText: responseText.trim(),
        responseType: 'manual' // or 'ai_generated' if using AI
      };

      const response = await createResponse(responseData);
      if (response.success) {
        // Refresh reviews to show updated response status
        await loadReviews();
        
        // Close modal and reset
        setSelectedReview(null);
        setResponseText('');
        
        // Show success message (you could add a toast notification here)
        alert('Response submitted successfully!');
      }
    } catch (error) {
      console.error('Error submitting response:', error);
      alert('Error submitting response. Please try again.');
    }
  };

  const filteredReviews = reviews; // Already filtered in loadReviews

  const PlatformBadge = ({ platform }) => {
    const config = {
      google: { color: 'bg-blue-50 text-blue-700 border-blue-200', icon: '🔍' },
      yelp: { color: 'bg-red-50 text-red-700 border-red-200', icon: '⭐' },
      facebook: { color: 'bg-blue-50 text-blue-700 border-blue-200', icon: '👥' }
    };
    const { color, icon } = config[platform.toLowerCase()] || config.google;

    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium border ${color}`}>
        <span className="mr-1">{icon}</span>
        {platform.charAt(0).toUpperCase() + platform.slice(1)}
      </span>
    );
  };

  const StarRating = ({ rating, size = 'sm' }) => {
    const sizeClass = size === 'sm' ? 'w-4 h-4' : 'w-5 h-5';
    return (
      <div className="flex">
        {[1, 2, 3, 4, 5].map(star => (
          <Star
            key={star}
            className={`${sizeClass} ${star <= rating ? 'text-yellow-400 fill-current' : 'text-gray-200'}`}
          />
        ))}
      </div>
    );
  };

  const ReviewCard = ({ review }) => {
    const initials = review.author.name.split(' ').map(n => n[0]).join('').toUpperCase();
    const reviewDate = new Date(review.reviewDate.seconds * 1000).toLocaleDateString();
    
    return (
      <div className="bg-white border rounded-lg p-4 hover:shadow-md transition-shadow">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-sm font-medium flex-shrink-0">
            {initials}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm">{review.author.name}</span>
                <StarRating rating={review.rating} />
                <span className="text-xs text-gray-500">{reviewDate}</span>
              </div>
              
              <div className="flex items-center gap-2">
                <PlatformBadge platform={review.platform} />
                
                {review.flagging?.isFlagged && (
                  <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-red-50 text-red-700 border border-red-200">
                    <AlertTriangle className="w-3 h-3 mr-1" />
                    Flagged
                  </span>
                )}
                
                {review.response?.hasResponse && (
                  <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-green-50 text-green-700 border border-green-200">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Responded
                  </span>
                )}
              </div>
            </div>
            
            <p className="text-gray-900 text-sm mb-3 leading-relaxed">{review.text}</p>
            
            <div className="flex items-center justify-between">
              <button className="flex items-center text-xs text-gray-500 hover:text-gray-700">
                <ExternalLink className="w-3 h-3 mr-1" />
                View on {review.platform.charAt(0).toUpperCase() + review.platform.slice(1)}
              </button>
              
              {!review.response?.hasResponse && (
                <button
                  onClick={() => setSelectedReview(review)}
                  className="inline-flex items-center px-3 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors"
                >
                  <MessageSquare className="w-3 h-3 mr-1" />
                  Respond
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const ResponseModal = () => {
    if (!selectedReview) return null;

    const initials = selectedReview.author.name.split(' ').map(n => n[0]).join('').toUpperCase();

    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg max-w-2xl w-full">
          <div className="p-6 border-b">
            <h3 className="text-lg font-semibold">Respond to Review</h3>
          </div>
          
          <div className="p-6">
            <div className="mb-4 p-4 bg-gray-50 rounded-lg border">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-sm font-medium">
                  {initials}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{selectedReview.author.name}</span>
                    <StarRating rating={selectedReview.rating} />
                  </div>
                  <PlatformBadge platform={selectedReview.platform} />
                </div>
              </div>
              <p className="text-sm text-gray-900">{selectedReview.text}</p>
            </div>
            
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700">Your Response</label>
              <textarea
                value={responseText}
                onChange={(e) => setResponseText(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                placeholder="Write your response..."
              />
              
              <div className="flex gap-2">
                <button
                  onClick={() => handleGenerateResponse(selectedReview)}
                  className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 transition-colors"
                >
                  ✨ Generate AI Response
                </button>
                <button
                  onClick={handleSubmitResponse}
                  disabled={!responseText.trim()}
                  className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:bg-gray-300 transition-colors flex items-center"
                >
                  <Send className="w-4 h-4 mr-1" />
                  Submit Response
                </button>
                <button
                  onClick={() => {
                    setSelectedReview(null);
                    setResponseText('');
                  }}
                  className="px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (loading && !selectedBusiness) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your businesses...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <MessageSquare className="w-6 h-6 text-white" />
              </div>
              
              <div>
                <h1 className="text-xl font-bold text-gray-900">ReviewManager</h1>
                <p className="text-sm text-gray-600">
                  {selectedBusiness ? selectedBusiness.name : 'Select a business'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="relative">
                <Bell className="w-5 h-5 text-gray-400" />
                {stats.flagged > 0 && (
                  <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full text-xs text-white flex items-center justify-center">
                  </span>
                )}
              </div>
              <div className="text-right">
                <div className="text-sm font-medium">Growth Plan</div>
                <div className="text-xs text-gray-500">$79/month</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="px-6 py-6">
        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">{stats.avgRating.toFixed(1)}</p>
                <p className="text-sm text-gray-600">Avg Rating</p>
              </div>
              <BarChart3 className="w-8 h-8 text-blue-600" />
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-lg border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-sm text-gray-600">Total Reviews</p>
              </div>
              <MessageSquare className="w-8 h-8 text-green-600" />
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-lg border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-red-600">{stats.flagged}</p>
                <p className="text-sm text-gray-600">Need Response</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-lg border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">{stats.responseRate.toFixed(0)}%</p>
                <p className="text-sm text-gray-600">Response Rate</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="bg-white p-4 rounded-lg border mb-6">
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search reviews..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Reviews</option>
              <option value="flagged">Flagged</option>
              <option value="pending">Need Response</option>
              <option value="responded">Responded</option>
            </select>

            <button className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors">
              <Settings className="w-4 h-4" />
              Settings
            </button>
          </div>
        </div>

        {/* Reviews */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredReviews.map(review => (
              <ReviewCard key={review.id} review={review} />
            ))}
          </div>
        )}

        {!loading && filteredReviews.length === 0 && (
          <div className="text-center py-12">
            <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No reviews found</h3>
            <p className="text-gray-500">Try adjusting your search or filter criteria.</p>
          </div>
        )}
      </div>

      <ResponseModal />
    </div>
  );
};

export default ReviewManagementApp;
