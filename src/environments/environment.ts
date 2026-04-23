// src/environments/environment.ts
export const environment = {
  production: false,
  apiUrl: '', // Empty = use same origin, proxied to backend (avoids CORS)
  googleMapsApiKey: 'AIzaSyB41DRUbKWJHPxaFjMAwdrzWzbVKartNGg',

  // Service URLs (relative = proxied in dev)
  services: {
    userManagement: '/api/v1',
    auth: '/api/v1/auth',
    productionApiUrl: '/api/v1/production',
    inventory: '/api/inventory',
    communication: '/api/communications',
    plantMonitoring: '/api/v1',
    notification: '/api/notifications',
    microcredit: '/api/microcredit'
  }
};