/**
 * Google Drive Integration Utility
 * Uses Google Identity Services + Drive API v3 for one-click file upload
 */

const DRIVE_UPLOAD_URL = 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart';
const GDRIVE_STORAGE_KEY = 'seventrip_google_drive_client_id';

/** Get Google Client ID from env or admin-configured localStorage */
function getGoogleClientId(): string {
  return import.meta.env.VITE_GOOGLE_CLIENT_ID || localStorage.getItem(GDRIVE_STORAGE_KEY) || '';
}

/** Set Google Client ID from admin settings */
export function setGoogleDriveClientId(clientId: string) {
  localStorage.setItem(GDRIVE_STORAGE_KEY, clientId);
  // Reset token state so it re-initializes with new client ID
  accessToken = null;
  tokenClient = null;
}

/** Get the saved Google Client ID */
export function getGoogleDriveClientId(): string {
  return localStorage.getItem(GDRIVE_STORAGE_KEY) || '';
}

let tokenClient: any = null;
let accessToken: string | null = null;
let gsiLoaded = false;

/** Load Google Identity Services script */
function loadGSI(): Promise<void> {
  if (gsiLoaded) return Promise.resolve();
  return new Promise((resolve, reject) => {
    if (document.getElementById('google-gsi-script')) {
      gsiLoaded = true;
      resolve();
      return;
    }
    const script = document.createElement('script');
    script.id = 'google-gsi-script';
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => { gsiLoaded = true; resolve(); };
    script.onerror = () => reject(new Error('Failed to load Google Identity Services'));
    document.head.appendChild(script);
  });
}

/** Get OAuth2 access token via popup consent */
function getAccessToken(): Promise<string> {
  return new Promise((resolve, reject) => {
    if (accessToken) {
      resolve(accessToken);
      return;
    }

    const clientId = getGoogleClientId();
    if (!clientId) {
      reject(new Error('Google Client ID not configured. Go to Admin → Settings → API Integrations → Google Drive to add your Client ID.'));
      return;
    }

    const google = (window as any).google;
    if (!google?.accounts?.oauth2) {
      reject(new Error('Google Identity Services not loaded'));
      return;
    }

    tokenClient = google.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: 'https://www.googleapis.com/auth/drive.file',
      callback: (response: any) => {
        if (response.error) {
          reject(new Error(response.error_description || 'Google auth failed'));
          return;
        }
        accessToken = response.access_token;
        // Token expires in ~1 hour, clear it after 50 min
        setTimeout(() => { accessToken = null; }, 50 * 60 * 1000);
        resolve(response.access_token);
      },
    });

    tokenClient.requestAccessToken({ prompt: '' });
  });
}

/**
 * Upload a Blob/File to Google Drive
 * @param file - The blob/file to upload
 * @param fileName - Display name for the file in Drive
 * @param mimeType - MIME type of the file
 * @param folderId - Optional Google Drive folder ID
 * @returns The uploaded file's web view link
 */
export async function uploadToGoogleDrive(
  file: Blob,
  fileName: string,
  mimeType: string = 'application/octet-stream',
  folderId?: string
): Promise<{ id: string; name: string; webViewLink: string }> {
  await loadGSI();
  const token = await getAccessToken();

  // Build multipart request body
  const metadata: any = { name: fileName, mimeType };
  if (folderId) metadata.parents = [folderId];

  const boundary = '-------' + Date.now().toString(36);
  const delimiter = `\r\n--${boundary}\r\n`;
  const closeDelimiter = `\r\n--${boundary}--`;

  // Convert blob to base64
  const arrayBuffer = await file.arrayBuffer();
  const base64 = btoa(
    new Uint8Array(arrayBuffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
  );

  const body =
    delimiter +
    'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
    JSON.stringify(metadata) +
    delimiter +
    `Content-Type: ${mimeType}\r\n` +
    'Content-Transfer-Encoding: base64\r\n\r\n' +
    base64 +
    closeDelimiter;

  const response = await fetch(`${DRIVE_UPLOAD_URL}&fields=id,name,webViewLink`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': `multipart/related; boundary=${boundary}`,
    },
    body,
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    if (response.status === 401) {
      accessToken = null; // Force re-auth next time
      throw new Error('Google Drive session expired. Please try again.');
    }
    throw new Error(err.error?.message || `Google Drive upload failed (${response.status})`);
  }

  return response.json();
}

/** Check if Google Drive integration is configured */
export function isGoogleDriveConfigured(): boolean {
  return !!getGoogleClientId();
}

/** Revoke current token (for logout) */
export function revokeGoogleDriveAccess() {
  if (accessToken) {
    const google = (window as any).google;
    google?.accounts?.oauth2?.revoke?.(accessToken);
    accessToken = null;
  }
}