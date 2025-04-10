import { BotClient, MovementPattern, BotMetrics } from './BotClient';

// Add NodeJS types
type Timeout = ReturnType<typeof setTimeout>;

export interface AggregateMetrics {
    totalBots: number;
    averageLatency: number;
    averageFPS: number;
    serverLoad: number;
    memoryUsage: number;
    cpuUsage: number;
    activePatterns: { [key in MovementPattern]: number };
}

export class BotManager {
    private bots: Map<string, BotClient> = new Map();
    private metrics: AggregateMetrics = {
        totalBots: 0,
        averageLatency: 0,
        averageFPS: 0,
        serverLoad: 0,
        memoryUsage: 0,
        cpuUsage: 0,
        activePatterns: {
            random: 0,
            circle: 0,
            grid: 0
        }
    };
    private updateInterval: Timeout | null = null;
    private latencyThreshold: number = 100; // in milliseconds
    private fpsThreshold: number = 30; // minimum FPS
    private memoryUsageThreshold: number = 500; // in MB
    private metricsHistory: AggregateMetrics[] = []; // Store metrics history

    constructor(
        private maxBots: number = 100,
        private spawnRate: number = 1,
        private updateFrequency: number = 60,
        private defaultPattern: MovementPattern = 'random'
    ) {}

    async start(): Promise<void> {
        // Start periodic bot spawning
        this.updateInterval = setInterval(() => {
            for (let i = 0; i < this.spawnRate; i++) {
                if (this.bots.size < this.maxBots) {
                    this.spawnBot();
                }
            }
            this.updateMetrics();
        }, 1000); // Update every second
    }

    stop(): void {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }
        // Disconnect all bots
        this.bots.forEach(bot => bot.disconnect());
        this.bots.clear();
        this.resetMetrics();
    }

    private async spawnBot(): Promise<void> {
        try {
            const botId = `bot_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            const bot = new BotClient(botId, this.updateFrequency);
            
            await bot.connect();
            bot.setMovementPattern(this.defaultPattern);
            
            this.bots.set(botId, bot);
            this.metrics.activePatterns[this.defaultPattern]++;
            this.metrics.totalBots = this.bots.size;
            
            console.log(`Bot ${botId} spawned successfully. Total bots: ${this.bots.size}`);
        } catch (error) {
            console.error('Failed to spawn bot:', error);
        }
    }

    async despawnBot(botId: string): Promise<void> {
        const bot = this.bots.get(botId);
        if (bot) {
            const pattern = bot.getCurrentPattern();
            this.metrics.activePatterns[pattern]--;
            await bot.disconnect();
            this.bots.delete(botId);
            this.metrics.totalBots = this.bots.size;
            console.log(`Bot ${botId} despawned. Total bots: ${this.bots.size}`);
        }
    }

    setMovementPattern(pattern: MovementPattern): void {
        this.defaultPattern = pattern;
        // Update all existing bots
        this.bots.forEach(bot => bot.setMovementPattern(pattern));
        // Update metrics
        this.resetPatternMetrics();
        this.metrics.activePatterns[pattern] = this.bots.size;
    }

    getMetrics(): AggregateMetrics {
        return { ...this.metrics };
    }

    private updateMetrics(): void {
        let totalLatency = 0;
        let totalFPS = 0;

        this.bots.forEach(bot => {
            const botMetrics = bot.getMetrics();
            totalLatency += botMetrics.latency;
            totalFPS += 1000 / botMetrics.averageUpdateTime; // Convert update time to FPS
        });

        const botCount = this.bots.size;
        if (botCount > 0) {
            this.metrics.averageLatency = totalLatency / botCount;
            this.metrics.averageFPS = totalFPS / botCount;
        }

        // Update server metrics
        this.metrics.memoryUsage = this.getServerMemoryUsage();
        this.metrics.cpuUsage = this.getServerCPUUsage();

        // Store the current metrics in history
        this.metricsHistory.push({ ...this.metrics });

        // Check performance thresholds
        this.checkPerformanceThresholds();
    }

    private checkPerformanceThresholds(): void {
        if (this.metrics.averageLatency > this.latencyThreshold) {
            console.warn('Latency threshold exceeded. Terminating test.');
            this.stop();
        }
        if (this.metrics.averageFPS < this.fpsThreshold) {
            console.warn('FPS threshold not met. Terminating test.');
            this.stop();
        }
        if (this.metrics.memoryUsage > this.memoryUsageThreshold) {
            console.warn('Memory usage threshold exceeded. Terminating test.');
            this.stop();
        }
    }

    private getServerMemoryUsage(): number {
        // Placeholder for actual memory usage retrieval logic
        return 0;
    }

    private getServerCPUUsage(): number {
        // Placeholder for actual CPU usage retrieval logic
        return 0;
    }

    private resetMetrics(): void {
        this.metrics = {
            totalBots: 0,
            averageLatency: 0,
            averageFPS: 0,
            serverLoad: 0,
            memoryUsage: 0,
            cpuUsage: 0,
            activePatterns: {
                random: 0,
                circle: 0,
                grid: 0
            }
        };
    }

    private resetPatternMetrics(): void {
        this.metrics.activePatterns = {
            random: 0,
            circle: 0,
            grid: 0
        };
    }
} 