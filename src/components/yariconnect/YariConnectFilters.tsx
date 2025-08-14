import React from 'react';
import { X, MapPin, Briefcase, Clock, Star, Users } from 'lucide-react';

interface YariConnectFiltersProps {
  filters: {
    jobProfile: string;
    field: string;
    location: string;
    experience: string;
    availability: string;
  };
  onFiltersChange: (filters: any) => void;
  onClose: () => void;
}

export const YariConnectFilters: React.FC<YariConnectFiltersProps> = ({
  filters,
  onFiltersChange,
  onClose
}) => {
  const jobProfiles = [
    'All Profiles',
    'Software Engineer',
    'Product Manager',
    'UX Designer',
    'Data Scientist',
    'Marketing Manager',
    'Business Analyst',
    'DevOps Engineer',
    'Sales Manager',
    'Consultant',
    'Entrepreneur',
    'Project Manager'
  ];

  const fields = [
    'All Fields',
    'Technology & Engineering',
    'Design & Creative',
    'Product & Strategy',
    'Marketing & Sales',
    'Data & Analytics',
    'Consulting & Strategy',
    'Finance & Accounting',
    'Operations & Management',
    'Healthcare & Life Sciences',
    'Education & Training',
    'Legal & Compliance'
  ];

  const locations = [
    'All Locations',
    'San Francisco, CA',
    'New York, NY',
    'Seattle, WA',
    'Los Angeles, CA',
    'Chicago, IL',
    'Austin, TX',
    'Boston, MA',
    'Denver, CO',
    'Atlanta, GA',
    'Remote/Global'
  ];

  const experienceLevels = [
    'All Experience',
    '0-2 years',
    '3-5 years',
    '6-8 years',
    '9-12 years',
    '12+ years'
  ];

  const availabilityOptions = [
    'All Availability',
    'Available Now',
    'Available Today',
    'Available This Week',
    'Flexible Schedule'
  ];

  const updateFilter = (key: string, value: string) => {
    const newFilters = {
      ...filters,
      [key]: value === `All ${key.charAt(0).toUpperCase() + key.slice(1)}` || 
              value === 'All Profiles' || 
              value === 'All Fields' || 
              value === 'All Locations' || 
              value === 'All Experience' || 
              value === 'All Availability' ? 'all' : value
    };
    onFiltersChange(newFilters);
  };

  const clearAllFilters = () => {
    onFiltersChange({
      jobProfile: 'all',
      field: 'all',
      location: 'all',
      experience: 'all',
      availability: 'all'
    });
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 mb-8">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Connection Filters</h3>
        <div className="flex items-center space-x-2">
          <button
            onClick={clearAllFilters}
            className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
          >
            Clear All
          </button>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Job Profile */}
        <div>
          <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-3">
            <Briefcase className="h-4 w-4" />
            <span>Job Profile</span>
          </label>
          <select
            value={filters.jobProfile === 'all' ? 'All Profiles' : filters.jobProfile}
            onChange={(e) => updateFilter('jobProfile', e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          >
            {jobProfiles.map((profile) => (
              <option key={profile} value={profile}>
                {profile}
              </option>
            ))}
          </select>
        </div>

        {/* Field */}
        <div>
          <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-3">
            <Users className="h-4 w-4" />
            <span>Field</span>
          </label>
          <select
            value={filters.field === 'all' ? 'All Fields' : filters.field}
            onChange={(e) => updateFilter('field', e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          >
            {fields.map((field) => (
              <option key={field} value={field}>
                {field}
              </option>
            ))}
          </select>
        </div>

        {/* Location */}
        <div>
          <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-3">
            <MapPin className="h-4 w-4" />
            <span>Location</span>
          </label>
          <select
            value={filters.location === 'all' ? 'All Locations' : filters.location}
            onChange={(e) => updateFilter('location', e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          >
            {locations.map((location) => (
              <option key={location} value={location}>
                {location}
              </option>
            ))}
          </select>
        </div>

        {/* Experience */}
        <div>
          <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-3">
            <Star className="h-4 w-4" />
            <span>Experience</span>
          </label>
          <select
            value={filters.experience === 'all' ? 'All Experience' : filters.experience}
            onChange={(e) => updateFilter('experience', e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          >
            {experienceLevels.map((level) => (
              <option key={level} value={level}>
                {level}
              </option>
            ))}
          </select>
        </div>

        {/* Availability */}
        <div>
          <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-3">
            <Clock className="h-4 w-4" />
            <span>Availability</span>
          </label>
          <select
            value={filters.availability === 'all' ? 'All Availability' : filters.availability}
            onChange={(e) => updateFilter('availability', e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          >
            {availabilityOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Active Filters Display */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <div className="flex flex-wrap gap-2">
          {Object.entries(filters).map(([key, value]) => {
            if (value === 'all') return null;
            return (
              <span
                key={key}
                className="inline-flex items-center px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm"
              >
                {value}
                <button
                  onClick={() => updateFilter(key, 'all')}
                  className="ml-2 text-indigo-500 hover:text-indigo-700"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );
};