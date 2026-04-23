// src/environments/environment.prod.ts
export const environment = {
  production: true,
  apiUrl: 'https://api-gateway-pgvd.onrender.com/api/v1',
  googleMapsApiKey: 'YOUR_PRODUCTION_GOOGLE_MAPS_API_KEY',

  services: {
    userManagement: 'https://user-management-service-latest-11x8.onrender.com/user-management',
    auth: 'https://auth-service-mowr.onrender.com/auth',
    productionApiUrl: 'https://api.agribind.cm/production/api/v1',
    inventory: 'https://api.agribind.cm/inventory/api',
    notification: 'https://notification-service-zltu.onrender.com/notification'
  }
};