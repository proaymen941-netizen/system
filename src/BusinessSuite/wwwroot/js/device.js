window.deviceFingerprint = {
    get: function () {
        try {
            var key = 'bs_device_fp';
            var fp = localStorage.getItem(key);
            if (!fp) {
                fp = (crypto && crypto.randomUUID) ? crypto.randomUUID().replace(/-/g, '') : (Date.now().toString(36) + Math.random().toString(36).substr(2, 9));
                fp = fp.toUpperCase().substr(0, 32);
                localStorage.setItem(key, fp);
            }
            return fp;
        } catch (e) {
            return 'NO-STORAGE-' + Math.random().toString(36).substr(2, 12).toUpperCase();
        }
    },
    getDeviceName: function () {
        var ua = navigator.userAgent;
        var os = 'كمبيوتر';
        if (/Windows/.test(ua)) os = 'Windows';
        else if (/Mac/.test(ua)) os = 'Mac';
        else if (/Android/.test(ua)) os = 'Android';
        else if (/iPhone|iPad/.test(ua)) os = 'iOS';
        else if (/Linux/.test(ua)) os = 'Linux';
        return os + ' - ' + (navigator.language || 'ar');
    },
    getUserAgent: function () {
        return navigator.userAgent || '';
    },
    reset: function () {
        try { localStorage.removeItem('bs_device_fp'); } catch (e) { }
        return true;
    }
};
