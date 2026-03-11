import { getAccessToken } from './authSession';
import { refreshAccessToken } from './authRefresh';

export async function authenticatedFetch(
  input: RequestInfo | URL,
  init: RequestInit = {}
): Promise<Response> {
  const headers = new Headers(init.headers);
  const token = getAccessToken();

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  let response = await fetch(input, {
    ...init,
    headers,
  });

  if (response.status !== 401) {
    return response;
  }

  try {
    const nextAccessToken = await refreshAccessToken();

    const retryHeaders = new Headers(init.headers);
    retryHeaders.set('Authorization', `Bearer ${nextAccessToken}`);

    response = await fetch(input, {
      ...init,
      headers: retryHeaders,
    });
  } catch {
    return response;
  }

  return response;
}
