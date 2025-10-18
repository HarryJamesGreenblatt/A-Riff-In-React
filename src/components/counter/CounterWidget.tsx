import React, { useState } from 'react';
import { useGetCounterQuery, useIncrementCounterMutation, useResetCounterMutation } from '../../features/counter/slice';
import { Button } from '../ui/Button';

/**
 * CounterWidget Component
 * 
 * Demonstrates Cosmos DB integration with a simple user-specific counter
 * that persists across sessions.
 */
export const CounterWidget: React.FC = () => {
  const { data: counter, isLoading, error } = useGetCounterQuery();
  const [incrementCounter, { isLoading: isIncrementing }] = useIncrementCounterMutation();
  const [resetCounter, { isLoading: isResetting }] = useResetCounterMutation();
  const [customAmount, setCustomAmount] = useState(1);

  const handleIncrement = async (amount: number = 1) => {
    try {
      await incrementCounter({ amount }).unwrap();
    } catch (err) {
      console.error('Failed to increment counter:', err);
    }
  };

  const handleReset = async () => {
    if (window.confirm('Are you sure you want to reset your counter to 0?')) {
      try {
        await resetCounter().unwrap();
      } catch (err) {
        console.error('Failed to reset counter:', err);
      }
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 bg-white rounded-lg shadow-md">
        <p className="text-gray-600">Loading counter...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-white rounded-lg shadow-md">
        <p className="text-red-600">Error loading counter. Please try again.</p>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gradient-to-br from-purple-50 to-blue-50 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold text-gray-800 mb-2">Your Counter</h2>
      <p className="text-sm text-gray-600 mb-4">Powered by Azure Cosmos DB</p>

      {/* Counter Display */}
      <div className="bg-white rounded-lg p-8 mb-6 text-center shadow-inner">
        <div className="text-6xl font-bold text-blue-600 mb-2">
          {counter?.count ?? 0}
        </div>
        {counter?.lastUpdated && (
          <p className="text-xs text-gray-500">
            Last updated: {new Date(counter.lastUpdated).toLocaleString()}
          </p>
        )}
      </div>

      {/* Quick Actions */}
      <div className="space-y-3">
        <div className="flex gap-2">
          <Button
            onClick={() => handleIncrement(1)}
            disabled={isIncrementing || isResetting}
            className="flex-1"
            variant="primary"
          >
            {isIncrementing ? 'Incrementing...' : '+1'}
          </Button>
          <Button
            onClick={() => handleIncrement(5)}
            disabled={isIncrementing || isResetting}
            className="flex-1"
            variant="primary"
          >
            +5
          </Button>
          <Button
            onClick={() => handleIncrement(10)}
            disabled={isIncrementing || isResetting}
            className="flex-1"
            variant="primary"
          >
            +10
          </Button>
        </div>

        {/* Custom Amount */}
        <div className="flex gap-2 items-center">
          <label htmlFor="customAmount" className="text-sm font-medium text-gray-700">
            Custom:
          </label>
          <input
            id="customAmount"
            type="number"
            min="1"
            max="1000"
            value={customAmount}
            onChange={(e) => setCustomAmount(parseInt(e.target.value) || 1)}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <Button
            onClick={() => handleIncrement(customAmount)}
            disabled={isIncrementing || isResetting || customAmount < 1}
            variant="outline"
          >
            Add
          </Button>
        </div>

        {/* Reset Button */}
        <Button
          onClick={handleReset}
          disabled={isIncrementing || isResetting || (counter?.count ?? 0) === 0}
          variant="secondary"
          className="w-full bg-red-600 hover:bg-red-700 text-white"
        >
          {isResetting ? 'Resetting...' : 'Reset Counter'}
        </Button>
      </div>

      {/* Info */}
      <div className="mt-4 p-3 bg-blue-100 rounded-md">
        <p className="text-xs text-blue-800">
          ?? Your counter is stored in Azure Cosmos DB and persists across sessions. Try logging out and back in!
        </p>
      </div>
    </div>
  );
};
