/**
 * Dev-only paywall bypass (`__DEV__` must also be true, so App Store builds never use this).
 *
 * Defaults to `true` so the simulator works without RevenueCat keys and you are not stuck
 * on `/paywall` with initialization errors. Set to `false` when you need to test IAP/paywall
 * in a debug build.
 */
export const DEV_BYPASS_PAYWALL = false;

export function isDevPaywallBypassed(): boolean {
  return __DEV__ && DEV_BYPASS_PAYWALL;
}
