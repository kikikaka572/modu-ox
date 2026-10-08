/** Builds the LAN-visible URL for the current page, used for the home screen QR and share links. */
export function useQrValue(path: string = "/"): string {
  return `${window.location.origin}${path}`;
}
