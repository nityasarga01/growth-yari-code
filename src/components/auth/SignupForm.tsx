import React, { useState } from 'react';
import { Mail, Lock, User, Eye, EyeOff, Briefcase, Target, Award, Tag } from 'lucide-react';

interface SignupFormProps {
  onSignup: (userData: {
    name: string;
    email: string;
    password: string;
    profession: string;
    industry: string;
    experience: string;
    location: string;
    field: string;
    skills: string[];
    objectives: string[];
    mentorshipGoals: string[];
    availabilityStatus: string;
  }) => void;
  onSwitchToLogin: () => void;
  loading: boolean;
}

export const SignupForm: React.FC<SignupFormProps> = ({ onSignup, onSwitchToLogin, loading }) => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    profession: '',
    industry: '',
    experience: '',
    location: '',
    field: '',
    skills: [] as string[],
    objectives: [] as string[],
    mentorshipGoals: [] as string[],
    availabilityStatus: 'available'
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [skillInput, setSkillInput] = useState('');
  const [objectiveInput, setObjectiveInput] = useState('');
  const [mentorshipGoalInput, setMentorshipGoalInput] = useState('');

  const industries = [
    'Technology & Software',
    'Healthcare & Life Sciences',
    'Finance & Banking',
    'Education & Training',
    'Marketing & Advertising',
    'Consulting & Professional Services',
    'Manufacturing & Engineering',
    'Retail & E-commerce',
    'Media & Entertainment',
    'Real Estate & Construction',
    'Transportation & Logistics',
    'Energy & Utilities',
    'Government & Public Sector',
    'Non-profit & Social Impact',
    'Other'
  ];

  const experienceTiers = [
    'Entry Level (0-2 years)',
    'Mid Level (3-5 years)',
    'Senior Level (6-10 years)',
    'Executive Level (10+ years)',
    'Student/Recent Graduate'
  ];

  const locations = [
    'Remote/Global',
    'San Francisco, CA',
    'New York, NY',
    'Seattle, WA',
    'Los Angeles, CA',
    'Chicago, IL',
    'Austin, TX',
    'Boston, MA',
    'Denver, CO',
    'Atlanta, GA',
    'London, UK',
    'Toronto, Canada',
    'Berlin, Germany',
    'Singapore',
    'Sydney, Australia',
    'Other'
  ];

  const fields = [
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
    'Legal & Compliance',
    'Human Resources',
    'Research & Development',
    'Customer Success',
    'Business Development'
  ];

  const commonSkills = [
    'Leadership', 'Project Management', 'Strategic Planning', 'Data Analysis',
    'Digital Marketing', 'Software Development', 'UX/UI Design', 'Sales',
    'Customer Success', 'Product Management', 'Business Development',
    'Financial Analysis', 'Operations Management', 'Team Building',
    'Communication', 'Problem Solving', 'Innovation', 'Agile/Scrum'
  ];

  const mentorshipObjectives = [
    'Career Advancement',
    'Skill Development',
    'Industry Networking',
    'Leadership Growth',
    'Entrepreneurship',
    'Career Transition',
    'Technical Expertise',
    'Business Strategy',
    'Personal Branding',
    'Work-Life Balance'
  ];

  const mentorshipGoals = [
    'Provide Career Guidance',
    'Share Technical Expertise',
    'Support Skill Development',
    'Offer Industry Insights',
    'Help with Networking',
    'Assist with Job Search',
    'Guide Entrepreneurship',
    'Support Leadership Growth',
    'Provide Business Strategy',
    'Share Life Experience',
    'Help with Work-Life Balance',
    'Support Diversity & Inclusion'
  ];

  const handleNext = () => {
    if (step === 1) {
      if (!formData.name || !formData.email || !formData.password || !formData.confirmPassword) {
        alert('Please fill in all required fields');
        return;
      }
      if (formData.password !== formData.confirmPassword) {
        alert('Passwords do not match');
        return;
      }
    }
    if (step === 2) {
      if (!formData.profession || !formData.industry || !formData.experience || !formData.location || !formData.field) {
        alert('Please complete all required professional details');
        return;
      }
    }
    setStep(step + 1);
  };

  const handleBack = () => {
    setStep(step - 1);
  };

  const addSkill = (skill: string) => {
    if (skill && !formData.skills.includes(skill)) {
      setFormData(prev => ({
        ...prev,
        skills: [...prev.skills, skill]
      }));
    }
    setSkillInput('');
  };

  const removeSkill = (skillToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.filter(skill => skill !== skillToRemove)
    }));
  };

  const addObjective = (objective: string) => {
    if (objective && !formData.objectives.includes(objective)) {
      setFormData(prev => ({
        ...prev,
        objectives: [...prev.objectives, objective]
      }));
    }
    setObjectiveInput('');
  };

  const addMentorshipGoal = (goal: string) => {
    if (goal && !formData.mentorshipGoals.includes(goal)) {
      setFormData(prev => ({
        ...prev,
        mentorshipGoals: [...prev.mentorshipGoals, goal]
      }));
    }
    setMentorshipGoalInput('');
  };

  const removeMentorshipGoal = (goalToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      mentorshipGoals: prev.mentorshipGoals.filter(goal => goal !== goalToRemove)
    }));
  };

  const removeObjective = (objectiveToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      objectives: prev.objectives.filter(obj => obj !== objectiveToRemove)
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Only submit when we're on step 3
    if (step !== 3) return;
    
    onSignup({
      name: formData.name,
      email: formData.email,
      password: formData.password,
      profession: formData.profession,
      industry: formData.industry,
      experience: formData.experience,
      skills: formData.skills,
      objectives: formData.objectives,
      location: formData.location,
      field: formData.field,
      mentorshipGoals: formData.mentorshipGoals,
      availabilityStatus: formData.availabilityStatus
    });
  };

  return (
    <div className="w-full max-w-2xl mx-auto px-4">
      <div className="bg-white rounded-xl sm:rounded-2xl shadow-xl p-4 sm:p-6 lg:p-8 border border-gray-100">
        <div className="text-center mb-6 sm:mb-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Join GrowthYari</h2>
          <p className="text-gray-600">Create your professional network</p>
          
          {/* Progress Indicator */}
          <div className="flex items-center justify-center mt-4 space-x-1 sm:space-x-2">
            {[1, 2, 3].map((stepNum) => (
              <div key={stepNum} className="flex items-center">
                <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs sm:text-sm font-medium ${
                  step >= stepNum 
                    ? 'bg-brand-primary text-white' 
                    : 'bg-gray-200 text-gray-600'
                }`}>
                  {stepNum}
                </div>
                {stepNum < 3 && (
                  <div className={`w-4 sm:w-8 h-1 mx-1 sm:mx-2 ${
                    step > stepNum ? 'bg-brand-primary' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
          </div>
          <div className="mt-2 text-sm text-gray-500">
            Step {step} of 3: {
              step === 1 ? 'Basic Information' :
              step === 2 ? 'Professional Details' :
              'Skills & Objectives'
            }
          </div>
        </div>

        <form onSubmit={step === 3 ? handleSubmit : (e) => e.preventDefault()} className="space-y-4 sm:space-y-6">
          {/* Step 1: Basic Information */}
          {step === 1 && (
            <>
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name *
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <input
                    id="name"
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full pl-10 pr-4 py-2 sm:py-3 border border-gray-300 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-brand-primary focus:border-brand-primary transition-colors text-sm sm:text-base"
                    placeholder="Enter your full name"
                    required
                  />
                </div>
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address *
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full pl-10 pr-4 py-2 sm:py-3 border border-gray-300 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-brand-primary focus:border-brand-primary transition-colors text-sm sm:text-base"
                    placeholder="Enter your email"
                    required
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  Password *
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                    className="w-full pl-10 pr-12 py-2 sm:py-3 border border-gray-300 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-brand-primary focus:border-brand-primary transition-colors text-sm sm:text-base"
                    placeholder="Create a password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                  Confirm Password *
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                    className="w-full pl-10 pr-12 py-2 sm:py-3 border border-gray-300 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-brand-primary focus:border-brand-primary transition-colors text-sm sm:text-base"
                    placeholder="Confirm your password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>
            </>
          )}

          {/* Step 2: Professional Details */}
          {step === 2 && (
            <>
              <div>
                <label htmlFor="profession" className="block text-sm font-medium text-gray-700 mb-2">
                  Job Title/Profession *
                </label>
                <div className="relative">
                  <Briefcase className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <input
                    id="profession"
                    type="text"
                    value={formData.profession}
                    onChange={(e) => setFormData(prev => ({ ...prev, profession: e.target.value }))}
                    className="w-full pl-10 pr-4 py-2 sm:py-3 border border-gray-300 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-brand-primary focus:border-brand-primary transition-colors text-sm sm:text-base"
                    placeholder="e.g., Senior Product Manager"
                    required
                  />
                </div>
              </div>

              <div>
                <label htmlFor="industry" className="block text-sm font-medium text-gray-700 mb-2">
                  Industry *
                </label>
                <select
                  id="industry"
                  value={formData.industry}
                  onChange={(e) => setFormData(prev => ({ ...prev, industry: e.target.value }))}
                  className="w-full p-2 sm:p-3 border border-gray-300 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-brand-primary focus:border-brand-primary transition-colors text-sm sm:text-base"
                  required
                >
                  <option value="">Select your industry</option>
                  {industries.map((industry) => (
                    <option key={industry} value={industry}>
                      {industry}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="experience" className="block text-sm font-medium text-gray-700 mb-2">
                  Experience Level *
                </label>
                <div className="relative">
                  <Award className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <select
                    id="experience"
                    value={formData.experience}
                    onChange={(e) => setFormData(prev => ({ ...prev, experience: e.target.value }))}
                    className="w-full pl-10 pr-4 py-2 sm:py-3 border border-gray-300 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-brand-primary focus:border-brand-primary transition-colors appearance-none text-sm sm:text-base"
                    required
                  >
                    <option value="">Select your experience level</option>
                    {experienceTiers.map((tier) => (
                      <option key={tier} value={tier}>
                        {tier}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-2">
                  Location *
                </label>
                <select
                  id="location"
                  value={formData.location}
                  onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                  className="w-full p-2 sm:p-3 border border-gray-300 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-brand-primary focus:border-brand-primary transition-colors text-sm sm:text-base"
                  required
                >
                  <option value="">Select your location</option>
                  {locations.map((location) => (
                    <option key={location} value={location}>
                      {location}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="field" className="block text-sm font-medium text-gray-700 mb-2">
                  Professional Field *
                </label>
                <select
                  id="field"
                  value={formData.field}
                  onChange={(e) => setFormData(prev => ({ ...prev, field: e.target.value }))}
                  className="w-full p-2 sm:p-3 border border-gray-300 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-brand-primary focus:border-brand-primary transition-colors text-sm sm:text-base"
                  required
                >
                  <option value="">Select your field</option>
                  {fields.map((field) => (
                    <option key={field} value={field}>
                      {field}
                    </option>
                  ))}
                </select>
              </div>
            </>
          )}

          {/* Step 3: Skills & Objectives */}
          {step === 3 && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <div className="flex items-center space-x-2">
                    <Tag className="h-4 w-4" />
                    <span>Skills & Expertise</span>
                  </div>
                </label>
                <div className="space-y-3">
                  <div className="flex flex-wrap gap-1 sm:gap-2">
                    {commonSkills.map((skill) => (
                      <button
                        key={skill}
                        type="button"
                        onClick={() => addSkill(skill)}
                        disabled={formData.skills.includes(skill)}
                        className={`px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm transition-colors ${
                          formData.skills.includes(skill)
                            ? 'bg-brand-primary text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {skill}
                      </button>
                    ))}
                  </div>
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={skillInput}
                      onChange={(e) => setSkillInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill(skillInput))}
                      className="flex-1 p-2 sm:p-3 border border-gray-300 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-brand-primary focus:border-brand-primary text-sm sm:text-base"
                      placeholder="Add custom skill..."
                    />
                    <button
                      type="button"
                      onClick={() => addSkill(skillInput)}
                      className="px-3 sm:px-4 py-2 sm:py-3 bg-brand-primary text-white rounded-lg sm:rounded-xl hover:bg-brand-secondary transition-colors text-sm sm:text-base"
                    >
                      Add
                    </button>
                  </div>
                  {formData.skills.length > 0 && (
                    <div className="flex flex-wrap gap-1 sm:gap-2">
                      {formData.skills.map((skill) => (
                        <span
                          key={skill}
                          className="inline-flex items-center px-2 sm:px-3 py-1 bg-brand-primary/10 text-brand-primary rounded-full text-xs sm:text-sm"
                        >
                          {skill}
                          <button
                            type="button"
                            onClick={() => removeSkill(skill)}
                            className="ml-2 text-brand-primary hover:text-brand-secondary"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <div className="flex items-center space-x-2">
                    <Target className="h-4 w-4" />
                    <span>Mentorship Objectives</span>
                  </div>
                </label>
                <div className="space-y-3">
                  <div className="flex flex-wrap gap-1 sm:gap-2">
                    {mentorshipObjectives.map((objective) => (
                      <button
                        key={objective}
                        type="button"
                        onClick={() => addObjective(objective)}
                        disabled={formData.objectives.includes(objective)}
                        className={`px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm transition-colors ${
                          formData.objectives.includes(objective)
                            ? 'bg-green-500 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {objective}
                      </button>
                    ))}
                  </div>
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={objectiveInput}
                      onChange={(e) => setObjectiveInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addObjective(objectiveInput))}
                      className="flex-1 p-2 sm:p-3 border border-gray-300 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-brand-primary focus:border-brand-primary text-sm sm:text-base"
                      placeholder="Add custom objective..."
                    />
                    <button
                      type="button"
                      onClick={() => addObjective(objectiveInput)}
                      className="px-3 sm:px-4 py-2 sm:py-3 bg-green-500 text-white rounded-lg sm:rounded-xl hover:bg-green-600 transition-colors text-sm sm:text-base"
                    >
                      Add
                    </button>
                  </div>
                  {formData.objectives.length > 0 && (
                    <div className="flex flex-wrap gap-1 sm:gap-2">
                      {formData.objectives.map((objective) => (
                        <span
                          key={objective}
                          className="inline-flex items-center px-2 sm:px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs sm:text-sm"
                        >
                          {objective}
                          <button
                            type="button"
                            onClick={() => removeObjective(objective)}
                            className="ml-2 text-green-600 hover:text-green-800"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <div className="flex items-center space-x-2">
                    <Target className="h-4 w-4" />
                    <span>Mentorship Goals (What you can offer)</span>
                  </div>
                </label>
                <div className="space-y-3">
                  <div className="flex flex-wrap gap-1 sm:gap-2">
                    {mentorshipGoals.map((goal) => (
                      <button
                        key={goal}
                        type="button"
                        onClick={() => addMentorshipGoal(goal)}
                        disabled={formData.mentorshipGoals.includes(goal)}
                        className={`px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm transition-colors ${
                          formData.mentorshipGoals.includes(goal)
                            ? 'bg-purple-500 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {goal}
                      </button>
                    ))}
                  </div>
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={mentorshipGoalInput}
                      onChange={(e) => setMentorshipGoalInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addMentorshipGoal(mentorshipGoalInput))}
                      className="flex-1 p-2 sm:p-3 border border-gray-300 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-brand-primary focus:border-brand-primary text-sm sm:text-base"
                      placeholder="Add custom mentorship goal..."
                    />
                    <button
                      type="button"
                      onClick={() => addMentorshipGoal(mentorshipGoalInput)}
                      className="px-3 sm:px-4 py-2 sm:py-3 bg-purple-500 text-white rounded-lg sm:rounded-xl hover:bg-purple-600 transition-colors text-sm sm:text-base"
                    >
                      Add
                    </button>
                  </div>
                  {formData.mentorshipGoals.length > 0 && (
                    <div className="flex flex-wrap gap-1 sm:gap-2">
                      {formData.mentorshipGoals.map((goal) => (
                        <span
                          key={goal}
                          className="inline-flex items-center px-2 sm:px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs sm:text-sm"
                        >
                          {goal}
                          <button
                            type="button"
                            onClick={() => removeMentorshipGoal(goal)}
                            className="ml-2 text-purple-600 hover:text-purple-800"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Availability Status
                </label>
                <select
                  value={formData.availabilityStatus}
                  onChange={(e) => setFormData(prev => ({ ...prev, availabilityStatus: e.target.value }))}
                  className="w-full p-2 sm:p-3 border border-gray-300 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-brand-primary focus:border-brand-primary text-sm sm:text-base"
                >
                  <option value="available">Available for sessions</option>
                  <option value="limited">Limited availability</option>
                  <option value="busy">Currently busy</option>
                  <option value="mentor-only">Mentoring only</option>
                </select>
              </div>
            </>
          )}

          {/* Navigation Buttons */}
          <div className="flex flex-col sm:flex-row justify-between gap-3 sm:gap-0 pt-4">
            {step > 1 && (
              <button
                type="button"
                onClick={handleBack}
                className="w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-3 text-gray-700 bg-gray-100 rounded-lg sm:rounded-xl hover:bg-gray-200 transition-colors text-sm sm:text-base"
              >
                Back
              </button>
            )}
            
            <div className="w-full sm:w-auto sm:ml-auto">
              {step < 3 ? (
                <button
                  type="button"
                  onClick={handleNext}
                  className="w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-brand-primary to-brand-secondary text-white rounded-lg sm:rounded-xl hover:from-brand-primary/90 hover:to-brand-secondary/90 transition-all text-sm sm:text-base"
                >
                  Next
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-brand-primary to-brand-secondary text-white rounded-lg sm:rounded-xl hover:from-brand-primary/90 hover:to-brand-secondary/90 focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
                >
                  {loading ? 'Creating Account...' : 'Create Account'}
                </button>
              )}
            </div>
          </div>
        </form>

        <div className="mt-4 sm:mt-6 text-center">
          <p className="text-gray-600">
            Already have an account?{' '}
            <button
              onClick={onSwitchToLogin}
              className="text-brand-primary hover:text-brand-secondary font-semibold"
            >
              Sign In
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};