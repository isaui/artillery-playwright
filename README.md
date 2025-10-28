# Artillery + Playwright Load Testing POC

Load testing untuk SLCM login menggunakan Artillery dan Playwright dengan TypeScript.

## Quick Start

```bash
# 1. Install dependencies
npm install
npx playwright install

# 2. Setup credentials
cp .env.example .env
# Edit .env dengan credentials kamu

# 3. Run test
npm test
```

## Configuration

**`.env` file:**
```env
SLCM_USERNAME=your_username
SLCM_PASSWORD=your_password
TARGET_URL=https://slcm.pusilkom.com
IS_HEADLESS=true
```

**Adjust load:** Edit `phases` di `slcm-login-test.ts`
```typescript
phases: [
  {
    duration: 30,      // seconds
    arrivalRate: 1,    // users per second
  }
]
```

## Output

**Report:** `reports/report.json`

**Metrics tracked:**
- Response times (min, max, median, p95, p99)
- Success/failure rates
- Custom metrics: SSO redirect time, login duration, total time
- Web Vitals: LCP, FCP, TTFB

## Tech Stack

- Artillery v2.0.22+
- Playwright v1.40.0+
- TypeScript v5.3.3+
- Node.js v18+

## Notes

- Report overwrites setiap run
- Credentials harus valid
- Test navigates: SLCM → SSO (login.ui.ac.id) → SLCM portal
