import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { rideApi } from '../services/api';
import Header from '../components/Header';
import Alert from '../components/Alert';

export default function NewRide() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    originLocation: '',
    destination: 'LAX',
    departureDatetime: '',
    maxPassengers: 2,
    costSplitPreference: 'EQUAL',
    flexibleTime: false,
    timeFlexibilityMinutes: 0,
    notes: '',
  });

  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  const destinations = ['LAX', 'BUR', 'ONT', 'UNION_STATION'];
  const costSplitOptions = [
    { value: 'EQUAL', label: 'Equal' },
    { value: 'BY_DISTANCE', label: 'By Distance' },
  ];

  const validateForm = () => {
    const newErrors = {};

    if (!formData.originLocation.trim()) {
      newErrors.originLocation = 'Origin is required';
    }

    if (!formData.departureDatetime) {
      newErrors.departureDatetime = 'Departure date and time are required';
    } else {
      const departureDate = new Date(formData.departureDatetime);
      if (departureDate <= new Date()) {
        newErrors.departureDatetime = 'Departure must be in the future';
      }
    }

    if (formData.flexibleTime && formData.timeFlexibilityMinutes <= 0) {
      newErrors.timeFlexibilityMinutes = 'Flexibility minutes must be greater than 0';
    }

    if (formData.maxPassengers < 1 || formData.maxPassengers > 3) {
      newErrors.maxPassengers = 'Passengers must be between 1 and 3';
    }

    if (formData.notes && formData.notes.length > 300) {
      newErrors.notes = 'Notes cannot exceed 300 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
    if (errors[field]) {
      setErrors({ ...errors, [field]: null });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setSubmitting(true);
    setSubmitError(null);

    try {
      const dataToSubmit = {
        ...formData,
        departureDatetime: new Date(formData.departureDatetime).toISOString(),
      };

      await rideApi.createRide(dataToSubmit);
      navigate('/rides');
    } catch (err) {
      setSubmitError(err.response?.data?.message || 'Failed to create ride');
    } finally {
      setSubmitting(false);
    }
  };

  const isFormValid = () => {
    return (
      formData.originLocation.trim() &&
      formData.departureDatetime &&
      (!formData.flexibleTime || formData.timeFlexibilityMinutes > 0)
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <h1 className="text-3xl font-bold text-cardinal-red mb-6">Create a Ride</h1>

        {submitError && (
          <div className="mb-6">
            <Alert type="error" message={submitError} />
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6">
          <div className="space-y-6">
            {/* Origin */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Origin <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.originLocation}
                onChange={(e) => handleChange('originLocation', e.target.value)}
                placeholder="USC Village"
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-cardinal-red ${
                  errors.originLocation ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.originLocation && (
                <p className="text-red-500 text-sm mt-1">{errors.originLocation}</p>
              )}
            </div>

            {/* Destination */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Destination <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.destination}
                onChange={(e) => handleChange('destination', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cardinal-red"
              >
                {destinations.map((dest) => (
                  <option key={dest} value={dest}>
                    {dest.replace('_', ' ')}
                  </option>
                ))}
              </select>
            </div>

            {/* Date and Time */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Departure Date & Time <span className="text-red-500">*</span>
              </label>
              <input
                type="datetime-local"
                value={formData.departureDatetime}
                onChange={(e) => handleChange('departureDatetime', e.target.value)}
                min={new Date().toISOString().slice(0, 16)}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-cardinal-red ${
                  errors.departureDatetime ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.departureDatetime && (
                <p className="text-red-500 text-sm mt-1">{errors.departureDatetime}</p>
              )}
            </div>

            {/* Max Passengers */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Max Passengers (1-3)
              </label>
              <input
                type="number"
                min="1"
                max="3"
                value={formData.maxPassengers}
                onChange={(e) => handleChange('maxPassengers', parseInt(e.target.value))}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-cardinal-red ${
                  errors.maxPassengers ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.maxPassengers && (
                <p className="text-red-500 text-sm mt-1">{errors.maxPassengers}</p>
              )}
            </div>

            {/* Cost Split Preference */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Cost Split Preference
              </label>
              <select
                value={formData.costSplitPreference}
                onChange={(e) => handleChange('costSplitPreference', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cardinal-red"
              >
                {costSplitOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Flexible Time Checkbox */}
            <div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.flexibleTime}
                  onChange={(e) => handleChange('flexibleTime', e.target.checked)}
                  className="mr-2 h-4 w-4 text-cardinal-red focus:ring-cardinal-red border-gray-300 rounded"
                />
                <span className="text-sm font-medium text-gray-700">
                  Flexible time?
                </span>
              </label>
            </div>

            {/* Time Flexibility Minutes (conditional) */}
            {formData.flexibleTime && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Time Flexibility (minutes)
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.timeFlexibilityMinutes}
                  onChange={(e) => handleChange('timeFlexibilityMinutes', parseInt(e.target.value))}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-cardinal-red ${
                    errors.timeFlexibilityMinutes ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.timeFlexibilityMinutes && (
                  <p className="text-red-500 text-sm mt-1">{errors.timeFlexibilityMinutes}</p>
                )}
              </div>
            )}

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notes (optional, max 300 characters)
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => handleChange('notes', e.target.value)}
                maxLength="300"
                rows="3"
                placeholder="Any additional details (e.g., 'Two bags; can leave 30 min earlier if needed')"
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-cardinal-red ${
                  errors.notes ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              <p className="text-sm text-gray-500 mt-1">
                {formData.notes.length}/300 characters
              </p>
              {errors.notes && (
                <p className="text-red-500 text-sm mt-1">{errors.notes}</p>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-4 mt-6">
            <button
              type="button"
              onClick={() => navigate('/rides')}
              className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!isFormValid() || submitting}
              className="px-6 py-2 bg-cardinal-red text-white rounded-md hover:bg-red-800 transition disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {submitting ? 'Creating...' : 'Create Ride'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
