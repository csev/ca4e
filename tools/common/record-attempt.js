/**
 * POST to Tsugi to increment lti_result.attempts (board / analytics).
 * Requires window.CA4E_RECORD_ATTEMPT_URL from PHP addSession(.../api/record-attempt.php).
 */
(function (global) {
    if (global.recordAttemptToLMS) {
        return;
    }
    global.recordAttemptToLMS = function recordAttemptToLMS() {
        var url = global.CA4E_RECORD_ATTEMPT_URL;
        if (!url) {
            return;
        }
        var fd = new FormData();
        fetch(url, { method: 'POST', body: fd, credentials: 'same-origin' }).catch(function () {});
    };
})(typeof window !== 'undefined' ? window : this);
