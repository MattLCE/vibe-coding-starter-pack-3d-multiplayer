# SpacetimeDB Multiplayer Stress Testing Plan

## Phase 1: Local Bot Client Implementation
- [x] 1.1. Create `BotClient` class in `client/src/testing/BotClient.ts`
  - [x] Implement connection to SpacetimeDB
  - [x] Add basic movement patterns (random, circle, grid)
  - [x] Add configurable update frequency
  - [x] Add client-side metrics collection (FPS, latency)

- [x] 1.2. Create `BotManager` class in `client/src/testing/BotManager.ts`
  - [x] Implement bot spawning/despawning
  - [x] Add bot movement coordination
  - [x] Add aggregate metrics collection
  - [x] Add configurable bot count limits

- [x] 1.3. Create stress test UI in `client/src/components/StressTestPanel.tsx`
  - [x] Add bot count controls
  - [x] Add movement pattern selector
  - [x] Add metrics display
  - [x] Add test duration controls

## Phase 2: Server-Side Metrics Implementation
- [x] 2.1. Add server metrics collection in `server/src/metrics.rs`
  - [x] Track connected clients count
  - [x] Track updates per second
  - [x] Track average update time
  - [x] Track memory usage (TODO: Implement)
  - [x] Track CPU usage (TODO: Implement)

- [x] 2.2. Create metrics reducer and table
  - [x] Add metrics table to store performance data
  - [x] Add reducer to update metrics periodically
  - [x] Add client subscription for metrics data

- [x] Add server metrics to StressTestPanel

## Phase 3: Load Testing Framework
- [x] 3.1. Create automated test scenarios
  - [x] Implement gradual bot count increase
  - [x] Add configurable test duration
  - [x] Add automatic metrics collection

- [x] 3.2. Add performance thresholds
  - [x] Define acceptable latency ranges
  - [x] Define minimum FPS requirements
  - [x] Define maximum memory usage limits
  - [x] Add automatic test termination on threshold breach

## Phase 4: Cloud Deployment Testing
- [ ] 4.1. Document cloud deployment process
  - [ ] Add Railway deployment guide
  - [ ] Add Render deployment guide
  - [ ] Document environment variables
  - [ ] Document scaling options

- [ ] 4.2. Create distributed testing setup
  - [ ] Modify BotManager for distributed operation
  - [ ] Add bot instance coordination
  - [ ] Add aggregate metrics collection
  - [ ] Add network latency compensation

## Phase 5: Analysis and Optimization
- [ ] 5.1. Create performance analysis tools
  - [ ] Add metrics visualization
  - [ ] Add bottleneck identification
  - [ ] Add performance comparison tools
  - [ ] Add report generation

- [ ] 5.2. Document optimization strategies
  - [ ] Server-side optimizations
  - [ ] Network protocol optimizations
  - [ ] Client-side optimizations
  - [ ] Scaling recommendations

## Implementation Details

### Phase 1 Implementation Notes:

1. BotClient Features:
   - Connection management with SpacetimeDB
   - Three movement patterns: random, circle, grid
   - Configurable update frequency (default 60Hz)
   - Performance metrics tracking (latency, FPS)
   - Automatic cleanup on disconnect

2. BotManager Features:
   - Centralized bot spawning/despawning
   - Configurable max bots and spawn rate
   - Aggregate metrics collection
   - Pattern coordination across all bots
   - Automatic cleanup on stop

3. StressTestPanel Features:
   - Real-time metrics display
   - Bot count and spawn rate controls
   - Movement pattern selection
   - Start/Stop functionality
   - Clean UI with dark theme

### Phase 2 Implementation Notes:

1. Server Metrics Features:
   - Rolling window metrics collection (60 second history)
   - Per-update timing measurements
   - Automatic cleanup of old metrics
   - Periodic metrics aggregation (every 1 second)
   - Real-time client count tracking

2. Metrics Tables:
   - ServerMetrics: Current server state
   - MetricsWindow: Rolling window for performance data

3. TODO Items:
   - Implement memory usage tracking
   - Implement CPU usage monitoring
   - Add metrics visualization
   - Add export functionality

### Next Steps:
1. Implement memory and CPU tracking
2. Add real-time graphs to StressTestPanel
3. Add metrics export feature
4. Test with increasing bot counts

## Notes
- Each bot should simulate realistic player behavior
- Metrics should be collected without impacting performance
- Tests should be reproducible
- Documentation should be maintained throughout
- Consider adding CI/CD integration for automated testing

## Success Criteria
1. Successfully run 100+ bots locally
2. Maintain 60 FPS with 50+ bots
3. Keep server latency under 100ms
4. Generate comprehensive performance reports
5. Identify clear scaling limits
6. Document all findings and recommendations 