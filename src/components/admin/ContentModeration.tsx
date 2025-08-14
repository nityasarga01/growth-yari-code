import React, { useState, useEffect } from 'react';
import { 
  Flag, 
  Eye, 
  Trash2, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  MessageSquare,
  Image,
  Video,
  FileText
} from 'lucide-react';
import { Post } from '../../types';
import { apiClient } from '../../config/api';

interface ReportedContent {
  id: string;
  post: Post;
  reportReason: string;
  reportedBy: string;
  reportedAt: Date;
  status: 'pending' | 'approved' | 'removed';
}

export const ContentModeration: React.FC = () => {
  const [reportedContent, setReportedContent] = useState<ReportedContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedContent, setSelectedContent] = useState<ReportedContent | null>(null);
  const [showContentModal, setShowContentModal] = useState(false);

  useEffect(() => {
    loadReportedContent();
  }, []);

  const loadReportedContent = async () => {
    try {
      setLoading(true);
      
      // Mock reported content for development
      const mockReports: ReportedContent[] = [
        {
          id: '1',
          post: {
            id: 'post1',
            userId: 'user1',
            user: {
              id: 'user1',
              name: 'John Doe',
              email: 'john@example.com',
              avatar: 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=1',
              profession: 'Developer',
              expertise: ['JavaScript'],
              rating: 4.5,
              reviewCount: 10,
              isVerified: false
            },
            type: 'thought',
            content: 'This is a controversial post that was reported by users.',
            tags: ['controversial'],
            likes: 5,
            comments: 12,
            shares: 2,
            createdAt: new Date('2024-08-14')
          },
          reportReason: 'Inappropriate content',
          reportedBy: 'user2',
          reportedAt: new Date('2024-08-14'),
          status: 'pending'
        }
      ];
      
      setReportedContent(mockReports);
    } catch (error) {
      console.error('Failed to load reported content:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveContent = async (reportId: string) => {
    try {
      setReportedContent(prev => prev.map(report => 
        report.id === reportId ? { ...report, status: 'approved' } : report
      ));
    } catch (error) {
      console.error('Failed to approve content:', error);
    }
  };

  const handleRemoveContent = async (reportId: string) => {
    try {
      setReportedContent(prev => prev.map(report => 
        report.id === reportId ? { ...report, status: 'removed' } : report
      ));
    } catch (error) {
      console.error('Failed to remove content:', error);
    }
  };

  const getContentTypeIcon = (type: string) => {
    switch (type) {
      case 'video':
        return <Video className="h-4 w-4" />;
      case 'image':
        return <Image className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'removed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Content Moderation</h1>
        <p className="text-gray-600">Review and moderate reported content</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-2xl font-bold text-yellow-600">{reportedContent.filter(r => r.status === 'pending').length}</h3>
              <p className="text-sm text-gray-600">Pending Reports</p>
            </div>
            <AlertTriangle className="h-8 w-8 text-yellow-500" />
          </div>
        </div>
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-2xl font-bold text-green-600">{reportedContent.filter(r => r.status === 'approved').length}</h3>
              <p className="text-sm text-gray-600">Approved</p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-500" />
          </div>
        </div>
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-2xl font-bold text-red-600">{reportedContent.filter(r => r.status === 'removed').length}</h3>
              <p className="text-sm text-gray-600">Removed</p>
            </div>
            <XCircle className="h-8 w-8 text-red-500" />
          </div>
        </div>
      </div>

      {/* Reported Content */}
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Reported Content</h3>
        </div>
        
        <div className="divide-y divide-gray-200">
          {loading ? (
            <div className="p-12 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-4 border-red-600 border-t-transparent mx-auto mb-4"></div>
              <p className="text-gray-600">Loading reported content...</p>
            </div>
          ) : reportedContent.length === 0 ? (
            <div className="p-12 text-center">
              <Flag className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No reported content</h3>
              <p className="text-gray-600">All content is clean!</p>
            </div>
          ) : (
            reportedContent.map((report) => (
              <div key={report.id} className="p-6 hover:bg-gray-50">
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    {getContentTypeIcon(report.post.type)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-2">
                      <h4 className="text-sm font-medium text-gray-900">
                        Post by {report.post.user.name}
                      </h4>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(report.status)}`}>
                        {report.status}
                      </span>
                    </div>
                    
                    <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                      {report.post.content}
                    </p>
                    
                    <div className="flex items-center space-x-4 text-xs text-gray-500">
                      <span>Reason: {report.reportReason}</span>
                      <span>Reported: {report.reportedAt.toLocaleDateString()}</span>
                      <span className="flex items-center space-x-1">
                        <MessageSquare className="h-3 w-3" />
                        <span>{report.post.comments} comments</span>
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => {
                        setSelectedContent(report);
                        setShowContentModal(true);
                      }}
                      className="p-2 text-gray-600 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                      title="View Details"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    
                    {report.status === 'pending' && (
                      <>
                        <button
                          onClick={() => handleApproveContent(report.id)}
                          className="p-2 text-green-600 hover:text-green-700 hover:bg-green-50 rounded-lg transition-colors"
                          title="Approve"
                        >
                          <CheckCircle className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleRemoveContent(report.id)}
                          className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                          title="Remove"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};