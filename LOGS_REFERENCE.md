# Logs Reference Guide

## Central Log File: `logs.txt`

**All logs for diagnostic analysis should be added to `logs.txt` in the project root.**

## Workflow

When logs are updated:
- User adds logs to `logs.txt`
- User says "**lu**" (logs updated) to request analysis
- AI analyzes `logs.txt` for errors, patterns, and diagnostic information

This file serves as the single source of truth for:
- Railway application logs
- Railway deploy logs
- Railway HTTP logs (when relevant)
- Application error messages
- Stack traces
- Debug output
- Stripe configuration logs
- Payment session creation errors

## How to Add Logs

1. Copy relevant log entries from Railway dashboard
2. Paste them into `logs.txt`
3. Include timestamps and context
4. Add a brief note about what the logs show (e.g., "Payment session creation error at 00:08:55")

## Analysis Process

When diagnosing issues:
1. Check `logs.txt` for relevant error messages
2. Search for error patterns: `error`, `Error`, `ERROR`, `Stripe`, `payment`, `provider`, `500`
3. Look for stack traces and detailed error messages
4. Cross-reference timestamps with HTTP log entries

## Current Issue: Payment Session 500 Error

**Reference `logs.txt` for:**
- Stripe module initialization logs
- Payment session creation error messages
- Stack traces showing where the error occurs
- Stripe API error responses

**Search `logs.txt` for:**
- Timestamp: `2025-10-31T00:08:55` (when payment session creation failed)
- Patterns: `"payment"`, `"Stripe"`, `"provider"`, `"error"`
- Stack traces with file paths and line numbers

---

## Quick Reference

- **File Location**: `logs.txt` (project root)
- **Format**: Any format (JSON, plain text, etc.) - just include timestamps and context
- **When to Update**: After every error or significant event
- **Analysis**: Use `grep` or search tools to find relevant entries

