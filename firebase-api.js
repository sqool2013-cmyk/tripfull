/**
 * ============================================================================
 * Tripfull v0.2.0 - Firebase Realtime Database & 무유출 인증 모듈 (firebase-api.js)
 * ============================================================================
 * 역할:
 *  1. Firebase App / Auth / Realtime Database 초기화 (neit-pc-default-rtdb)
 *  2. 최상위 디렉토리 'tripfull/' 하위 profiles, trips 실시간 구독 및 CRUD
 *  3. 무유출(Zero-Download) 해시 경로 인증:
 *     - 비밀번호 해시를 공개 프로필(tripfull/profiles)에서 완전히 분리
 *     - tripfull/secrets/{userKey}/{safeHashKey} 경로 일치 여부만 조회하여
 *       틀린 비밀번호 입력 시 정답 해시값이 브라우저로 단 1바이트도 내려오지 않음
 *  4. 구버전 계정(pin 또는 pinHash 보유) 로그인 시 무유출 구조로 자동 무중단 이관
 *  5. authVersion 기반 세션 무결성 관리 (비번 변경/계정 삭제 시 타 기기 자동 로그아웃)
 *
 * ----------------------------------------------------------------------------
 * [권장 Firebase Realtime Database 보안 규칙 (기존 sakura 규칙 100% 유지)]
 * Firebase 콘솔 -> Realtime Database -> 규칙 탭에서 "tripfull" 블록만 아래처럼 교체하세요:
 *
 *   "tripfull": {
 *     "profiles": {
 *       ".read": true,
 *       ".write": true
 *     },
 *     "trips": {
 *       ".read": true,
 *       ".write": true
 *     },
 *     "secrets": {
 *       ".read": false,
 *       "$userKey": {
 *         ".read": false,
 *         ".write": true,
 *         "$hashKey": {
 *           ".read": true,
 *           ".write": true
 *         }
 *       }
 *     }
 *   }
 * ----------------------------------------------------------------------------
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

    /**
     * TripfullUtils 참조 헬퍼
     */
    function getUtils() {
        if (!global.TripfullUtils) {
            throw new Error('[TripfullAPI] utils.js가 먼저 로드되어야 합니다.');
        }
        return global.TripfullUtils;
    }

    /**
     * Firebase 앱 및 Realtime Database 인스턴스를 초기화합니다.
     * 익명 인증은 백그라운드에서 비차단으로 시도하며, 실패해도 RTDB 연결은 유지됩니다.
     */
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

            if (authInstance && typeof authInstance.signInAnonymously === 'function') {
                authInstance.signInAnonymously().catch(function () {
                    // 프로젝트에서 익명 인증이 꺼져 있어도 RTDB는 정상 동작하도록 무시
                });
            }
            return { auth: authInstance, rtdb: rtdbInstance };
        } catch (err) {
            console.error('[TripfullAPI] Firebase 초기화 실패:', err);
            throw err;
        }
    }

    /**
     * 초기화된 RTDB 인스턴스를 반환합니다.
     */
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
        } catch (e) {
            // iframe 스토리지 차단 환경 무시
        }
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
            // 로컬 캐시에도 평문 pin이나 pinHash는 절대 저장하지 않음
            const cleanCopy = Object.assign({}, userObj);
            delete cleanCopy.pin;
            delete cleanCopy.pinHash;
            global.localStorage.setItem(CACHE_USER, JSON.stringify(cleanCopy));
        } catch (e) {
            // iframe 스토리지 차단 환경 무시
        }
    }

    function clearCachedUser() {
        try {
            global.localStorage.removeItem(CACHE_USER);
        } catch (e) {}
    }

    // ========================================================================
    // 2. 실시간 구독 (tripfull/profiles, tripfull/trips)
    // ========================================================================

    /**
     * 전체 사용자 프로필 목록(tripfull/profiles)을 실시간 구독합니다.
     * @returns {function} 구독 해제(unsubscribe) 함수
     */
    function subscribeProfiles(onData, onError) {
        const rtdb = getRtdb();
        const ref = rtdb.ref(DB_ROOT + '/profiles');

        const handler = function (snapshot) {
            const val = snapshot.val() || {};
            saveCachedProfiles(val);
            if (typeof onData === 'function') onData(val);
        };
        const errHandler = function (err) {
            console.error('[TripfullAPI] profiles 구독 오류:', err);
            if (typeof onError === 'function') onError(err);
        };

        ref.on('value', handler, errHandler);
        return function unsubscribe() {
            ref.off('value', handler);
        };
    }

    /**
     * 전체 여행 목록(tripfull/trips)을 실시간 구독합니다.
     * @returns {function} 구독 해제(unsubscribe) 함수
     */
    function subscribeTrips(onData, onError) {
        const rtdb = getRtdb();
        const ref = rtdb.ref(DB_ROOT + '/trips');

        const handler = function (snapshot) {
            const val = snapshot.val() || {};
            if (typeof onData === 'function') onData(val);
        };
        const errHandler = function (err) {
            console.error('[TripfullAPI] trips 구독 오류:', err);
            if (typeof onError === 'function') onError(err);
        };

        ref.on('value', handler, errHandler);
        return function unsubscribe() {
            ref.off('value', handler);
        };
    }

    // ========================================================================
    // 3. 무유출(Zero-Download) 비밀번호 저장 · 검증 · 자동 마이그레이션
    // ========================================================================

    /**
     * 사용자의 새 비밀번호를 무유출 보안 경로(tripfull/secrets/{userKey}/{safeHashKey})에 저장합니다.
     * 기존에 등록되어 있던 이전 해시 경로는 덮어쓰기(set)로 즉시 무효화됩니다.
     * @returns {Promise<{authVersion: number, safeKey: string}>}
     */
    async function setUserSecret(userKey, plainPin) {
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

    /**
     * 비밀번호 일치 여부를 검증합니다.
     * 1단계: 무유출 보안 경로(tripfull/secrets/{userKey}/{safeHashKey}) 직접 매칭 조회
     *        -> 틀린 비밀번호 입력 시 서버에서 null만 반환되며 정답 해시는 절대 다운로드되지 않음
     * 2단계: 구버전 계정(프로필에 pin 또는 pinHash 잔존)일 경우 호환 검증 후
     *        자동으로 tripfull/secrets로 이관하고 공개 프로필에서 pin/pinHash를 영구 삭제
     *
     * @returns {Promise<{ok: boolean, migrated: boolean, authVersion: number|null, cleanedProfile?: object}>}
     */
    async function verifyUserSecret(userKey, plainPin, profileObj) {
        const utils = getUtils();
        const rtdb = getRtdb();
        const cleanKey = utils.sanitizeKey(userKey || (profileObj && (profileObj.key || profileObj.name)));
        if (!cleanKey || !plainPin) {
            return { ok: false, migrated: false, authVersion: null };
        }

        const hashed = await utils.hashSecret(plainPin);
        const safeKey = utils.toSafeSecretKey(hashed);

        // 1) 무유출 보안 경로 단건 조회
        try {
            const snap = await rtdb.ref(DB_ROOT + '/secrets/' + cleanKey + '/' + safeKey).once('value');
            const val = snap.val();
            if (val && val.verified === true) {
                let authVer = (profileObj && profileObj.authVersion) || val.updatedAt || Date.now();
                let cleanedProfile = null;

                // 혹시 공개 프로필에 구버전 pin/pinHash가 남아있다면 즉시 정리
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

        // 2) 구버전 프로필 호환 검증 및 무유출 구조 자동 이관
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
                    // 이관 쓰기가 일시 실패했더라도 로그인 자체는 허용
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

    /**
     * 사용자 프로필을 tripfull/profiles/{userKey}에 저장합니다.
     */
    async function saveProfile(userKey, profileObj) {
        const utils = getUtils();
        const rtdb = getRtdb();
        const cleanKey = utils.sanitizeKey(userKey);
        if (!cleanKey || !profileObj) return null;

        const payload = Object.assign({}, profileObj, { key: cleanKey });
        // 이미 무유출 모드로 전환된 계정이라면 pin/pinHash가 실수로 섞이지 않도록 차단
        if (payload.secretMode === 'zero-download') {
            delete payload.pin;
            delete payload.pinHash;
        }

        await rtdb.ref(DB_ROOT + '/profiles/' + cleanKey).set(payload);
        return payload;
    }

    /**
     * 신규 계정을 무유출 보안 방식으로 생성합니다.
     */
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

    /**
     * 사용자 비밀번호를 변경합니다 (본인 프로필 수정 및 관리자 재설정 공용).
     * secrets 경로 덮어쓰기 + 프로필의 authVersion 갱신 + 레거시 pin/pinHash 제거를 일괄 처리합니다.
     */
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

    /**
     * 사용자 계정의 프로필과 비밀 해시 노드를 모두 영구 삭제합니다.
     */
    async function deleteProfile(userKey) {
        const utils = getUtils();
        const rtdb = getRtdb();
        const cleanKey = utils.sanitizeKey(userKey);
        if (!cleanKey) return;

        await Promise.all([
            rtdb.ref(DB_ROOT + '/profiles/' + cleanKey).remove(),
            rtdb.ref(DB_ROOT + '/secrets/' + cleanKey).remove().catch(function () {})
        ]);
    }

    /**
     * 여행 데이터 전체를 tripfull/trips/{tripId}에 저장합니다.
     */
    async function saveTrip(tripObj) {
        if (!tripObj || !tripObj.id) return null;
        const rtdb = getRtdb();
        const payload = Object.assign({}, tripObj, { updatedAt: Date.now() });
        await rtdb.ref(DB_ROOT + '/trips/' + tripObj.id).set(payload);
        return payload;
    }

    /**
     * 특정 여행을 tripfull/trips/{tripId}에서 영구 삭제합니다.
     */
    async function deleteTrip(tripId) {
        if (!tripId) return;
        const rtdb = getRtdb();
        await rtdb.ref(DB_ROOT + '/trips/' + tripId).remove();
    }

    // 전역 네임스페이스 등록
    global.TripfullAPI = {
        DB_ROOT: DB_ROOT,
        init: init,
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
        deleteTrip: deleteTrip
    };
})(window);
