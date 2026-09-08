import React from 'react';
import { Stopwatch } from '@/components/Stopwatch';

const StopwatchPage = () => {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Stopwatch />
    </div>
  );
};

export default StopwatchPage;