# POC: Artillery + Playwright Load Testing untuk SLCM Login

Proof of Concept untuk load testing login SLCM menggunakan Artillery dan Playwright dengan TypeScript.

**Built with Best Practices:**
- ✅ TypeScript dengan proper type safety
- ✅ Deterministic waits (no `waitForTimeout`)
- ✅ Structured test steps dengan `test.step()` API
- ✅ Proper assertions dengan Playwright `expect()`
- ✅ Custom metrics tracking (SSO redirect time, login duration)
- ✅ Production-ready configuration

## 🎯 Test Scenario

**User Journey:**
1. Navigate ke `https://slcm.pusilkom.com`
2. Klik button "Login" di navbar
3. Redirect ke SSO login page
4. Isi username dan password dari environment variables
5. Klik button "Sign In"
6. Verify login success dengan URL assertion
7. Track custom metrics untuk monitoring

## 📦 Installation

```powershell
# Install dependencies
npm install

# Install Playwright browsers (first time only)
npx playwright install
```

## 🔐 Setup Environment Variables

1. Copy `.env.example` ke `.env`:
```powershell
Copy-Item .env.example .env
```

2. Edit `.env` dan isi credentials:
```env
SLCM_USERNAME=your_username_here
SLCM_PASSWORD=your_password_here
TARGET_URL=https://slcm.pusilkom.com

# Browser Settings
IS_HEADLESS=true
```

**Environment Variables:**
- `SLCM_USERNAME` - Username untuk login SSO
- `SLCM_PASSWORD` - Password untuk login SSO
- `TARGET_URL` - Base URL SLCM (default: https://slcm.pusilkom.com)
- `IS_HEADLESS` - Run browser headless (`true`) atau tampilkan UI (`false`)

⚠️ **PENTING:** Jangan commit file `.env` ke git!

## 🚀 Running Tests

### 1️⃣ Set Environment Variables (PowerShell):

```powershell
# Load .env file
Get-Content .env | ForEach-Object {
  if ($_ -match '^([^=]+)=(.*)$') {
    [Environment]::SetEnvironmentVariable($matches[1], $matches[2], 'Process')
  }
}

# Or set manually
$env:SLCM_USERNAME = "your_username"
$env:SLCM_PASSWORD = "your_password"
```

### 2️⃣ Run Tests:

```bash
# Cross-platform - works on Windows, Mac, Linux
npm test
```

**To adjust load:** Edit `slcm-login-test.ts` dan ubah `phases` config:

```typescript
phases: [
  {
    duration: 30,      // Duration in seconds
    arrivalRate: 1,    // Users per second
    name: 'Your test name'
  }
]
```

**Recommended settings:**
- **Debug:** `duration: 10, arrivalRate: 1` (~10 logins)
- **Light:** `duration: 30, arrivalRate: 1` (~30 logins)
- **Medium:** `duration: 60, arrivalRate: 2` (~120 logins)
- **Heavy:** `duration: 60, arrivalRate: 10` (~600 logins)

## 📊 Default Configuration

**Current setup (POC-level):**
- **Duration:** 30 seconds
- **Arrival Rate:** 1 user/second
- **Total Attempts:** ~30 logins
- **Purpose:** Proof of concept, minimal load
- **Report Location:** `reports/report.json` (overwrites each run)

**To adjust:** Edit `phases` in `slcm-login-test.ts`

## 📈 Metrics Collected

Artillery akan otomatis track:

### **Standard Metrics:**
- **Request count** - Total HTTP requests
- **Response time** - Min, max, median, p95, p99
- **Error rate** - Failed requests
- **Throughput** - Requests per second
- **Scenarios launched/completed** - Virtual user statistics

### **Custom Metrics (New!):**
- **`sso_redirect_time`** - Time to redirect from SLCM to SSO page (ms)
- **`login_duration`** - Time from submit to successful login (ms)
- **`dashboard_load_time`** - Total test duration per user (ms)

### **Web Vitals (Playwright):**
- **TTFB** - Time To First Byte
- **FCP** - First Contentful Paint
- **LCP** - Largest Contentful Paint
- **FID** - First Input Delay
- **INP** - Interaction to Next Paint
- **CLS** - Cumulative Layout Shift

### **Browser Metrics:**
- **HTTP codes** - 200, 302, 401, 500, etc
- **Failed assertions** - Playwright `expect()` failures
- **Page navigation times** - Per page load times
- **Test step durations** - Per `test.step()` timing

## 🔍 Example Output

```
Summary report @ 13:45:23(+07:00)
─────────────────────────────────────────────
  Scenarios launched:  720
  Scenarios completed: 715
  Requests completed:  2860
  Mean response/req:   1245ms
  
  Response time (msec):
    min: 456
    max: 3421
    median: 1123
    p95: 2345
    p99: 2891
  
  Scenarios duration (msec):
    min: 2100
    max: 5234
    median: 2934
    p95: 3876
  
  Codes:
    200: 2145
    302: 715
  
  Custom Metrics:
    sso_redirect_time:
      min: 456ms
      median: 823ms
      p95: 1234ms
      p99: 1567ms
    
    login_duration:
      min: 1200ms
      median: 1845ms
      p95: 2567ms
      p99: 3124ms
    
    dashboard_load_time:
      min: 2100ms
      median: 2934ms
      p95: 3876ms
      p99: 4523ms
  
  Web Vitals:
    browser.page.LCP:
      median: 1800ms
      p95: 2900ms
    
    browser.page.FCP:
      median: 980ms
      p95: 1450ms
  
  Errors:
    Timeout: 5
```

## ✨ Best Practices Implemented

This POC follows Artillery + Playwright best practices:

### **✅ Deterministic Waits**
- No `page.waitForTimeout()` - uses proper state waits
- `waitForLoadState()` for page navigation
- `expect().toHaveURL()` for URL assertions with retry

### **✅ Type Safety**
- TypeScript with proper `Page` type from Playwright
- Import types from `artillery` package
- Type-safe configuration

### **✅ Structured Test Steps**
- Uses `test.step()` API for better reporting
- Each step tracked separately in traces
- Clear step names for debugging

### **✅ Proper Assertions**
- Playwright `expect()` for reliable assertions
- Automatic retries within timeout
- Better error messages on failure

### **✅ Custom Metrics**
- Track business-specific metrics
- `events.emit('customStat', ...)` for custom data
- Monitor SSO redirect, login duration, total time

### **✅ Locator API**
- Modern Playwright locators with `.locator()`
- Wait for visibility before interaction
- Handles multiple matches properly

## 🐛 Debugging

### 1. Start with Debug Mode:
```powershell
npm run test:login:debug
```
Only 1 user for 10 seconds - easy to spot issues.

### 2. Enable verbose logging:
```powershell
$env:DEBUG = "pw:api"
npm run test:login:debug
```

### 3. Run in headed mode (see browser):
Edit `.env`:
```env
IS_HEADLESS=false  # Show browser UI
```

Atau override via environment variable:
```powershell
$env:IS_HEADLESS = "false"
npm run test:login:debug
```

### 4. View Playwright traces:
1. Traces automatically recorded (enabled by default)
2. Upload to [Artillery Cloud](https://app.artillery.io) for viewing
3. Or use local Playwright trace viewer:
```powershell
npx playwright show-trace trace.zip
```

## 🔄 Recommended Workflow

### First Time Setup:
```powershell
# 1. Install dependencies
npm install
npx playwright install

# 2. Configure credentials
Copy-Item .env.example .env
notepad .env  # Edit credentials

# 3. Test with 1 user first
npm run test:login:debug

# 4. If success, try light load
npm run test:login:light
```

### Regular Load Testing:
```powershell
# Load env variables
Get-Content .env | ForEach-Object {
  if ($_ -match '^([^=]+)=(.*)$') {
    [Environment]::SetEnvironmentVariable($matches[1], $matches[2], 'Process')
  }
}

# Run production-like load test
npm run test:login
```

### Finding System Limits:
```powershell
# Gradually increase load
npm run test:login:light   # 1 user/s
npm run test:login         # 2-5 users/s
npm run test:login:heavy   # 10 users/s

# Check for errors in each phase
# Increase until you see failures
```

## 📝 Notes

- **Headless mode** digunakan by default untuk performa optimal
- **Credentials** harus valid untuk test berhasil
- **Rate limiting** mungkin ada di server - adjust `arrivalRate` accordingly
- **Network conditions** akan affect results
- **Always start with debug mode** untuk validate script sebelum load test

## 🛠 Tech Stack

- **Artillery** v2.0.22+ - Load testing orchestrator
- **Playwright** v1.40.0+ - Browser automation
- **@playwright/test** v1.40.0+ - Assertions & expect API
- **TypeScript** v5.3.3+ - Type-safe test definitions
- **Node.js** v18+ - Runtime environment

## 🔗 Resources

- [Artillery Documentation](https://www.artillery.io/docs)
- [Playwright Documentation](https://playwright.dev/docs/intro)
- [Artillery + Playwright Guide](https://www.artillery.io/docs/reference/engines/playwright)

## ⚠️ Disclaimer

Load testing harus dilakukan dengan persetujuan dari pemilik sistem. Jangan melakukan load testing pada sistem production tanpa izin yang jelas.
