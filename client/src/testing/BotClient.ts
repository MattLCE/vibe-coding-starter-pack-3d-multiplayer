/**
 * BotClient.ts
 * Simulates a player client for stress testing the SpacetimeDB multiplayer system
 */

import { Identity } from '@clockworklabs/spacetimedb-sdk';
import * as moduleBindings from '../generated';
import { Vector3, InputState, PlayerData } from '../generated';

export type MovementPattern = 'random' | 'circle' | 'grid';

export interface BotMetrics {
    latency: number;
    lastUpdateTime: number;
    updateCount: number;
    averageUpdateTime: number;
}

export class BotClient {
    private conn: moduleBindings.DbConnection | null = null;
    private identity: Identity | null = null;
    private position: Vector3 = { x: 0, y: 0, z: 0 };
    private rotation: Vector3 = { x: 0, y: 0, z: 0 };
    private inputState: InputState = {
        forward: false,
        backward: false,
        left: false,
        right: false,
        sprint: false,
        jump: false,
        attack: false,
        castSpell: false,
        sequence: 0
    };

    private movementPattern: MovementPattern = 'random';
    private updateInterval: number = 1000 / 60; // 60 fps default
    private lastUpdate: number = 0;
    private metrics: BotMetrics = {
        latency: 0,
        lastUpdateTime: 0,
        updateCount: 0,
        averageUpdateTime: 0
    };

    // Movement pattern variables
    private circleRadius: number = 5;
    private circleAngle: number = 0;
    private gridPosition: { x: number, z: number } = { x: 0, z: 0 };
    private gridSize: number = 10;

    constructor(
        private botId: string,
        private updateFrequency: number = 60
    ) {
        this.updateInterval = 1000 / updateFrequency;
    }

    getCurrentPattern(): MovementPattern {
        return this.movementPattern;
    }

    async connect(): Promise<void> {
        try {
            // Connect to SpacetimeDB
            this.conn = await moduleBindings.DbConnection.builder()
                .withUri("ws://localhost:3000")
                .withModuleName("vibe-multiplayer")
                .onConnect((connection: moduleBindings.DbConnection, id: Identity) => {
                    this.conn = connection;
                    this.identity = id;
                    console.log(`Bot ${this.botId} connected with identity: ${id}`);
                    this.registerPlayer();
                })
                .onDisconnect((_ctx: any, reason?: Error | null) => {
                    const reasonStr = reason ? reason.message : "No reason given";
                    console.log(`Bot ${this.botId} disconnected: ${reasonStr}`);
                    this.conn = null;
                    this.identity = null;
                })
                .build();

        } catch (error) {
            console.error(`Bot ${this.botId} failed to connect:`, error);
            throw error;
        }
    }

    private registerPlayer(): void {
        if (!this.conn) return;

        // Register the bot as a player
        this.conn.reducers.registerPlayer(
            `Bot_${this.botId.slice(0, 6)}`,
            'Wizard', // Using Wizard as default character class
            { r: Math.random(), g: Math.random(), b: Math.random() } // Random color
        );
    }

    setMovementPattern(pattern: MovementPattern): void {
        this.movementPattern = pattern;
    }

    private updateMovement(): void {
        switch (this.movementPattern) {
            case 'random':
                this.updateRandomMovement();
                break;
            case 'circle':
                this.updateCircleMovement();
                break;
            case 'grid':
                this.updateGridMovement();
                break;
        }
    }

    private updateRandomMovement(): void {
        // Randomly change direction every 2 seconds
        if (Date.now() - this.lastUpdate > 2000) {
            this.inputState = {
                ...this.inputState,
                forward: Math.random() > 0.5,
                backward: Math.random() > 0.5,
                left: Math.random() > 0.5,
                right: Math.random() > 0.5,
                sprint: Math.random() > 0.7,
                sequence: this.inputState.sequence + 1
            };
            this.lastUpdate = Date.now();
        }
    }

    private updateCircleMovement(): void {
        // Move in a circle
        this.circleAngle += 0.02;
        const x = Math.cos(this.circleAngle) * this.circleRadius;
        const z = Math.sin(this.circleAngle) * this.circleRadius;
        
        // Calculate direction to move along circle
        this.inputState = {
            ...this.inputState,
            forward: true,
            backward: false,
            left: this.circleAngle % (Math.PI * 2) < Math.PI,
            right: this.circleAngle % (Math.PI * 2) >= Math.PI,
            sprint: false,
            sequence: this.inputState.sequence + 1
        };
        
        // Update rotation to face movement direction
        this.rotation = {
            ...this.rotation,
            y: this.circleAngle + Math.PI / 2
        };
    }

    private updateGridMovement(): void {
        // Move in a grid pattern
        const cellSize = 2;
        const targetX = (this.gridPosition.x * cellSize) - (this.gridSize * cellSize / 2);
        const targetZ = (this.gridPosition.z * cellSize) - (this.gridSize * cellSize / 2);
        
        // Move to next grid position when close to target
        if (Math.abs(this.position.x - targetX) < 0.1 && Math.abs(this.position.z - targetZ) < 0.1) {
            this.gridPosition.x++;
            if (this.gridPosition.x >= this.gridSize) {
                this.gridPosition.x = 0;
                this.gridPosition.z++;
                if (this.gridPosition.z >= this.gridSize) {
                    this.gridPosition.z = 0;
                }
            }
        }

        // Calculate direction to target
        const dx = targetX - this.position.x;
        const dz = targetZ - this.position.z;
        const angle = Math.atan2(dx, dz);

        this.rotation = {
            ...this.rotation,
            y: angle
        };

        this.inputState = {
            ...this.inputState,
            forward: true,
            backward: false,
            left: false,
            right: false,
            sprint: false,
            sequence: this.inputState.sequence + 1
        };
    }

    update(): void {
        if (!this.conn || !this.identity) return;

        const now = Date.now();
        if (now - this.lastUpdate >= this.updateInterval) {
            const updateStart = performance.now();
            
            // Update movement based on pattern
            this.updateMovement();

            // Send input to server
            this.conn.reducers.updatePlayerInput(
                this.inputState,
                this.position,
                this.rotation,
                this.inputState.forward ? 'walk-forward' : 'idle'
            );

            // Update metrics
            const updateEnd = performance.now();
            this.metrics.updateCount++;
            this.metrics.lastUpdateTime = updateEnd - updateStart;
            this.metrics.averageUpdateTime = 
                (this.metrics.averageUpdateTime * (this.metrics.updateCount - 1) + this.metrics.lastUpdateTime) 
                / this.metrics.updateCount;

            this.lastUpdate = now;
        }
    }

    getMetrics(): BotMetrics {
        return { ...this.metrics };
    }

    disconnect(): void {
        if (this.conn) {
            this.conn = null;
            this.identity = null;
        }
    }
} 