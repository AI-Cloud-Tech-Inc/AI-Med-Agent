# AI-Med-Agent Frontend

Modern, autonomous governance dashboard for AWS Organizations management built with Next.js 14, TypeScript, and Tailwind CSS.

## Features

- **Real-time Governance Dashboard** - Monitor organizations, OUs, and accounts
- **Decision Center** - Review and approve autonomous agent decisions
- **Organization Tree** - Interactive visualization of AWS organization structure
- **Audit Trail** - Complete history of governance decisions and changes
- **Policy Management** - Create and manage Service Control Policies (SCPs)
- **Dark Theme** - Modern, professional UI with GitHub-inspired design
- **Responsive Design** - Works seamlessly on desktop, tablet, and mobile

## Tech Stack

- **Framework**: Next.js 14
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State Management**: Zustand (optional)
- **HTTP Client**: Axios
- **Visualization**: Recharts

## Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

Visit `http://localhost:3000` in your browser.

### Building

```bash
npm run build
npm start
```

## Environment Variables

Create a `.env.local` file:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_APP_NAME=AI-Med-Agent
```

## Project Structure

```
frontend/
├── app/                    # Next.js app directory
│   ├── page.tsx           # Dashboard home
│   ├── governance/        # Organization management
│   ├── decisions/         # Decision approval center
│   ├── audit/             # Audit trail
│   ├── policies/          # Policy management
│   └── layout.tsx         # Root layout
├── components/            # Reusable React components
│   ├── Navigation.tsx
│   ├── MetricCard.tsx
│   ├── DecisionTable.tsx
│   └── GovernanceTree.tsx
├── lib/                   # Utilities and API clients
│   └── api.ts
├── globals.css            # Global styles
├── tailwind.config.js     # Tailwind configuration
└── package.json
```

## Key Components

### Navigation
Main navigation bar with active route highlighting

### MetricCard
Displays key performance metrics with trends

### DecisionTable
Shows pending decisions with approval/rejection actions

### GovernanceTree
Interactive tree view of AWS organization structure

## API Integration

The frontend connects to the AI-Med-Agent backend:

```typescript
import { apiClient } from '@/lib/api';

// Get pending decisions
const decisions = await apiClient.getPendingDecisions();

// Approve a decision
await apiClient.approveDecision(decisionId);

// Get organization structure
const orgs = await apiClient.getOrganizations();

// Get audit trail
const events = await apiClient.getAuditTrail();
```

## Styling

The dashboard uses a custom dark theme with:
- Dark backgrounds (#0f172a, #1e293b)
- Indigo/Purple accent colors
- Smooth transitions
- Responsive grid layouts

### Custom CSS Classes

- `.card` - Styled container
- `.btn-primary` - Primary button
- `.btn-secondary` - Secondary button
- `.badge-success/.warning/.danger/.info` - Status badges
- `.gradient-text` - Gradient text effect

## Features Implementation

### Governance Dashboard
- Real-time metrics
- Organization structure visualization
- Decision queue monitoring

### Decision Center
- Pending decisions list
- Decision details with confidence scores
- Approval/rejection workflow

### Audit Trail
- Complete decision history
- Searchable event log
- Export capabilities

## Performance Optimizations

- Code splitting with Next.js
- Image optimization
- CSS minification with Tailwind
- Client-side caching with Zustand

## Deployment

### Vercel (Recommended)

```bash
vercel deploy
```

### Docker

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY . .
RUN npm install && npm run build
CMD ["npm", "start"]
```

### Static Export

```bash
npm run build
# Creates optimized static files in .next/
```

## Contributing

1. Follow TypeScript strict mode
2. Use functional components with hooks
3. Keep components focused and reusable
4. Test responsive design

## License

Proprietary - AI-Empower Cloud Hub LLC

## Support

For issues and feature requests, contact the development team.
