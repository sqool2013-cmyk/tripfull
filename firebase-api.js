/**
 * ============================================================================
 * Tripfull v0.2.2 - Firebase RTDB · 무유출 인증 · 영수증 지연 로딩 모듈 (firebase-api.js)
 * ============================================================================
 * 역할:
 *  1. Firebase App / Auth / Realtime Database 초기화 (neit-pc-default-rtdb)
 *  2. Google Sites iframe · iOS Safari · 학교 태블릿 완벽 호환을 위한
 *     메모리 전용(Persistence.NONE) 익명 인증 자동 대기(ensureAuthReady)
 *  3. 최상위 디렉토리 'tripfull/' 하위 profiles, trips 실시간 구독 및 CRUD
 *  4. 무유출(Zero-Download) 해시 경로 인증 (tripfull/secrets/{userKey}/{safeHashKey})
 *  5. [v0.2.2 신규] 가계부 영수증 이미지 분리 저장 및 지연 로딩:
 *     - 경로: tripfull/receipts/{tripId}/{expenseId}
 *     - 여행 데이터(trips)의 용량 증가 없이, 사용자가 영수증 보기를 눌렀을 때만 단건 조회
 *     - 지출 삭제 또는 여행 삭제 시 연결된 영수증 데이터도 함께 정리
 *
 * 의존성: firebase-app-compat, firebase-auth-compat, firebase-database-compat,
 *         window.TripfullUtils (utils.js)
 * 전역 노출: window.TripfullAPI
 * ============================================================================
 */
(function (global) {
    'use strict';

    const FIREBASE_CONFIG = {
        apiKey: "AIzaSyCsIXKvZt9PrES_opeCDYxaSLV02dWVVKA",
        authDomain: "neit-pc.firebaseapp.com",
        databaseURL: "https://neit-pc-default-rtdb.firebaseio.com",
        projectId: "neit-pc",
        storageBucket: "neit-pc.firebasestorage.app",
        messagingSenderId: "833154417780",
        appId: "1:833154417780:web:b94e8cb42751abdccdfd21",
        measurementId: "G-P4KHEVV98D"
    };

    const DB_ROOT = 'tripfull';
    const CACHE_PROFILES = 'tripfull_profiles_cache';
    const CACHE_USER = 'tripfull_active_user_cache';

    let authInstance = null;
    let rtdbInstance = null;
    let isInitialized = false;
    let authReadyPromise = null;

    function getUtils() {
        if (!global.TripfullUtils) {
            throw new Error('[TripfullAPI] utils.js가 먼저 로드되어야 합니다.');
        }
        return global.TripfullUtils;
    }

    function init() {
        if (isInitialized && rtdbInstance) {
            return { auth: authInstance, rtdb: rtdbInstance };
        }
        try {
            if (!global.firebase) {
                throw new Error('Firebase SDK가 로드되지 않았습니다.');
            }
            if (!global.firebase.apps.length) {
                global.firebase.initializeApp(FIREBASE_CONFIG);
            }
            authInstance = global.firebase.auth ? global.firebase.auth() : null;
            rtdbInstance = global.firebase.database();
            isInitialized = true;

            if (authInstance) {
                ensureAuthReady().catch(function () {});
            }
            return { auth: authInstance, rtdb: rtdbInstance };
        } catch (err) {
            console.error('[TripfullAPI] Firebase 초기화 실패:', err);
            throw err;
        }
    }

    function ensureAuthReady() {
        if (!isInitialized) init();
        if (!authInstance) return Promise.resolve(null);
        if (authInstance.currentUser) return Promise.resolve(authInstance.currentUser);
        if (authReadyPromise) return authReadyPromise;

        authReadyPromise = (async function () {
            try {
                if (
                    global.firebase &&
                    global.firebase.auth &&
                    global.firebase.auth.Auth &&
                    global.firebase.auth.Auth.Persistence &&
                    typeof authInstance.setPersistence === 'function'
                ) {
                    await authInstance.setPersistence(global.firebase.auth.Auth.Persistence.NONE);
                }
            } catch (pErr) {
                console.warn('[TripfullAPI] Persistence.NONE 설정 건너뜀:', pErr);
            }

            try {
                if (authInstance.currentUser) return authInstance.currentUser;
                const cred = await authInstance.signInAnonymously();
                return (cred && cred.user) || authInstance.currentUser || null;
            } catch (authErr) {
                console.error('[TripfullAPI] 익명 인증 발급 실패:', authErr);
                authReadyPromise = null;
                throw authErr;
            }
        })();

        return authReadyPromise;
    }

    function getRtdb() {
        if (!rtdbInstance) init();
        return rtdbInstance;
    }

    // ========================================================================
    // 1. 로컬 캐시(localStorage) 안전 접근 헬퍼
    // ========================================================================

    function getCachedProfiles() {
        try {
            const raw = global.localStorage.getItem(CACHE_PROFILES);
            const parsed = raw ? JSON.parse(raw) : {};
            return (parsed && typeof parsed === 'object') ? parsed : {};
        } catch (e) {
            return {};
        }
    }

    function saveCachedProfiles(profilesMap) {
        try {
            global.localStorage.setItem(CACHE_PROFILES, JSON.stringify(profilesMap || {}));
        } catch (e) {}
    }

    function getCachedUser() {
        try {
            const raw = global.localStorage.getItem(CACHE_USER);
            return raw ? JSON.parse(raw) : null;
        } catch (e) {
            return null;
        }
    }

    function saveCachedUser(userObj) {
        try {
            if (!userObj) {
                global.localStorage.removeItem(CACHE_USER);
                return;
            }
            const cleanCopy = Object.assign({}, userObj);
            delete cleanCopy.pin;
            delete cleanCopy.pinHash;
            global.localStorage.setItem(CACHE_USER, JSON.stringify(cleanCopy));
        } catch (e) {}
    }

    function clearCachedUser() {
        try {
            global.localStorage.removeItem(CACHE_USER);
        } catch (e) {}
    }

    // ========================================================================
    // 2. 실시간 구독 (tripfull/profiles, tripfull/trips)
    // ========================================================================

    function subscribeProfiles(onData, onError) {
        const rtdb = getRtdb();
        const ref = rtdb.ref(DB_ROOT + '/profiles');
        let isUnsubscribed = false;

        const handler = function (snapshot) {
            const val = snapshot.val() || {};
            saveCachedProfiles(val);
            if (typeof onData === 'function') onData(val);
        };
        const errHandler = function (err) {
            console.error('[TripfullAPI] profiles 구독 오류:', err);
            if (typeof onError === 'function') onError(err);
        };

        ensureAuthReady()
            .then(function () {
                if (isUnsubscribed) return;
                ref.on('value', handler, errHandler);
            })
            .catch(errHandler);

        return function unsubscribe() {
            isUnsubscribed = true;
            ref.off('value', handler);
        };
    }

    function subscribeTrips(onData, onError) {
        const rtdb = getRtdb();
        const ref = rtdb.ref(DB_ROOT + '/trips');
        let isUnsubscribed = false;

        const handler = function (snapshot) {
            const val = snapshot.val() || {};
            if (typeof onData === 'function') onData(val);
        };
        const errHandler = function (err) {
            console.error('[TripfullAPI] trips 구독 오류:', err);
            if (typeof onError === 'function') onError(err);
        };

        ensureAuthReady()
            .then(function () {
                if (isUnsubscribed) return;
                ref.on('value', handler, errHandler);
            })
            .catch(errHandler);

        return function unsubscribe() {
            isUnsubscribed = true;
            ref.off('value', handler);
        };
    }

    // ========================================================================
    // 3. 무유출(Zero-Download) 비밀번호 저장 · 검증 · 자동 마이그레이션
    // ========================================================================

    async function setUserSecret(userKey, plainPin) {
        await ensureAuthReady();
        const utils = getUtils();
        const rtdb = getRtdb();
        const cleanKey = utils.sanitizeKey(userKey);
        if (!cleanKey) throw new Error('유효하지 않은 사용자 키입니다.');

        const hashed = await utils.hashSecret(plainPin);
        const safeKey = utils.toSafeSecretKey(hashed);
        const now = Date.now();

        const secretPayload = {};
        secretPayload[safeKey] = {
            verified: true,
            updatedAt: now
        };

        await rtdb.ref(DB_ROOT + '/secrets/' + cleanKey).set(secretPayload);
        return { authVersion: now, safeKey: safeKey };
    }

    async function verifyUserSecret(userKey, plainPin, profileObj) {
        await ensureAuthReady();
        const utils = getUtils();
        const rtdb = getRtdb();
        const cleanKey = utils.sanitizeKey(userKey || (profileObj && (profileObj.key || profileObj.name)));
        if (!cleanKey || !plainPin) {
            return { ok: false, migrated: false, authVersion: null };
        }

        const hashed = await utils.hashSecret(plainPin);
        const safeKey = utils.toSafeSecretKey(hashed);

        try {
            const snap = await rtdb.ref(DB_ROOT + '/secrets/' + cleanKey + '/' + safeKey).once('value');
            const val = snap.val();
            if (val && val.verified === true) {
                let authVer = (profileObj && profileObj.authVersion) || val.updatedAt || Date.now();
                let cleanedProfile = null;

                if (profileObj && (profileObj.pin !== undefined || profileObj.pinHash !== undefined || profileObj.secretMode !== 'zero-download')) {
                    cleanedProfile = Object.assign({}, profileObj, {
                        key: cleanKey,
                        secretMode: 'zero-download',
                        authVersion: authVer
                    });
                    delete cleanedProfile.pin;
                    delete cleanedProfile.pinHash;
                    await saveProfile(cleanKey, cleanedProfile);
                }

                return {
                    ok: true,
                    migrated: false,
                    authVersion: authVer,
                    cleanedProfile: cleanedProfile
                };
            }
        } catch (err) {
            console.warn('[TripfullAPI] secrets 경로 조회 중 예외:', err);
        }

        if (profileObj && (profileObj.pinHash !== undefined || profileObj.pin !== undefined)) {
            const legacyMatch = await utils.verifyLegacySecret(plainPin, profileObj);
            if (legacyMatch) {
                try {
                    const secretRes = await setUserSecret(cleanKey, plainPin);
                    const cleaned = Object.assign({}, profileObj, {
                        key: cleanKey,
                        secretMode: 'zero-download',
                        authVersion: secretRes.authVersion
                    });
                    delete cleaned.pin;
                    delete cleaned.pinHash;
                    await saveProfile(cleanKey, cleaned);

                    return {
                        ok: true,
                        migrated: true,
                        authVersion: secretRes.authVersion,
                        cleanedProfile: cleaned
                    };
                } catch (migErr) {
                    console.error('[TripfullAPI] 무유출 보안 자동 이관 실패:', migErr);
                    return {
                        ok: true,
                        migrated: false,
                        authVersion: profileObj.authVersion || Date.now()
                    };
                }
            }
        }

        return { ok: false, migrated: false, authVersion: null };
    }

    // ========================================================================
    // 4. 프로필 & 여행 CRUD 연산
    // ========================================================================

    async function saveProfile(userKey, profileObj) {
        await ensureAuthReady();
        const utils = getUtils();
        const rtdb = getRtdb();
        const cleanKey = utils.sanitizeKey(userKey);
        if (!cleanKey || !profileObj) return null;

        const payload = Object.assign({}, profileObj, { key: cleanKey });
        if (payload.secretMode === 'zero-download') {
            delete payload.pin;
            delete payload.pinHash;
        }

        await rtdb.ref(DB_ROOT + '/profiles/' + cleanKey).set(payload);
        return payload;
    }

    async function registerNewProfile(params) {
        const utils = getUtils();
        const cleanKey = utils.sanitizeKey(params.name);
        if (!cleanKey) throw new Error('아이디가 올바르지 않습니다.');

        const secretRes = await setUserSecret(cleanKey, params.pin);
        const newProf = {
            key: cleanKey,
            name: String(params.name).trim(),
            avatar: params.avatar || '✈️',
            isAdmin: Boolean(params.isAdmin),
            theme: params.theme || 'light',
            secretMode: 'zero-download',
            authVersion: secretRes.authVersion,
            joinedTripIds: [],
            createdAt: Date.now(),
            lastLoginAt: Date.now()
        };

        await saveProfile(cleanKey, newProf);
        return newProf;
    }

    async function updateUserPassword(userKey, newPlainPin, existingProfile) {
        const utils = getUtils();
        const cleanKey = utils.sanitizeKey(userKey);
        const secretRes = await setUserSecret(cleanKey, newPlainPin);

        const nextProfile = Object.assign({}, existingProfile || {}, {
            key: cleanKey,
            secretMode: 'zero-download',
            authVersion: secretRes.authVersion
        });
        delete nextProfile.pin;
        delete nextProfile.pinHash;

        await saveProfile(cleanKey, nextProfile);
        return nextProfile;
    }

    async function deleteProfile(userKey) {
        await ensureAuthReady();
        const utils = getUtils();
        const rtdb = getRtdb();
        const cleanKey = utils.sanitizeKey(userKey);
        if (!cleanKey) return;

        await Promise.all([
            rtdb.ref(DB_ROOT + '/profiles/' + cleanKey).remove(),
            rtdb.ref(DB_ROOT + '/secrets/' + cleanKey).remove().catch(function () {})
        ]);
    }

    async function saveTrip(tripObj) {
        await ensureAuthReady();
        if (!tripObj || !tripObj.id) return null;
        const rtdb = getRtdb();
        const payload = Object.assign({}, tripObj, { updatedAt: Date.now() });
        await rtdb.ref(DB_ROOT + '/trips/' + tripObj.id).set(payload);
        return payload;
    }

    async function deleteTrip(tripId) {
        await ensureAuthReady();
        if (!tripId) return;
        const rtdb = getRtdb();
        await Promise.all([
            rtdb.ref(DB_ROOT + '/trips/' + tripId).remove(),
            rtdb.ref(DB_ROOT + '/receipts/' + tripId).remove().catch(function () {})
        ]);
    }

    // ========================================================================
    // 5. [v0.2.2] 가계부 영수증 사진 분리 저장 · 지연 로딩 · 삭제
    // ========================================================================

    /**
     * 압축된 영수증 이미지를 tripfull/receipts/{tripId}/{expenseId}에 저장합니다.
     */
    async function saveReceipt(tripId, expenseId, receiptData) {
        await ensureAuthReady();
        if (!tripId || !expenseId || !receiptData || !receiptData.dataUrl) return null;
        const rtdb = getRtdb();
        const payload = {
            dataUrl: receiptData.dataUrl,
            sizeKB: Number(receiptData.sizeKB) || 0,
            width: Number(receiptData.width) || 0,
            height: Number(receiptData.height) || 0,
            uploadedBy: String(receiptData.uploadedBy || ''),
            uploadedAt: Date.now()
        };
        await rtdb.ref(DB_ROOT + '/receipts/' + tripId + '/' + expenseId).set(payload);
        return payload;
    }

    /**
     * 특정 지출 건의 영수증 이미지를 필요할 때만 단건 조회합니다(지연 로딩).
     */
    async function getReceipt(tripId, expenseId) {
        await ensureAuthReady();
        if (!tripId || !expenseId) return null;
        const rtdb = getRtdb();
        const snap = await rtdb.ref(DB_ROOT + '/receipts/' + tripId + '/' + expenseId).once('value');
        return snap.val() || null;
    }

    /**
     * 특정 지출 건의 영수증 이미지를 삭제합니다.
     */
    async function deleteReceipt(tripId, expenseId) {
        await ensureAuthReady();
        if (!tripId || !expenseId) return;
        const rtdb = getRtdb();
        await rtdb.ref(DB_ROOT + '/receipts/' + tripId + '/' + expenseId).remove().catch(function () {});
    }

    // 전역 네임스페이스 등록
    global.TripfullAPI = {
        DB_ROOT: DB_ROOT,
        init: init,
        ensureAuthReady: ensureAuthReady,
        getRtdb: getRtdb,
        getCachedProfiles: getCachedProfiles,
        saveCachedProfiles: saveCachedProfiles,
        getCachedUser: getCachedUser,
        saveCachedUser: saveCachedUser,
        clearCachedUser: clearCachedUser,
        subscribeProfiles: subscribeProfiles,
        subscribeTrips: subscribeTrips,
        setUserSecret: setUserSecret,
        verifyUserSecret: verifyUserSecret,
        saveProfile: saveProfile,
        registerNewProfile: registerNewProfile,
        updateUserPassword: updateUserPassword,
        deleteProfile: deleteProfile,
        saveTrip: saveTrip,
        deleteTrip: deleteTrip,
        saveReceipt: saveReceipt,
        getReceipt: getReceipt,
        deleteReceipt: deleteReceipt
    };
})(window);
