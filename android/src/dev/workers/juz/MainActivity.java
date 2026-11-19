package dev.workers.juz;

import android.app.Activity;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.ActivityInfo;
import android.content.res.Configuration;
import android.graphics.Color;
import android.graphics.drawable.ColorDrawable;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.VibrationEffect;
import android.os.Vibrator;
import android.os.VibratorManager;
import android.view.View;
import android.view.ViewGroup;
import android.view.Window;
import android.view.WindowInsetsController;
import android.view.WindowManager;
import android.webkit.CookieManager;
import android.webkit.JavascriptInterface;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.FrameLayout;

public class MainActivity extends Activity {
    private static final String APP_URL = "https://juz.muamer-arifi.workers.dev/";
    private static final String APP_HOST = "juz.muamer-arifi.workers.dev";
    private static final String PREFS_UI = "juz_ui";

    private WebView webView;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        FrameLayout root = new FrameLayout(this);
        root.setLayoutParams(new ViewGroup.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.MATCH_PARENT
        ));
        setContentView(root);

        applySavedThemeImmediately();

        webView = new WebView(this);
        webView.setLayoutParams(new FrameLayout.LayoutParams(
                FrameLayout.LayoutParams.MATCH_PARENT,
                FrameLayout.LayoutParams.MATCH_PARENT
        ));
        webView.setHapticFeedbackEnabled(true);
        webView.setOverScrollMode(View.OVER_SCROLL_NEVER);
        webView.setVerticalScrollBarEnabled(false);
        webView.setHorizontalScrollBarEnabled(false);
        webView.setLayerType(View.LAYER_TYPE_HARDWARE, null);

        SharedPreferences prefs = getSharedPreferences(PREFS_UI, MODE_PRIVATE);
        int nightMask = getResources().getConfiguration().uiMode & Configuration.UI_MODE_NIGHT_MASK;
        boolean systemDark = nightMask == Configuration.UI_MODE_NIGHT_YES;
        boolean dark = prefs.contains("dark") ? prefs.getBoolean("dark", systemDark) : systemDark;
        String bgHex = prefs.getString("bgHex", dark ? "#0e1c17" : "#ece2cb");
        webView.setBackgroundColor(parseColorSafe(bgHex, dark ? 0xFF0E1C17 : 0xFFECE2CB));

        root.addView(webView);

        configureWebViewSettings(webView);
        CookieManager cm = CookieManager.getInstance();
        cm.setAcceptCookie(true);
        cm.setAcceptThirdPartyCookies(webView, true);

        webView.addJavascriptInterface(new JuzBridge(), "JuzAndroid");
        webView.setWebChromeClient(new WebChromeClient());
        webView.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                Uri uri = request.getUrl();
                if (uri == null) return false;
                String host = uri.getHost();
                if (host != null && host.equalsIgnoreCase(APP_HOST)) {
                    if (uri.getPath() != null && uri.getPath().endsWith(".apk")) {
                        startActivity(new Intent(Intent.ACTION_VIEW, uri));
                        return true;
                    }
                    return false;
                }
                try {
                    startActivity(new Intent(Intent.ACTION_VIEW, uri));
                } catch (Exception ignored) {}
                return true;
            }
        });

        if (savedInstanceState != null) {
            webView.restoreState(savedInstanceState);
        } else {
            webView.loadUrl(APP_URL);
        }
    }

    @SuppressWarnings("deprecation")
    private void configureWebViewSettings(WebView wv) {
        WebSettings s = wv.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setDatabaseEnabled(true);
        s.setCacheMode(WebSettings.LOAD_DEFAULT);
        s.setMediaPlaybackRequiresUserGesture(false);
        s.setSupportZoom(false);
        s.setBuiltInZoomControls(false);
        s.setDisplayZoomControls(false);
        s.setUseWideViewPort(true);
        s.setLoadWithOverviewMode(true);
    }

    private void applySavedThemeImmediately() {
        SharedPreferences prefs = getSharedPreferences(PREFS_UI, MODE_PRIVATE);
        int nightMask = getResources().getConfiguration().uiMode & Configuration.UI_MODE_NIGHT_MASK;
        boolean systemDark = nightMask == Configuration.UI_MODE_NIGHT_YES;
        boolean dark = prefs.contains("dark") ? prefs.getBoolean("dark", systemDark) : systemDark;
        String bgHex = prefs.getString("bgHex", dark ? "#0e1c17" : "#ece2cb");
        applySystemBars(dark, bgHex, bgHex);
    }

    @SuppressWarnings("deprecation")
    private void applySystemBars(final boolean dark, final String barHex, final String bgHex) {
        runOnUiThread(new Runnable() {
            @Override
            public void run() {
                try {
                    Window w = getWindow();
                    if (w == null) return;
                    int fallback = dark ? 0xFF0E1C17 : 0xFFECE2CB;
                    int barColor = parseColorSafe(barHex, fallback);
                    int bgColor = parseColorSafe(bgHex, barColor);

                    w.addFlags(WindowManager.LayoutParams.FLAG_DRAWS_SYSTEM_BAR_BACKGROUNDS);
                    w.clearFlags(WindowManager.LayoutParams.FLAG_TRANSLUCENT_STATUS);
                    w.clearFlags(WindowManager.LayoutParams.FLAG_TRANSLUCENT_NAVIGATION);
                    w.setStatusBarColor(barColor);
                    w.setNavigationBarColor(barColor);
                    w.setBackgroundDrawable(new ColorDrawable(bgColor));
                    if (webView != null) webView.setBackgroundColor(bgColor);

                    if (Build.VERSION.SDK_INT >= 29) {
                        w.setNavigationBarContrastEnforced(false);
                    }

                    if (Build.VERSION.SDK_INT >= 30) {
                        WindowInsetsController ic = w.getInsetsController();
                        if (ic != null) {
                            int mask = WindowInsetsController.APPEARANCE_LIGHT_STATUS_BARS
                                    | WindowInsetsController.APPEARANCE_LIGHT_NAVIGATION_BARS;
                            ic.setSystemBarsAppearance(dark ? 0 : mask, mask);
                        }
                    } else {
                        View decor = w.getDecorView();
                        int flags = decor.getSystemUiVisibility();
                        int lightFlags = View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR | View.SYSTEM_UI_FLAG_LIGHT_NAVIGATION_BAR;
                        if (dark) flags &= ~lightFlags;
                        else flags |= lightFlags;
                        decor.setSystemUiVisibility(flags);
                    }
                } catch (Throwable ignored) {}
            }
        });
    }

    private int parseColorSafe(String hex, int fallback) {
        if (hex == null || hex.isEmpty()) return fallback;
        try {
            return Color.parseColor(hex.trim());
        } catch (Exception e) {
            return fallback;
        }
    }

    private Vibrator getVibrator() {
        if (Build.VERSION.SDK_INT >= 31) {
            VibratorManager vm = (VibratorManager) getSystemService(Context.VIBRATOR_MANAGER_SERVICE);
            return vm != null ? vm.getDefaultVibrator() : null;
        }
        return (Vibrator) getSystemService(Context.VIBRATOR_SERVICE);
    }

    @Override
    protected void onSaveInstanceState(Bundle outState) {
        super.onSaveInstanceState(outState);
        if (webView != null) webView.saveState(outState);
    }

    @Override
    @SuppressWarnings("deprecation")
    public void onBackPressed() {
        if (webView != null && webView.canGoBack()) {
            webView.goBack();
        } else {
            super.onBackPressed();
        }
    }

    public class JuzBridge {
        @JavascriptInterface
        public void setTheme(boolean dark, String barHex, String bodyHex) {
            String fallback = dark ? "#0e1c17" : "#ece2cb";
            String b = (barHex != null && !barHex.isEmpty()) ? barHex : fallback;
            String bg = (bodyHex != null && !bodyHex.isEmpty()) ? bodyHex : b;
            try {
                getSharedPreferences(PREFS_UI, MODE_PRIVATE).edit()
                        .putBoolean("dark", dark)
                        .putString("barHex", b)
                        .putString("bgHex", bg)
                        .apply();
            } catch (Exception ignored) {}
            applySystemBars(dark, b, bg);
        }

        @JavascriptInterface
        public void setOrientation(final String mode) {
            runOnUiThread(new Runnable() {
                @Override
                public void run() {
                    if ("landscape".equals(mode)) {
                        setRequestedOrientation(ActivityInfo.SCREEN_ORIENTATION_SENSOR_LANDSCAPE);
                    } else if ("portrait".equals(mode)) {
                        setRequestedOrientation(ActivityInfo.SCREEN_ORIENTATION_PORTRAIT);
                    } else {
                        setRequestedOrientation(ActivityInfo.SCREEN_ORIENTATION_UNSPECIFIED);
                    }
                }
            });
        }

        @JavascriptInterface
        public void vibrateMs(int ms) {
            if (ms <= 0) return;
            int clamped = Math.min(Math.max(ms, 6), 200);
            Vibrator v = getVibrator();
            if (v != null && v.hasVibrator()) {
                int amp = v.hasAmplitudeControl() ? Math.min(255, 70 + clamped * 4) : VibrationEffect.DEFAULT_AMPLITUDE;
                v.vibrate(VibrationEffect.createOneShot(clamped, amp));
            }
        }
    }
}
