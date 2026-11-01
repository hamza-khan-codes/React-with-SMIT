## What is Axios ?
Axios is an open-source, promise-based JavaScript library used to send HTTP requests from web browsers or Node.js backends to servers and APIs. Developers frequently use it in frontend frameworks like React or Vue to fetch or submit data.

```
npm i axios 
```

### Modular API Architecture (Global Instance)

Never hardcode API strings inside individual React components. Create a central API client file using axios.create() [0]. This separates your base setup from your component code.

- Step 1: Secure Environment Variables


```js
// in .env
// .env.development (Local machine testing)
VITE_API_URL=http://localhost:5000/api/v1
VITE_REQUEST_TIMEOUT=5000

// .env.production (Live deployment configuration)
VITE_API_URL=https://yourcompany.com
VITE_REQUEST_TIMEOUT=15000

``` 

- Step 2: Establish a Global API Client Instance

Create a centralized instance. This ensures every network call made across your app automatically inherits standard performance defaults, content types, and timeouts

``` js 
// src/api/apiClient.js
import axios from 'axios';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  timeout: Number(import.meta.env.VITE_REQUEST_TIMEOUT) || 10000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

export default apiClient;

```

- Step 3: Add Global Request & Response Interceptors

 Interceptors allow you to inject authentication tokens automatically right before a request leaves, and globally intercept structural failures (like 401 Unauthorized or 500 Server Error) when they return.

 ```js
 // src/api/apiClient.js (Continued)

// 1. Request Interceptor: Inject Auth Token dynamically
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken'); // Or pull from your state manager
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// 2. Response Interceptor: Global Error Handling & Silent Token Refresh
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Handle token expiration (401) without crashing the user view
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        // Run your refresh token network call
        const refreshToken = localStorage.getItem('refreshToken');
        const { data } = await axios.post(`${import.meta.env.VITE_API_URL}/auth/refresh`, { refreshToken });
        
        localStorage.setItem('accessToken', data.newAccessToken);
        originalRequest.headers.Authorization = `Bearer ${data.newAccessToken}`;
        
        return apiClient(originalRequest); // Re-execute the original request with new token
      } catch (refreshError) {
        // Refresh token invalid or expired too -> Log out user immediately
        localStorage.clear();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);

 ```

 - Step 4: Centralize Your API Operations

 Instead of using Axios commands directly inside visual components, map your backend endpoints into an operational service directory. This creates a clean layout where changes to API endpoints only require editing a single file.

 ```js
 // src/services/userService.js
import apiClient from '../api/apiClient';

export const userService = {
  getAllUsers: (signal) => apiClient.get('/users', { signal }),
  getUserById: (id) => apiClient.get(`/users/${id}`),
  createUser: (userData) => apiClient.post('/users', userData),
  deleteUser: (id) => apiClient.delete(`/users/${id}`),
};

 ```

 - Step 5: Safely Fetch Data inside Components

 When writing components for production, you must implement memory leak protection. If a user leaves a dashboard before the server finishes sending the data, a pending request can attempt to update an unmounted component, breaking state trees. Use an AbortController to close open lines.

 ```js
 // src/components/UserDashboard.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { userService } from '../services/userService';

export function UserDashboard() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const controller = new AbortController();

    async function loadData() {
      try {
        setLoading(true);
        const response = await userService.getAllUsers(controller.signal);
        setUsers(response.data);
        setError(null);
      } catch (err) {
        // If the component unmounted, ignore the cancellation error
        if (axios.isCancel(err)) return; 
        
        setError(err.response?.data?.message || 'Failed to download user list.');
      } finally {
        setLoading(false);
      }
    }

    loadData();

    // Cleanup: Fires automatically if the user clicks away or closes the tab mid-flight
    return () => controller.abort();
  }, []);

  if (loading) return <p>Loading system metrics...</p>;
  if (error) return <div className="error-banner">{error}</div>;

  return (
    <ul>
      {users.map(user => <li key={user.id}>{user.name}</li>)}
    </ul>
  );
}

 ```

 - Step 6: Handle Scale with React Query (Optional but Highly Recommended)

 For complex web applications, managing state, retry attempts, caching, and background synchronization inside raw useEffect blocks gets unmanageable. In professional setups, Axios is paired with TanStack React Query to handle the state management for you.

 - Step 6: Handle Scale with React Query (Optional but Highly Recommended)

 For complex web applications, managing state, retry attempts, caching, and background synchronization inside raw useEffect blocks gets unmanageable. In professional setups, Axios is paired with TanStack React Query to handle the state management for you.

 ```js
 npm install @tanstack/react-query
 ```

 ```js
 // src/components/ModernUserDashboard.jsx
import { useQuery } from '@tanstack/react-query';
import { userService } from '../services/userService';

export function ModernUserDashboard() {
  // Caching, request deduping, background reloading, and retries are done automatically
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['users'],
    queryFn: () => userService.getAllUsers().then(res => res.data),
    staleTime: 1000 * 60 * 5, // Data remains fresh for 5 minutes before background refetching
  });

  if (isLoading) return <p>Loading...</p>;
  if (isError) return <p>Error: {error.message}</p>;

  return (
    <ul>
      {data.map(user => <li key={user.id}>{user.name}</li>)}
    </ul>
  );
}

 ```

