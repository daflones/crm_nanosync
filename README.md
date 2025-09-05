# Nano Sync CRM

A modern multi-tenant CRM system built with React, TypeScript, and Supabase for pet industry businesses.

## 🚀 Features

- **Multi-Tenant Architecture**: Complete company isolation with admin/vendedor hierarchy
- **Customer Management**: Complete customer database with pet information
- **Sales Pipeline**: Track leads, proposals, and deals
- **Appointment Scheduling**: Calendar integration for appointments
- **Product Catalog**: Manage products and services
- **Sales Analytics**: Comprehensive reporting and analytics
- **Role-based Access**: Admin and Vendedor roles with proper permissions
- **Real-time Updates**: Live notifications and updates

## 🛠️ Tech Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Auth, Storage, RLS)
- **State Management**: Zustand
- **Routing**: React Router
- **Forms**: React Hook Form + Zod
- **UI Components**: Radix UI + Custom Components
- **Charts**: Chart.js & Recharts
- **Animations**: Framer Motion

## 🏗️ Architecture

### Multi-Tenant Hierarchy
- **Superadmin**: Cross-tenant access to all data
- **Admin**: Company owner, manages all company data and vendedores
- **Vendedor**: Access only to their own data within their company

### Security
- Row Level Security (RLS) policies for complete data isolation
- JWT-based authentication with role validation
- Automatic profile assignment and tenant filtering

## 🚀 Deployment

### EasyPanel with Nixpacks

This project is configured for deployment on EasyPanel using Nixpacks:

1. **Push to GitHub**: `daflones/crm_nanosync`
2. **EasyPanel Setup**: Connect your GitHub repository
3. **Environment Variables**: Set your Supabase credentials
4. **Deploy**: EasyPanel will automatically use the `nixpacks.toml` configuration

### Environment Variables

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## 🏃‍♂️ Getting Started

### Prerequisites

- Node.js 20+
- npm
- Supabase account

### Installation

1. Clone the repository
```bash
git clone https://github.com/daflones/crm_nanosync.git
cd crm_nanosync
```

2. Install dependencies
```bash
npm ci
```

3. Set up environment variables
```bash
cp .env.example .env
```

4. Run the development server
```bash
npm run dev
```

5. Build for production
```bash
npm run build
```

6. Preview production build
```bash
npm run preview
```

## 📁 Project Structure

```
src/
├── components/     # Reusable UI components
│   ├── ui/        # Base UI components
│   └── landing/   # Landing page components
├── pages/         # Page components
│   ├── auth/      # Authentication pages
│   ├── app/       # Main application pages
│   └── landing/   # Landing page
├── services/      # API services with BaseService
├── stores/        # Zustand state management
├── hooks/         # Custom React hooks
├── types/         # TypeScript type definitions
└── utils/         # Utility functions

supabase/
├── migrations/    # Database migrations
└── config.toml   # Supabase configuration
```

## 🔄 Development Workflow

1. **Database Changes**: Create migrations in `supabase/migrations/`
2. **Apply Migrations**: Run in Supabase Dashboard or CLI
3. **Update Services**: Extend BaseService for automatic tenant filtering
4. **Test Isolation**: Verify multi-tenant data separation

## 🧪 Testing Multi-Tenant Isolation

1. Create admin user (company owner)
2. Admin creates vendedores
3. Verify data isolation between companies
4. Test superadmin cross-tenant access

## 📝 License

This project is licensed under the MIT License.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

---

**Nano Sync CRM** - Empowering pet businesses with intelligent customer relationship management.
