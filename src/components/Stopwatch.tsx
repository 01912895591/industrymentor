import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Play, Pause, RotateCcw } from 'lucide-react';

export function Stopwatch() {
  const [time, setTime] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setTime(prevTime => prevTime + 10);
      }, 10);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning]);

  const formatTime = (milliseconds: number) => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    const ms = Math.floor((milliseconds % 1000) / 10);

    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
  };

  const handleStart = () => {
    setIsRunning(true);
  };

  const handlePause = () => {
    setIsRunning(false);
  };

  const handleReset = () => {
    setIsRunning(false);
    setTime(0);
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-center">Stopwatch</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="text-6xl font-mono text-center tabular-nums">
          {formatTime(time)}
        </div>
        
        <div className="flex justify-center gap-4">
          {!isRunning ? (
            <Button onClick={handleStart} size="lg" className="w-24">
              <Play className="w-4 h-4 mr-2" />
              Start
            </Button>
          ) : (
            <Button onClick={handlePause} size="lg" variant="secondary" className="w-24">
              <Pause className="w-4 h-4 mr-2" />
              Pause
            </Button>
          )}
          
          <Button onClick={handleReset} size="lg" variant="outline" className="w-24">
            <RotateCcw className="w-4 h-4 mr-2" />
            Reset
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}