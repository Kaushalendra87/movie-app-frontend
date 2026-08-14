import axiosInstance from '../axiosInstance';

let profileCache = null;
let fetchingPromise = null;
let lastAccessToken = null;

const wrapResponse = (data) => ({ data });

export const getProfile = async (force = false) => {
  const currentToken = localStorage.getItem('accessToken');

  // If the access token changed (login/logout), invalidate the cache.
  if (lastAccessToken !== currentToken) {
    profileCache = null;
    fetchingPromise = null;
    lastAccessToken = currentToken;
  }

  if (profileCache && !force) return wrapResponse(profileCache);
  if (fetchingPromise && !force) return fetchingPromise;

  if (!currentToken) {
    // No token -> no profile
    profileCache = null;
    return wrapResponse(null);
  }

  fetchingPromise = axiosInstance
    .get('/api/v1/profile/')
    .then((res) => {
      profileCache = res.data;
      fetchingPromise = null;
      return wrapResponse(profileCache);
    })
    .catch((err) => {
      fetchingPromise = null;
      throw err;
    });

  return fetchingPromise;
};

export const setProfile = (profile) => {
  profileCache = profile;
};

export const clearProfileCache = () => {
  profileCache = null;
  fetchingPromise = null;
  lastAccessToken = null;
};

export default { getProfile, setProfile, clearProfileCache };
