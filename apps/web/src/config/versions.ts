export const versions = {
  ABI_VERSION: '1.0.0',
  CONTRACT_VERSION: '1.0.0',
  SDK_VERSION: '1.0.0',
};

// This function can be called on mount to verify if the frontend is up to date
// with the backend's expected contract version.
export async function checkVersionCompatibility(backendVersion: string) {
  if (backendVersion !== versions.CONTRACT_VERSION) {
    console.warn(`Version mismatch! Frontend: ${versions.CONTRACT_VERSION}, Backend: ${backendVersion}`);
    return false;
  }
  return true;
}
