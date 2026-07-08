import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  base: '/admin/', // served under the main site at paragondemo.ecoaisolutions.com/admin/
  plugins: [react(), tailwindcss()],
});
