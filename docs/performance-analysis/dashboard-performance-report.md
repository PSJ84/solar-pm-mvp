# Dashboard Full-Summary API Performance Analysis Report

**Target API**: GET /dashboard/full-summary  
**Current Loading Time**: 12+ seconds  
**Analysis Date**: 2025-12-18  
**Primary File**: apps/api/src/dashboard/dashboard.service.ts

---

## Executive Summary

### Critical Findings

1. **HIGH SEVERITY**: N+1 Query Problem in getRiskProjectsForSummary (Line 355-460)
   - Loads all projects with stages and tasks using nested includes
   - Causes 10-20 queries for 10 projects
   - **Expected improvement**: 5-8 seconds

2. **HIGH SEVERITY**: Unnecessary DB Writes (Line 442-455)
   - Creates DelayRiskScore records on every dashboard refresh
   - Should be moved to background job
   - **Expected improvement**: 2-3 seconds

3. **MEDIUM SEVERITY**: Repeated Schema Checks
   - hasTaskNotificationEnabledColumn() called 5 times
   - **Expected improvement**: 0.5-1 second

4. **MEDIUM SEVERITY**: Multiple Similar Queries
   - getTodayTasksForSummary and getUpcoming7DaysTasksForSummary are nearly identical
   - getStatsForSummary runs 5 separate COUNT queries
   - **Expected improvement**: 1-2 seconds

### Total Expected Improvement: 8-14 seconds (Target: 2-4 seconds)

---

## Detailed Analysis

### 1. getFullSummary Method Flow

**Location**: Line 210-235

Current execution:
