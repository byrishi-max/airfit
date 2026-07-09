export function authHeader() {
  const token = process.env.REACT_APP_API_TOKEN;
  if (!token) return {};
  return {
    Authorization: token.startsWith('Bearer ') ? token : `Bearer ${token}`,
  };
}

export function jsonHeaders(extra = {}) {
  return {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...authHeader(),
    ...extra,
  };
}
