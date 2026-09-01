interface Env {
  GEMINI_API_KEY?: string;
}

type PagesFunction<T = unknown> = (context: {
  request: Request;
  env: T;
  next?: () => Promise<Response>;
  data?: Record<string, any>;
}) => Promise<Response> | Response;

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const apiKey = context.env?.GEMINI_API_KEY || (typeof process !== 'undefined' ? process.env?.GEMINI_API_KEY : undefined);
  return new Response(
    JSON.stringify({
      status: 'ok',
      hasApiKey: Boolean(apiKey),
      platform: 'cloudflare-pages',
    }),
    {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    }
  );
};
