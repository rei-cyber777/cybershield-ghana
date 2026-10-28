import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, loadEnv, Plugin } from 'vite';

/**
 * Vite dev-mode adapter for Vercel /api serverless functions so local
 * development (`vite --port=3000`) executes `/api/*` handlers identically to Vercel.
 */
function vercelApiDevPlugin(env: Record<string, string>): Plugin {
  return {
    name: 'vercel-api-dev-middleware',
    configureServer(server) {
      // Populate process.env with loaded .env / .env.local keys for server-only /api handlers
      for (const [k, v] of Object.entries(env)) {
        if (process.env[k] === undefined) {
          process.env[k] = v;
        }
      }

      server.middlewares.use(async (req, res, next) => {
        const url = req.url || '';
        if (!url.startsWith('/api/')) {
          return next();
        }

        const pathname = url.split('?')[0];
        const routeMap: Record<string, string> = {
          '/api/subscribe': '/api/subscribe.ts',
          '/api/confirm': '/api/confirm.ts',
          '/api/unsubscribe': '/api/unsubscribe.ts',
          '/api/news': '/api/news.ts',
          '/api/send-digest': '/api/send-digest.ts',
        };

        const modulePath = routeMap[pathname];
        if (!modulePath) {
          res.statusCode = 404;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ ok: false, error: `Unknown API endpoint: ${pathname}` }));
          return;
        }

        try {
          const mod = await server.ssrLoadModule(modulePath);
          if (typeof mod.default === 'function') {
            await mod.default(req, res);
            return;
          }
          return next();
        } catch (err) {
          console.error(`[vercel-api-dev] Error executing ${modulePath}:`, err);
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ ok: false, error: 'Internal Serverless Function Error' }));
        }
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [react(), tailwindcss(), vercelApiDevPlugin(env)],
    // Only expose VITE_ (and legacy NEXT_PUBLIC_) variables to client bundle;
    // server secrets (SUPABASE_SERVICE_ROLE_KEY, RESEND_API_KEY, etc.) stay strictly server-side.
    envPrefix: ['VITE_', 'NEXT_PUBLIC_'],
    define: {
      'process.env.NEXT_PUBLIC_SUPABASE_URL': JSON.stringify(
        env.VITE_SUPABASE_URL ||
          env.NEXT_PUBLIC_SUPABASE_URL ||
          'https://rtkbfrvlvwtyinmfvyvs.supabase.co'
      ),
      'process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY': JSON.stringify(
        env.VITE_SUPABASE_ANON_KEY ||
          env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
          env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
          'sb_publishable_ncN6cv7CqjBYxZ4I1WpK3A_VCVLpfG1'
      ),
      'process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY': JSON.stringify(
        env.VITE_SUPABASE_ANON_KEY ||
          env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
          env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
          'sb_publishable_ncN6cv7CqjBYxZ4I1WpK3A_VCVLpfG1'
      ),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
      dedupe: ['react', 'react-dom'],
    },
    optimizeDeps: {
      include: [
        'react',
        'react-dom',
        'lucide-react',
        'three',
        '@supabase/supabase-js',
        '@supabase/ssr',
      ],
    },
    server: {
      port: 3000,
      host: '0.0.0.0',
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
