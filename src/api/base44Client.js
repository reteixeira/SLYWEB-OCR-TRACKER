import { createClient } from '@base44/sdk';
// import { getAccessToken } from '@base44/sdk/utils/auth-utils';

// Create a client with authentication required
export const base44 = createClient({
  appId: "67e5a1e01faf5c9732ee2bae", 
  requiresAuth: true // Ensure authentication is required for all operations
});
