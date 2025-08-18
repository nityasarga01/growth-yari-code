# Deploying GrowthYari to Microsoft Azure

## 🚀 Azure Deployment Options

### Option 1: Azure App Service (Recommended)
**Best for**: Production-ready deployment with auto-scaling and easy management

**Frontend (React)**: Azure Static Web Apps
**Backend (Node.js)**: Azure App Service
**Database**: Azure Database for PostgreSQL or keep Supabase

### Option 2: Azure Container Instances
**Best for**: Containerized deployment with Docker

### Option 3: Azure Virtual Machines
**Best for**: Full control over the environment

## 📋 Pre-Deployment Checklist

### 1. Environment Variables Setup
Create these environment variables in Azure:

**Frontend (.env.production)**:
```
VITE_API_URL=https://your-backend-app.azurewebsites.net/api
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

**Backend (.env.production)**:
```
NODE_ENV=production
PORT=8080
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
JWT_SECRET=your_production_jwt_secret
FRONTEND_URL=https://your-frontend-app.azurestaticapps.net
```

### 2. Database Options

**Option A: Keep Supabase (Recommended)**
- No migration needed
- Managed PostgreSQL with built-in features
- Global CDN and edge functions

**Option B: Azure Database for PostgreSQL**
- Fully managed PostgreSQL on Azure
- Better integration with Azure services
- May require data migration

## 🛠 Deployment Steps

### Step 1: Deploy Frontend to Azure Static Web Apps

1. **Create Azure Static Web App**:
   ```bash
   # Install Azure CLI
   curl -sL https://aka.ms/InstallAzureCLIDeb | sudo bash
   
   # Login to Azure
   az login
   
   # Create resource group
   az group create --name growthyari-rg --location "East US"
   
   # Create static web app
   az staticwebapp create \
     --name growthyari-frontend \
     --resource-group growthyari-rg \
     --source https://github.com/yourusername/growthyari \
     --location "East US2" \
     --branch main \
     --app-location "/" \
     --output-location "dist"
   ```

2. **Configure Build Settings**:
   - App location: `/`
   - Output location: `dist`
   - Build command: `npm run build`

### Step 2: Deploy Backend to Azure App Service

1. **Create App Service**:
   ```bash
   # Create App Service plan
   az appservice plan create \
     --name growthyari-plan \
     --resource-group growthyari-rg \
     --sku B1 \
     --is-linux
   
   # Create web app
   az webapp create \
     --resource-group growthyari-rg \
     --plan growthyari-plan \
     --name growthyari-backend \
     --runtime "NODE|18-lts"
   ```

2. **Deploy Backend Code**:
   ```bash
   # Navigate to server directory
   cd server
   
   # Create deployment package
   zip -r deploy.zip . -x "node_modules/*" ".env*"
   
   # Deploy to Azure
   az webapp deployment source config-zip \
     --resource-group growthyari-rg \
     --name growthyari-backend \
     --src deploy.zip
   ```

### Step 3: Configure Environment Variables

```bash
# Set backend environment variables
az webapp config appsettings set \
  --resource-group growthyari-rg \
  --name growthyari-backend \
  --settings \
    NODE_ENV=production \
    PORT=8080 \
    SUPABASE_URL="your_supabase_url" \
    SUPABASE_SERVICE_ROLE_KEY="your_service_role_key" \
    JWT_SECRET="your_jwt_secret" \
    FRONTEND_URL="https://growthyari-frontend.azurestaticapps.net"
```

## 🔧 Azure-Specific Configurations

### 1. CORS Configuration
Update your backend CORS settings for Azure:

```javascript
app.use(cors({
  origin: [
    'https://growthyari-frontend.azurestaticapps.net',
    'http://localhost:5173' // Keep for development
  ],
  credentials: true
}));
```

### 2. Health Check Endpoint
Azure App Service requires a health check:

```javascript
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK',
    timestamp: new Date().toISOString(),
    environment: 'Azure App Service'
  });
});
```

### 3. Startup Command
Configure startup command in Azure App Service:
```
node src/server.js
```

## 💰 Cost Estimation (Monthly)

### Basic Setup:
- **Azure Static Web Apps**: Free tier available
- **Azure App Service (B1)**: ~$13/month
- **Supabase**: Free tier (up to 50MB database)
- **Total**: ~$13/month

### Production Setup:
- **Azure Static Web Apps**: ~$9/month
- **Azure App Service (P1V2)**: ~$73/month
- **Azure Database for PostgreSQL**: ~$20/month
- **Total**: ~$102/month

## 🚀 Alternative: One-Click Azure Deployment

You can also use Azure's GitHub integration for automatic deployments:

1. Fork the repository to your GitHub
2. Connect Azure Static Web Apps to your GitHub repo
3. Azure will automatically build and deploy on every push

## 📊 Monitoring & Scaling

### Application Insights
Add monitoring to track performance:

```bash
az monitor app-insights component create \
  --app growthyari-insights \
  --location "East US" \
  --resource-group growthyari-rg
```

### Auto-scaling
Configure auto-scaling rules:

```bash
az monitor autoscale create \
  --resource-group growthyari-rg \
  --resource growthyari-backend \
  --resource-type Microsoft.Web/serverfarms \
  --name growthyari-autoscale \
  --min-count 1 \
  --max-count 5 \
  --count 1
```

## 🔐 Security Best Practices

1. **Use Azure Key Vault** for sensitive environment variables
2. **Enable HTTPS** (automatic with Azure Static Web Apps)
3. **Configure Azure AD** for additional authentication if needed
4. **Set up Azure CDN** for better global performance

## 📝 Next Steps

1. **Choose your deployment option** (Static Web Apps + App Service recommended)
2. **Set up Azure account** if you don't have one
3. **Configure environment variables** for production
4. **Test the deployment** with a staging environment first
5. **Set up monitoring** and alerts

Would you like me to help you with any specific part of the Azure deployment process?