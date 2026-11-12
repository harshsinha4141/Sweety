import { RouterProvider } from '@tanstack/react-router'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Slide, ToastContainer } from 'react-toastify'
import AuthProvider from './auth/AuthProvider'
import './index.css'
import { router } from './router'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <RouterProvider router={router} />
      <ToastContainer
        position="top-right"
        autoClose={3500}
        newestOnTop
        closeOnClick
        pauseOnFocusLoss={false}
        theme="light"
        transition={Slide}
      />
    </AuthProvider>
  </StrictMode>,
)
