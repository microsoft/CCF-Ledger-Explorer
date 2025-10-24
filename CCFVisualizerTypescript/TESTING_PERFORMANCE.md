# Testing SQLite Performance Improvements

## Quick Test Guide

### 1. Check Database Configuration

After loading the app, open the browser console and run:

```javascript
// This will show the current PRAGMA settings
// Look for the Config page or Stats page which should display these
```

Expected values:
- **Journal Mode**: `wal` (not `delete` or `memory`)
- **Cache Size**: `-10000` (10MB)
- **Page Size**: `8192` (8KB pages)
- **Synchronous**: Should be optimized

### 2. Test Import Performance

1. Open the CCF Visualizer app
2. Open browser DevTools Console
3. Note the timestamp before importing
4. Import a ledger file
5. Watch the console logs for progress messages:
   ```
   [DB Worker] Inserting 1000/5000 transactions...
   [DB Worker] Inserting 2000/5000 transactions...
   [DB Worker] Inserting 5000/10000 writes...
   ```
6. Note the timestamp when complete

**Performance Targets:**
- 1,000 transactions: < 1 second
- 10,000 transactions: < 5 seconds
- 50,000 transactions: < 25 seconds

### 3. Test Query Performance

After importing data:

1. Navigate between different views (Tables, Stats, Visualization)
2. Search for specific transactions
3. Filter by map names
4. Check transaction details

All operations should feel snappy (< 100ms response time).

### 4. Test OPFS Persistence

1. Import a ledger file
2. Wait for import to complete
3. **Refresh the page** (F5)
4. Data should still be there (loaded from OPFS)
5. No re-import should be needed

### 5. Monitor Browser Performance

**Chrome DevTools Method:**
1. Open DevTools → Performance tab
2. Click Record (●)
3. Import a ledger file
4. Stop recording
5. Look for:
   - Long tasks (anything > 50ms in orange/red)
   - OPFS operations (should be in background)
   - Main thread should not be blocked

**Memory Profiling:**
1. DevTools → Memory tab
2. Take a heap snapshot before import
3. Import a file
4. Take another heap snapshot
5. Compare - should see reasonable memory growth

### 6. Verify Indexes Are Used

If you have database access, you can check query plans:

```sql
EXPLAIN QUERY PLAN 
SELECT * FROM transactions WHERE transaction_id = '1.1';
```

Should see: `USING INDEX idx_transactions_tx_id`

### 7. Check OPFS Database File

In browser console:

```javascript
// Check if OPFS is available
if ('storage' in navigator && 'getDirectory' in navigator.storage) {
  const root = await navigator.storage.getDirectory();
  const fileHandle = await root.getFileHandle('ccf-ledger.sqlite3');
  const file = await fileHandle.getFile();
  console.log('Database file size:', (file.size / 1024 / 1024).toFixed(2), 'MB');
  console.log('Last modified:', new Date(file.lastModified));
} else {
  console.log('OPFS not available');
}
```

### 8. Performance Comparison

**Before optimizations:**
- Import 10k transactions: 15-20 seconds
- Memory usage spikes
- UI may freeze during import
- Queries feel sluggish

**After optimizations:**
- Import 10k transactions: 3-5 seconds
- Smooth memory usage
- UI remains responsive
- Queries are instant

## Troubleshooting

### If Performance Is Still Slow

1. **Check if WAL mode is active:**
   - Look in console logs for "Applied: PRAGMA journal_mode = WAL"
   - If not, the PRAGMA might have failed

2. **Check browser support:**
   - OPFS requires a modern browser (Chrome 86+, Edge 86+, Safari 15.2+)
   - Some features require HTTPS or localhost

3. **Clear OPFS storage:**
   - DevTools → Application → Storage → Clear storage
   - Reimport data with fresh database

4. **Check for console errors:**
   - Red errors might indicate issues with PRAGMA application
   - Worker errors might indicate initialization problems

5. **Verify indexes were created:**
   - Look for "Database tables created successfully" in console
   - Should happen during initialization

### If Data Doesn't Persist

1. **Check OPFS availability:**
   - Console should show: "OPFS is available, created persisted database"
   - If not, browser might not support OPFS

2. **Check storage quota:**
   - DevTools → Application → Storage → Check available quota
   - Large databases need sufficient space

3. **Check for private browsing:**
   - OPFS may not work in incognito/private mode
   - Try in normal browser mode

## Expected Console Output

When starting the app, you should see:

```
[DB Worker] Loading and initializing SQLite3 module...
[DB Worker] Running SQLite3 version 3.50.1
[DB Worker] OPFS is available, created persisted database at /ccf-ledger.sqlite3
[DB Worker] Creating database tables...
[DB Worker] Applying performance optimizations...
[DB Worker] Applied: PRAGMA journal_mode = WAL
[DB Worker] Applied: PRAGMA synchronous = NORMAL
[DB Worker] Applied: PRAGMA cache_size = -10000
[DB Worker] Applied: PRAGMA temp_store = MEMORY
[DB Worker] Applied: PRAGMA mmap_size = 67108864
[DB Worker] Applied: PRAGMA page_size = 8192
[DB Worker] Applied: PRAGMA locking_mode = EXCLUSIVE
[DB Worker] Applied: PRAGMA auto_vacuum = INCREMENTAL
[DB Worker] Database tables created successfully
```

When importing a file:

```
[DB Worker] Processing ledger file: ledger_0-100.committed (1234567 bytes)
[DB Worker] File ID: 1, parsing transactions...
[DB Worker] Parsing all transactions into memory...
[DB Worker] Parsed 1000 transactions...
[DB Worker] Parsed 5000 transactions, now bulk inserting...
[DB Worker] Inserting 5000 transactions...
[DB Worker] Inserted 1000/5000 transactions...
[DB Worker] Inserted 2000/5000 transactions...
[DB Worker] Inserting 12500 writes...
[DB Worker] Inserted 5000/12500 writes...
[DB Worker] Completed: 5000 transactions inserted
```

## Performance Metrics to Track

| Metric | Before | After | Target |
|--------|--------|-------|--------|
| 1k tx import | 3-4s | ~1s | < 1s |
| 10k tx import | 15-20s | 3-5s | < 5s |
| Query time | ~500ms | 50-100ms | < 100ms |
| Memory (10k tx) | ~150MB | ~120MB | < 150MB |
| UI responsiveness | Freezes | Smooth | No freezes |

## Next Steps After Testing

1. **Document actual performance** - Record real-world timings
2. **Identify bottlenecks** - Use profiler to find remaining slow spots
3. **Consider additional optimizations** - See PERFORMANCE_INVESTIGATION_SUMMARY.md
4. **Monitor in production** - Track performance with real users

## Benchmark Commands

If you want to create a reproducible benchmark:

```javascript
// In browser console
async function benchmark() {
  console.time('Import');
  // Trigger file import
  // ... (use the UI or programmatically)
  console.timeEnd('Import');
}
```

Or use the Performance API:

```javascript
const start = performance.now();
// ... do work ...
const end = performance.now();
console.log(`Operation took ${end - start}ms`);
```
