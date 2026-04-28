import { createRoot } from 'react-dom/client'
import { StartClient } from '@tanstack/react-start'
import { getRouter } from './router'

const router = getRouter()

const rootElement = document.getElementById('root') || document.body

createRoot(rootElement).render(<StartClient router={router} />)
