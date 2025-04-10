import React, { useState, useEffect } from 'react';
import { BotManager, AggregateMetrics } from '../testing/BotManager';
import { MovementPattern } from '../testing/BotClient';
import './StressTestPanel.css';
import { Line } from 'react-chartjs-2';

interface StressTestPanelProps {
    className?: string;
}

export function StressTestPanel({ className }: StressTestPanelProps) {
    const [botManager] = useState(() => new BotManager());
    const [isRunning, setIsRunning] = useState(false);
    const [maxBots, setMaxBots] = useState(100);
    const [spawnRate, setSpawnRate] = useState(1);
    const [pattern, setPattern] = useState<MovementPattern>('random');
    const [metrics, setMetrics] = useState<AggregateMetrics | null>(null);

    useEffect(() => {
        let metricsInterval: ReturnType<typeof setInterval> | null = null;

        if (isRunning) {
            botManager.start();
            metricsInterval = setInterval(() => {
                setMetrics(botManager.getMetrics());
            }, 1000);
        } else if (metricsInterval) {
            botManager.stop();
            clearInterval(metricsInterval);
        }

        return () => {
            if (metricsInterval) {
                clearInterval(metricsInterval);
            }
            botManager.stop();
        };
    }, [isRunning, botManager]);

    const handleMaxBotsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = parseInt(e.target.value, 10);
        if (!isNaN(value) && value > 0) {
            setMaxBots(value);
            // Update bot manager configuration
            botManager['maxBots'] = value;
        }
    };

    const handleSpawnRateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = parseInt(e.target.value, 10);
        if (!isNaN(value) && value > 0) {
            setSpawnRate(value);
            // Update bot manager configuration
            botManager['spawnRate'] = value;
        }
    };

    const handlePatternChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newPattern = e.target.value as MovementPattern;
        setPattern(newPattern);
        botManager.setMovementPattern(newPattern);
    };

    const serverMetrics = metrics ? {
        memoryUsage: metrics.memoryUsage.toFixed(2),
        cpuUsage: metrics.cpuUsage.toFixed(2)
    } : { memoryUsage: 'N/A', cpuUsage: 'N/A' };

    const data = {
        labels: ['1s', '2s', '3s', '4s', '5s'],
        datasets: [
            {
                label: 'Memory Usage (MB)',
                data: [65, 59, 80, 81, 56],
                fill: false,
                backgroundColor: 'rgba(75,192,192,0.4)',
                borderColor: 'rgba(75,192,192,1)',
            },
            {
                label: 'CPU Usage (%)',
                data: [28, 48, 40, 19, 86],
                fill: false,
                backgroundColor: 'rgba(153,102,255,0.4)',
                borderColor: 'rgba(153,102,255,1)',
            },
        ],
    };

    return (
        <div className={`stress-test-panel ${className || ''}`}>
            <h2>Stress Test Controls</h2>
            
            <div className="control-group">
                <label>
                    Max Bots:
                    <input 
                        type="number" 
                        value={maxBots} 
                        onChange={handleMaxBotsChange}
                        min="1"
                        max="1000"
                    />
                </label>
            </div>

            <div className="control-group">
                <label>
                    Spawn Rate (bots/sec):
                    <input 
                        type="number" 
                        value={spawnRate} 
                        onChange={handleSpawnRateChange}
                        min="1"
                        max="10"
                    />
                </label>
            </div>

            <div className="control-group">
                <label>
                    Movement Pattern:
                    <select value={pattern} onChange={handlePatternChange}>
                        <option value="random">Random</option>
                        <option value="circle">Circle</option>
                        <option value="grid">Grid</option>
                    </select>
                </label>
            </div>

            <button 
                onClick={() => setIsRunning(!isRunning)}
                className={`toggle-button ${isRunning ? 'running' : ''}`}
            >
                {isRunning ? 'Stop Test' : 'Start Test'}
            </button>

            {metrics && (
                <div className="metrics">
                    <h3>Metrics</h3>
                    <div className="metric-item">
                        <span>Total Bots:</span>
                        <span>{metrics.totalBots}</span>
                    </div>
                    <div className="metric-item">
                        <span>Average Latency:</span>
                        <span>{metrics.averageLatency.toFixed(2)}ms</span>
                    </div>
                    <div className="metric-item">
                        <span>Average FPS:</span>
                        <span>{metrics.averageFPS.toFixed(1)}</span>
                    </div>
                    <div className="metric-item">
                        <span>Server Load:</span>
                        <span>{metrics.serverLoad.toFixed(1)}%</span>
                    </div>
                    <div className="metric-item">
                        <span>Memory Usage:</span>
                        <span>{serverMetrics.memoryUsage} MB</span>
                    </div>
                    <div className="metric-item">
                        <span>CPU Usage:</span>
                        <span>{serverMetrics.cpuUsage} %</span>
                    </div>
                    <Line data={data} />
                    <div className="pattern-distribution">
                        <h4>Movement Patterns:</h4>
                        {Object.entries(metrics.activePatterns).map(([pattern, count]) => (
                            <div key={pattern} className="pattern-item">
                                <span>{pattern}:</span>
                                <span>{count}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
} 