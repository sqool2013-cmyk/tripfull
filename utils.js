/**
 * ============================================================================
 * Tripfull v0.2.2 - 공통 유틸리티 모듈 (utils.js)
 * ============================================================================
 * 역할:
 *  1. presets.json 마스터 데이터 보관 및 안전한 폴백 제공
 *  2. Firebase 키 정제 및 SHA-256 단방향 해시 / 무유출 경로 키 생성
 *  3. 한국식 날짜 표기(yyyy. m. d.(요일) / m. d.(요일)), D-Day 배지 및 여행 일차 계산
 *  4. 2026. 7. 1. 행정체제 개편(영종구·제물포구·검단구·서해구, 전남광주통합특별시) 주소 정제
 *  5. OpenStreetMap 주소 검색 및 구글 지도 단일 위치·구간 길찾기·전체 동선 URL 생성
 *  6. 초대코드 생성, 일정 시간순 정렬, 예약 URL 안전 검증, CSV 다운로드, 영수증 이미지 압축
 * ============================================================================
 */
(function (global) {
    'use strict';

    // presets.json 로드 전/실패 시에도 앱이 깨지지 않도록 최소 기본값 유지
    const FALLBACK_PRESETS = {
        schemaVersion: '0.2.2',
        daysKr: ['일', '월', '화', '수', '목', '금', '토'],
        avatarOptions: [
            '✈️', '🛫', '🚄', '🚗', '🚌', '🚢',
            '⛴️', '🚠', '🚲', '🎈', '🧳', '🎒',
            '🗺️', '🧭', '📸', '🎫', '🕶️', '👒',
            '🏖️', '🏝️', '⛰️', '🗻', '⛺', '🏙️',
            '🗼', '🗽', '🏰', '🎡', '⛩️', '🌅',
            '🍜', '🍣', '☕', '🍻', '🛍️', '🌟'
        ],
        },
        currencies: {
            KRW: { symbol: '₩', name: '대한민국 원 (KRW)', unit: 1, defaultRate: 1 },
            JPY: { symbol: '¥', name: '일본 엔 (JPY)', unit: 100, defaultRate: 905 },
            USD: { symbol: '$', name: '미국 달러 (USD)', unit: 1, defaultRate: 1380 }
        },
        countryPresets: {
            '대한민국': {
                cities: ['서울', '제주', '부산'],
                currency: 'KRW',
                tzOffset: 9,
                tzDiffLabel: '한국 표준시 (KST)',
                voltage: '220V (60Hz)',
                emergency: '경찰 112 / 구급 119',
                presets: ['신분증 확인', '숙소 예약 확인', '충전기']
            },
            '직접 입력': {
                cities: ['직접 입력'],
                currency: 'USD',
                tzOffset: null,
                tzDiffLabel: '',
                voltage: '',
                emergency: '영사콜센터 +82-2-3210-0404',
                presets: ['여권 및 항공권 확인', '결제 수단 준비', '로밍 / eSIM 준비']
            }
        },
        addressRules: {
            stripCountries: ['대한민국', '한국', '일본', '미국', '베트남', '태국', '대만', '싱가포르', '호주', 'South Korea', 'Japan', 'USA'],
            jeonnamGwangjuAliases: ['전라남도', '광주광역시', '광주시', '전남'],
            incheonYeongjongKeywords: ['운서', '영종', '중산', '운북', '운남', '남북', '을왕', '덕교', '무의', '공항대로', '제2터미널대로'],
            incheonGeomdanKeywords: ['검단', '당하', '원당', '마전', '불로', '대곡', '오류', '왕길', '아라']
        }
    };

    let activePresets = FALLBACK_PRESETS;

    /**
     * presets.json 데이터를 로드하고 메모리에 등록합니다.
     * @param {string} url - presets.json 경로 (기본 './presets.json')
     * @returns {Promise<object>} 로드된 프리셋 객체
     */
    async function loadPresets(url) {
        const targetUrl = url || './presets.json?v=0.2.2';
        try {
            const res = await fetch(targetUrl, { cache: 'no-cache' });
            if (!res.ok) throw new Error('HTTP ' + res.status);
            const data = await res.json();
            if (data && data.countryPresets && data.currencies) {
                activePresets = Object.assign({}, FALLBACK_PRESETS, data);
            }
        } catch (err) {
            console.warn('[TripfullUtils] presets.json 로드 실패, 내장 폴백 사용:', err);
        }
        return activePresets;
    }

    /**
     * 현재 활성화된 프리셋 데이터를 반환합니다.
     */
    function getPresets() {
        return activePresets;
    }

    /**
     * 외부에서 직접 프리셋 객체를 주입할 때 사용합니다.
     */
    function setPresets(data) {
        if (data && typeof data === 'object') {
            activePresets = Object.assign({}, FALLBACK_PRESETS, data);
        }
    }

    // ========================================================================
    // 1. 키 정제 및 비밀번호 해시 유틸리티
    // ========================================================================

    /**
     * Firebase Realtime Database 노드 키에 금지된 문자(., #, $, /, [, ], 공백)를 치환합니다.
     */
    function sanitizeKey(str) {
        if (!str) return '';
        return String(str).trim().toLowerCase().replace(/[.#$/[\]\s]/g, '_');
    }

    /**
     * 비밀번호를 SHA-256 단방향 해시 문자열('sha256:...')로 변환합니다.
     * Web Crypto API 미지원 환경(비보안 HTTP 등)에서는 FNV-1a 폴백 해시를 사용합니다.
     */
    async function hashSecret(plainText) {
        const str = String(plainText || '').trim();
        if (global.crypto && global.crypto.subtle) {
            try {
                const encoded = new TextEncoder().encode('tripfull_salt_' + str);
                const buf = await global.crypto.subtle.digest('SHA-256', encoded);
                const hex = Array.from(new Uint8Array(buf))
                    .map(function (b) { return b.toString(16).padStart(2, '0'); })
                    .join('');
                return 'sha256:' + hex;
            } catch (e) {
                console.warn('[TripfullUtils] SubtleCrypto 실패, 폴백 해시 사용');
            }
        }
        let h = 2166136261;
        for (let i = 0; i < str.length; i++) {
            h ^= str.charCodeAt(i);
            h = Math.imul(h, 16777619);
        }
        return 'fnv1a:' + (h >>> 0).toString(16);
    }

    /**
     * 무유출(Zero-download) RTDB 경로(/tripfull/secrets/{userKey}/{secretKey})에
     * 안전하게 사용할 수 있도록 콜론(:) 등을 언더스코어(_)로 치환한 키를 반환합니다.
     */
    function toSafeSecretKey(hashStr) {
        if (!hashStr) return '';
        return String(hashStr).replace(/[^a-zA-Z0-9_-]/g, '_');
    }

    /**
     * 구버전 프로필(pin 또는 pinHash 보유) 검증용 헬퍼 (무유출 구조 자동 이관 시 사용)
     */
    async function verifyLegacySecret(inputPlain, profileObj) {
        if (!profileObj) return false;
        const cleanInput = String(inputPlain || '').trim();
        if (profileObj.pinHash) {
            const hashed = await hashSecret(cleanInput);
            if (hashed === profileObj.pinHash) return true;
        }
        if (profileObj.pin !== undefined && String(profileObj.pin) === cleanInput) {
            return true;
        }
        return false;
    }

    // ========================================================================
    // 2. 날짜, 시차 및 여행 일차 계산 유틸리티
    // ========================================================================

    /**
     * 로컬 타임존 기준 오늘 날짜를 'YYYY-MM-DD' 형식으로 반환합니다.
     * (toISOString()의 UTC 시차로 인해 자정~오전 9시 사이에 어제 날짜가 나오는 버그 방지)
     */
    function getTodayIso() {
        const now = new Date();
        const y = now.getFullYear();
        const m = String(now.getMonth() + 1).padStart(2, '0');
        const d = String(now.getDate()).padStart(2, '0');
        return y + '-' + m + '-' + d;
    }

    /**
     * 'YYYY-MM-DD' 문자열을 'yyyy. m. d.(요일)' 또는 'm. d.(요일)' 형식으로 변환합니다.
     */
    function formatDateDot(dateStr, includeYear) {
        if (includeYear === undefined) includeYear = true;
        if (!dateStr) return '날짜 선택';
        const parts = String(dateStr).split('-');
        if (parts.length !== 3) return dateStr;
        const y = parseInt(parts[0], 10);
        const m = parseInt(parts[1], 10);
        const d = parseInt(parts[2], 10);
        if (isNaN(y) || isNaN(m) || isNaN(d)) return dateStr;
        const dt = new Date(y, m - 1, d);
        const daysKr = activePresets.daysKr || FALLBACK_PRESETS.daysKr;
        const dayName = daysKr[dt.getDay()];
        return includeYear
            ? y + '. ' + m + '. ' + d + '.(' + dayName + ')'
            : m + '. ' + d + '.(' + dayName + ')';
    }

    /**
     * 출발일 기준 N일차의 날짜를 'm. d.(요일)' 형식으로 반환합니다.
     */
    function getDayDateDot(startDateStr, dayNum, includeYear) {
        if (includeYear === undefined) includeYear = false;
        if (!startDateStr) return '';
        const parts = String(startDateStr).split('-');
        if (parts.length !== 3) return '';
        const dt = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
        dt.setDate(dt.getDate() + (Number(dayNum) - 1));
        const y = dt.getFullYear();
        const m = dt.getMonth() + 1;
        const d = dt.getDate();
        const daysKr = activePresets.daysKr || FALLBACK_PRESETS.daysKr;
        const dayName = daysKr[dt.getDay()];
        return includeYear
            ? y + '. ' + m + '. ' + d + '.(' + dayName + ')'
            : m + '. ' + d + '.(' + dayName + ')';
    }

    /**
     * 여행 기간(startDate ~ endDate) 및 기존 등록 일정 일차를 종합해
     * [1, 2, 3, ...] 형태의 일차 배열을 생성합니다.
     */
    function getTripDayNumbers(tripObj) {
        if (!tripObj) return [1];
        let diffDays = 1;
        if (tripObj.startDate && tripObj.endDate) {
            const sParts = String(tripObj.startDate).split('-').map(Number);
            const eParts = String(tripObj.endDate).split('-').map(Number);
            if (sParts.length === 3 && eParts.length === 3) {
                const s = new Date(sParts[0], sParts[1] - 1, sParts[2]);
                const e = new Date(eParts[0], eParts[1] - 1, eParts[2]);
                const calc = Math.round((e - s) / 86400000) + 1;
                if (!isNaN(calc) && calc >= 1) {
                    diffDays = Math.min(30, calc);
                }
            }
        }
        const existingKeys = Object.keys(tripObj.itinerary || {})
            .map(Number)
            .filter(function (n) { return !isNaN(n) && n > 0; });
        const maxDay = Math.max(diffDays, existingKeys.length ? Math.max.apply(null, existingKeys) : 1);
        const arr = [];
        for (let i = 1; i <= maxDay; i++) arr.push(i);
        return arr;
    }

    /**
     * 여행 출발일·도착일과 오늘 날짜(로컬 기준)를 비교해 D-Day / 진행 상태 배지를 반환합니다.
     * @returns {{ label: string, tone: 'upcoming'|'active'|'done' } | null}
     */
    function getTripStatusBadge(tripObj) {
        if (!tripObj || !tripObj.startDate) return null;
        const sParts = String(tripObj.startDate).split('-').map(Number);
        const eParts = String(tripObj.endDate || tripObj.startDate).split('-').map(Number);
        const tParts = getTodayIso().split('-').map(Number);
        if (sParts.length !== 3 || eParts.length !== 3 || tParts.length !== 3) return null;

        const startDt = new Date(sParts[0], sParts[1] - 1, sParts[2]);
        const endDt = new Date(eParts[0], eParts[1] - 1, eParts[2]);
        const todayDt = new Date(tParts[0], tParts[1] - 1, tParts[2]);
        if (isNaN(startDt.getTime()) || isNaN(endDt.getTime())) return null;

        const diffToStart = Math.round((startDt - todayDt) / 86400000);
        const diffFromEnd = Math.round((todayDt - endDt) / 86400000);

        if (diffToStart > 0) {
            return { label: 'D-' + diffToStart, tone: 'upcoming' };
        }
        if (diffFromEnd > 0) {
            return { label: '여행 완료', tone: 'done' };
        }
        const dayIdx = Math.round((todayDt - startDt) / 86400000) + 1;
        if (dayIdx === 1) {
            return {
                label: tripObj.startDate === tripObj.endDate ? 'D-DAY' : 'D-DAY · 1일차',
                tone: 'active'
            };
        }
        return { label: '여행 ' + dayIdx + '일차', tone: 'active' };
    }

    /**
     * 여행 객체에서 국가 메타데이터(통화, 시차, 전압, 긴급연락처)를 추론합니다.
     */
    function detectCountryMeta(tripObj) {
        const presets = activePresets.countryPresets || FALLBACK_PRESETS.countryPresets;
        if (!tripObj) return presets['대한민국'] || presets['직접 입력'];
        if (tripObj.country && presets[tripObj.country]) {
            return presets[tripObj.country];
        }
        const dest = tripObj.destination || '';
        const entries = Object.entries(presets);
        for (let i = 0; i < entries.length; i++) {
            const cName = entries[i][0];
            const meta = entries[i][1];
            if (cName === '직접 입력') continue;
            if (dest.indexOf(cName) !== -1) return meta;
            if (Array.isArray(meta.cities) && meta.cities.some(function (city) { return dest.indexOf(city) !== -1; })) {
                return meta;
            }
        }
        return presets['직접 입력'];
    }

    /**
     * 현재 한국 시각(KST) 및 여행지 현지 시각·가이드 정보를 계산합니다.
     */
    function getLocalTimeInfo(tripObj, nowTick) {
        if (!tripObj) return null;
        const meta = detectCountryMeta(tripObj);
        const ts = nowTick || Date.now();
        let kstStr = '';
        try {
            kstStr = new Intl.DateTimeFormat('ko-KR', {
                timeZone: 'Asia/Seoul',
                hour: '2-digit',
                minute: '2-digit',
                hour12: false
            }).format(new Date(ts));
        } catch (e) {
            const d = new Date(ts);
            kstStr = String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
        }

        if (meta.tzOffset === null || meta.tzOffset === undefined) {
            return {
                kstStr: kstStr,
                localStr: null,
                diffLabel: '',
                voltage: meta.voltage || '',
                emergency: meta.emergency || ''
            };
        }

        const utcMs = ts + (new Date(ts).getTimezoneOffset() * 60000);
        const targetDate = new Date(utcMs + meta.tzOffset * 3600000);
        const hh = String(targetDate.getHours()).padStart(2, '0');
        const mm = String(targetDate.getMinutes()).padStart(2, '0');

        return {
            kstStr: kstStr,
            localStr: hh + ':' + mm,
            diffLabel: meta.tzDiffLabel || '',
            voltage: meta.voltage || '',
            emergency: meta.emergency || ''
        };
    }

    /**
     * JPY/VND 구버전 1단위 환율(예: 9.05)이 입력되어 있을 경우 통상 100단위(예: 905)로 보정합니다.
     */
    function normalizeRateValue(currency, val) {
        const currencies = activePresets.currencies || FALLBACK_PRESETS.currencies;
        const num = Number(val);
        if (!num || num <= 0) return (currencies[currency] && currencies[currency].defaultRate) || 1;
        if ((currency === 'JPY' || currency === 'VND') && num < 20) {
            return Number((num * 100).toFixed(2));
        }
        return num;
    }

    // ========================================================================
    // 3. 한국식 주소 정제 (2026. 7. 1. 행정구역 개편 반영) & 지도 링크
    // ========================================================================

    /**
     * Nominatim 역순 영미식 주소를 한국식(상위 -> 하위)으로 정리하고
     * 2026년 7월 1일 출범 행정구역(영종구·제물포구·검단구·서해구, 전남광주통합특별시)을 적용합니다.
     */
    function formatKoreanAddress(rawDisplayName, placeTitle) {
        if (!rawDisplayName) return '';
        const rules = activePresets.addressRules || FALLBACK_PRESETS.addressRules;
        const stripCountries = rules.stripCountries || [];
        const jgAliases = rules.jeonnamGwangjuAliases || ['전라남도', '광주광역시', '광주시', '전남'];
        const yjKeywords = rules.incheonYeongjongKeywords || [];
        const gdKeywords = rules.incheonGeomdanKeywords || [];

        let parts = String(rawDisplayName).split(',').map(function (s) { return s.trim(); }).filter(Boolean);
        // 우편번호 제거
        parts = parts.filter(function (p) { return !/^\d{3}-?\d{3,4}$/.test(p) && !/^\d{5,6}$/.test(p); });
        // 국가명 제거
        parts = parts.filter(function (p) { return stripCountries.indexOf(p) === -1; });
        // 첫 토큰이 장소명과 중복이면 제거
        if (parts.length > 1 && placeTitle && parts[0].toLowerCase() === String(placeTitle).trim().toLowerCase()) {
            parts.shift();
        }

        const reversed = parts.reverse();
        const joinedRaw = reversed.join(' ');
        const isIncheon = joinedRaw.indexOf('인천') !== -1;

        const hasAnyKeyword = function (text, list) {
            return list.some(function (kw) { return text.indexOf(kw) !== -1; });
        };

        const normalizeAdminToken = function (token) {
            const clean = token.trim();
            if (jgAliases.indexOf(clean) !== -1) {
                return '전남광주통합특별시';
            }
            if (isIncheon) {
                if (clean === '동구') return '제물포구';
                if (clean === '중구') {
                    return hasAnyKeyword(joinedRaw, yjKeywords) ? '영종구' : '제물포구';
                }
                if (clean === '서구') {
                    return hasAnyKeyword(joinedRaw, gdKeywords) ? '검단구' : '서해구';
                }
            }
            return clean;
        };

        const unique = [];
        reversed.forEach(function (p) {
            const normalized = normalizeAdminToken(p);
            if (unique.indexOf(normalized) === -1) unique.push(normalized);
        });

        // 도로명 주소(대로/로/길)가 포함되어 있으면 불필요한 법정동(동/읍/면/리/가) 생략
        const hasRoadName = unique.some(function (t) {
            return /(대로|로|길)$/.test(t) || /(대로|로|길)\d*번?길?$/.test(t);
        });
        const filtered = hasRoadName
            ? unique.filter(function (t) { return !/(동|읍|면|리|가)$/.test(t); })
            : unique;

        return filtered.join(' ');
    }

    /**
     * 기존에 저장된 주소 문자열도 표시 시 2026. 7. 1. 최신 행정구역 명칭으로 보정합니다.
     */
    function upgradeDisplayAddress(addrStr) {
        if (!addrStr) return '';
        let s = String(addrStr);
        s = s.replace(/인천광역시\s+중구(?=\s+(운서동\s+)?(공항대로|제2터미널대로|영종|운서|중산|을왕|무의))/g, '인천광역시 영종구');
        s = s.replace(/인천광역시\s+동구/g, '인천광역시 제물포구');
        s = s.replace(/^(전라남도|광주광역시)\s+/g, '전남광주통합특별시 ');
        return s;
    }

    /**
     * OpenStreetMap Nominatim API로 장소 주소를 검색합니다.
     * 도시 힌트와 함께 우선 검색하고, 결과가 없으면 장소명만으로 2차 폴백 검색합니다.
     */
    async function searchAddressNominatim(query, destHint) {
        const cleanQuery = String(query || '').trim();
        if (!cleanQuery) return [];
        const hint = String(destHint || '').trim();
        try {
            const q1 = hint ? (cleanQuery + ' ' + hint) : cleanQuery;
            const res1 = await fetch(
                'https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&q=' +
                encodeURIComponent(q1) + '&limit=5&accept-language=ko'
            );
            let data = await res1.json();
            if ((!Array.isArray(data) || data.length === 0) && hint) {
                const res2 = await fetch(
                    'https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&q=' +
                    encodeURIComponent(cleanQuery) + '&limit=5&accept-language=ko'
                );
                data = await res2.json();
            }
            return Array.isArray(data) ? data : [];
        } catch (err) {
            console.error('[TripfullUtils] 주소 검색 오류:', err);
            throw err;
        }
    }

    /**
     * 단일 장소 구글 지도 검색 URL 생성
     */
    function getSinglePlaceMapUrl(item, tripDestination) {
        if (!item) return '#';
        const query = item.address
            ? (item.place + ' ' + item.address)
            : (item.place + ' ' + (tripDestination || ''));
        return 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(query.trim());
    }

    /**
     * 특정 일차 전체 동선 구글 지도 길찾기 URL 생성
     */
    function getDayRouteMapUrl(dayNum, tripObj) {
        const list = (tripObj && tripObj.itinerary && tripObj.itinerary[dayNum]) || [];
        if (list.length === 0) return '#';
        if (list.length === 1) return getSinglePlaceMapUrl(list[0], tripObj.destination);

        const queries = list.map(function (item) {
            const q = item.address
                ? (item.place + ' ' + item.address)
                : (item.place + ' ' + (tripObj.destination || ''));
            return encodeURIComponent(q.trim());
        });
        const origin = queries[0];
        const destination = queries[queries.length - 1];
        const waypoints = queries.slice(1, -1).join('|');
        return 'https://www.google.com/maps/dir/?api=1&origin=' + origin +
            '&destination=' + destination +
            (waypoints ? '&waypoints=' + waypoints : '') +
            '&travelmode=transit';
    }

    /**
     * 인접한 두 일정 장소(A -> B) 간의 구글 지도 구간 길찾기 URL을 생성합니다.
     */
    function getLegRouteMapUrl(fromItem, toItem, tripDestination) {
        if (!fromItem || !toItem) return '#';
        const buildQuery = function (item) {
            const q = item.address
                ? (item.place + ' ' + item.address)
                : (item.place + ' ' + (tripDestination || ''));
            return encodeURIComponent(q.trim());
        };
        return 'https://www.google.com/maps/dir/?api=1&origin=' + buildQuery(fromItem) +
            '&destination=' + buildQuery(toItem) +
            '&travelmode=transit';
    }

    // ========================================================================
    // 4. 초대코드, 클립보드, 공유 요약문, 정렬, URL 검증, CSV 및 이미지 압축
    // ========================================================================
    // 4. 초대코드, 클립보드, 공유 요약문 생성 유틸리티
    // ========================================================================

    /**
     * 기존 여행들과 겹치지 않는 고유 초대코드('TRIP-XXXX')를 생성합니다.
     */
    function generateUniqueShareCode(allTripsMap) {
        const existingCodes = new Set(
            Object.values(allTripsMap || {})
                .map(function (t) { return t && t.shareCode; })
                .filter(Boolean)
        );
        let code = '';
        let tries = 0;
        do {
            code = 'TRIP-' + Math.floor(1000 + Math.random() * 9000);
            tries++;
        } while (existingCodes.has(code) && tries < 50);
        return code;
    }

    /**
     * 텍스트를 클립보드에 복사합니다. (구글 사이트 iframe 폴백 포함)
     * @returns {Promise<boolean>} 성공 여부
     */
    async function copyToClipboard(text) {
        if (navigator.clipboard && navigator.clipboard.writeText) {
            try {
                await navigator.clipboard.writeText(text);
                return true;
            } catch (e) {
                // iframe 권한 제한 시 폴백으로 진행
            }
        }
        try {
            const ta = document.createElement('textarea');
            ta.value = text;
            ta.style.position = 'fixed';
            ta.style.opacity = '0';
            document.body.appendChild(ta);
            ta.select();
            const ok = document.execCommand('copy');
            document.body.removeChild(ta);
            return Boolean(ok);
        } catch (err) {
            return false;
        }
    }

    /**
     * 카카오톡 공유용 깔끔한 일정 & 가계부(중간 정산 반영) 요약 텍스트를 생성합니다.
     */
    function generateCleanShareSummary(tripObj, budgetSummary) {
        if (!tripObj) return '';
        const categoryMeta = activePresets.categoryMeta || FALLBACK_PRESETS.categoryMeta;
        const companions = tripObj.companions || [];
        const itinerary = tripObj.itinerary || {};
        const dayNumbers = getTripDayNumbers(tripObj);

        let text = '✈️ [' + tripObj.title + ']\n';
        text += '📍 ' + tripObj.destination + ' (' + formatDateDot(tripObj.startDate, true) + ' ~ ' + formatDateDot(tripObj.endDate, true) + ')\n';
        if (tripObj.visibility !== 'private' && tripObj.shareCode) {
            text += '🔑 초대코드: ' + tripObj.shareCode + '\n';
        }
        text += '👥 멤버: ' + companions.map(function (c) { return (c.avatar || '') + c.name; }).join(', ') + '\n\n';

        dayNumbers.forEach(function (day) {
            const dateLabel = getDayDateDot(tripObj.startDate, day, false);
            text += '[' + day + '일차' + (dateLabel ? ' · ' + dateLabel : '') + ']\n';
            if (!itinerary[day] || itinerary[day].length === 0) {
                text += '- 일정 없음\n';
            } else {
                itinerary[day].forEach(function (item, idx) {
                    const timeLabel = item.time ? (item.endTime ? item.time + '~' + item.endTime : item.time) : '시각미정';
                    const catLabel = (categoryMeta[item.category] && categoryMeta[item.category].label) || '기타';
                    text += (idx + 1) + '. ' + timeLabel + ' ' + item.place + ' (' + catLabel + ')\n';
                });
            }
            text += '\n';
        });

        if (budgetSummary) {
            text += '💰 [가계부 정산]\n';
            text += '- 총 지출: ' + Number(budgetSummary.totalSpentKRW || 0).toLocaleString() + '원\n';
            if (budgetSummary.totalSettledKRW > 0) {
                text += '- 중간 정산 완료액: ' + Number(budgetSummary.totalSettledKRW).toLocaleString() + '원\n';
            }
            if (budgetSummary.transfers && budgetSummary.transfers.length > 0) {
                text += '📢 [남은 송금 안내]\n';
                budgetSummary.transfers.forEach(function (t) {
                    text += '👉 ' + t.from + ' ➔ ' + t.to + ': ' + Number(t.amount).toLocaleString() + '원\n';
                });
            } else {
                text += '- 모든 정산 완료 (주고받을 금액 없음)\n';
            }
        }
        return text;
    }

    /**
     * 예약 확인서·바우처·구글 드라이브 등 외부 참고 링크를 안전하게 정규화합니다.
     * (javascript:/data: 등 위험 프로토콜 차단, http(s) 누락 시 자동 보완)
     */
    function normalizeExternalUrl(rawUrl) {
        const trimmed = String(rawUrl || '').trim();
        if (!trimmed) return '';
        if (/^(javascript|data|vbscript):/i.test(trimmed)) return '';
        if (/^https?:\/\//i.test(trimmed)) return trimmed;
        return 'https://' + trimmed;
    }

    /**
     * 일차별 일정 목록을 방문 시각(HH:MM) 오름차순으로 안정 정렬합니다.
     * 시각이 비어 있는 일정은 기존 순서를 유지한 채 맨 아래에 배치합니다.
     */
    function sortItineraryItems(items) {
        if (!Array.isArray(items)) return [];
        return items
            .map(function (item, index) { return { item: item, index: index }; })
            .sort(function (a, b) {
                const tA = String((a.item && a.item.time) || '').trim();
                const tB = String((b.item && b.item.time) || '').trim();
                if (tA && tB) {
                    const cmp = tA.localeCompare(tB);
                    return cmp !== 0 ? cmp : (a.index - b.index);
                }
                if (tA && !tB) return -1;
                if (!tA && tB) return 1;
                return a.index - b.index;
            })
            .map(function (entry) { return entry.item; });
    }

    /**
     * 가계부 지출 내역 및 정산 요약을 한글 깨짐 없는 UTF-8 BOM CSV(엑셀) 파일로 내려받습니다.
     * @returns {boolean} 다운로드 성공 여부
     */
    function exportExpensesToCSV(tripObj, budgetSummary) {
        if (!tripObj) return false;
        try {
            const categoryMeta = activePresets.categoryMeta || FALLBACK_PRESETS.categoryMeta;
            const companions = Array.isArray(tripObj.companions)
                ? tripObj.companions
                : Object.values(tripObj.companions || {}).filter(Boolean);
            const expenses = Array.isArray(tripObj.expenses)
                ? tripObj.expenses
                : Object.values(tripObj.expenses || {}).filter(Boolean);
            const budgetApi = global.TripfullBudget;

            const esc = function (val) {
                const s = String(val === undefined || val === null ? '' : val);
                return '"' + s.replace(/"/g, '""') + '"';
            };

            const findCompName = function (cid) {
                const found = companions.find(function (c) { return c && c.id === cid; });
                return found ? found.name : '미지정';
            };

            const rows = [];
            rows.push([
                '시점', '날짜', '카테고리', '지출 항목명', '연동 장소',
                '결제 금액', '통화', '원화 환산(KRW)', '결제자', '정산 대상',
                '결제 수단', '영수증/링크', '기록자'
            ].map(esc).join(','));

            expenses.forEach(function (exp) {
                if (!exp) return;
                const expDay = Number(exp.day) || 0;
                const dayLabel = expDay === 0 ? '사전 지출' : (expDay + '일차');
                const dateLabel = expDay === 0 ? '' : getDayDateDot(tripObj.startDate, expDay, true);
                const catLabel = (categoryMeta[exp.category] && categoryMeta[exp.category].label) || '기타';
                const krw = (budgetApi && typeof budgetApi.toKRW === 'function')
                    ? budgetApi.toKRW(tripObj, exp.amount, exp.currency, expDay)
                    : Number(exp.amount || 0);
                const splitList = Array.isArray(exp.splitWith)
                    ? exp.splitWith
                    : Object.values(exp.splitWith || {}).filter(Boolean);
                const splitNames = splitList.map(findCompName).join(' / ');
                const methodLabel = exp.method === 'cash' ? '현금' : '카드';
                const receiptNote = exp.receiptUrl
                    ? exp.receiptUrl
                    : (exp.hasReceipt ? '앱 내 영수증 사진 첨부됨' : '');

                rows.push([
                    dayLabel,
                    dateLabel,
                    catLabel,
                    exp.title || '',
                    exp.linkedPlaceName || '',
                    Number(exp.amount || 0),
                    exp.currency || 'KRW',
                    krw,
                    findCompName(exp.payerId),
                    splitNames,
                    methodLabel,
                    receiptNote,
                    exp.updatedBy || ''
                ].map(esc).join(','));
            });

            if (budgetSummary) {
                rows.push('');
                rows.push(['[가계부 요약]', '총 지출(KRW)', Number(budgetSummary.totalSpentKRW || 0)].map(esc).join(','));
                rows.push(['[가계부 요약]', '중간 정산 완료액(KRW)', Number(budgetSummary.totalSettledKRW || 0)].map(esc).join(','));
                if (Array.isArray(budgetSummary.settlements) && budgetSummary.settlements.length > 0) {
                    rows.push('');
                    rows.push(['[중간 정산 이력]', '이체 날짜', '보낸 사람', '받은 사람', '송금액(KRW)', '메모'].map(esc).join(','));
                    budgetSummary.settlements.forEach(function (stl) {
                        rows.push([
                            '중간 정산',
                            stl.date || '',
                            findCompName(stl.fromId),
                            findCompName(stl.toId),
                            Number(stl.amountKRW || 0),
                            stl.memo || ''
                        ].map(esc).join(','));
                    });
                }
                if (Array.isArray(budgetSummary.transfers) && budgetSummary.transfers.length > 0) {
                    rows.push('');
                    rows.push(['[남은 송금 가이드]', '보낼 사람', '받을 사람', '남은 금액(KRW)'].map(esc).join(','));
                    budgetSummary.transfers.forEach(function (t) {
                        rows.push(['남은 정산', t.from, t.to, Number(t.amount || 0)].map(esc).join(','));
                    });
                }
            }

            const csvContent = '\uFEFF' + rows.join('\r\n');
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const safeTitle = String(tripObj.title || 'trip').replace(/[\\/:*?"<>|]/g, '_').slice(0, 30);
            const filename = 'Tripfull_' + safeTitle + '_' + getTodayIso() + '.csv';

            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
            return true;
        } catch (err) {
            console.error('[TripfullUtils] CSV 내보내기 실패:', err);
            return false;
        }
    }

    /**
     * 영수증 등 이미지 파일을 브라우저에서 초경량 JPEG Data URL(약 50~100KB)로 압축합니다.
     * 영수증 특성상 세로로 긴 이미지도 글자가 깨지지 않도록 최대 폭 900px, 최대 높이 1600px을 유지합니다.
     * @returns {Promise<{ dataUrl: string, sizeKB: number, width: number, height: number }>}
     */
    function compressImageToDataUrl(file, maxWidth, quality) {
        return new Promise(function (resolve, reject) {
            if (!file) {
                reject(new Error('이미지 파일이 선택되지 않았습니다.'));
                return;
            }
            const isImgType = !file.type || /^image\//i.test(file.type);
            if (!isImgType) {
                reject(new Error('이미지 파일(JPG, PNG, WEBP 등)만 첨부할 수 있습니다.'));
                return;
            }

            const targetMaxW = maxWidth || 900;
            const targetMaxH = 1600;
            const targetQuality = quality || 0.72;

            const reader = new FileReader();
            reader.onerror = function () {
                reject(new Error('이미지 파일을 읽는 중 오류가 발생했습니다.'));
            };
            reader.onload = function (ev) {
                const img = new Image();
                img.onerror = function () {
                    reject(new Error('이미지를 불러올 수 없습니다. 다른 사진으로 시도해주세요.'));
                };
                img.onload = function () {
                    try {
                        let w = img.naturalWidth || img.width;
                        let h = img.naturalHeight || img.height;
                        const scale = Math.min(1, targetMaxW / w, targetMaxH / h);
                        w = Math.max(1, Math.round(w * scale));
                        h = Math.max(1, Math.round(h * scale));

                        const canvas = document.createElement('canvas');
                        canvas.width = w;
                        canvas.height = h;
                        const ctx = canvas.getContext('2d');
                        // 투명 PNG 배경을 흰색으로 채워 영수증 가독성 유지
                        ctx.fillStyle = '#ffffff';
                        ctx.fillRect(0, 0, w, h);
                        ctx.drawImage(img, 0, 0, w, h);

                        let dataUrl = canvas.toDataURL('image/jpeg', targetQuality);
                        // 압축 후에도 320KB를 넘으면 한 번 더 경량화
                        if (dataUrl.length > 440000) {
                            dataUrl = canvas.toDataURL('image/jpeg', 0.52);
                        }
                        const approxBytes = Math.round((dataUrl.length * 3) / 4);
                        resolve({
                            dataUrl: dataUrl,
                            sizeKB: Math.max(1, Math.round(approxBytes / 1024)),
                            width: w,
                            height: h
                        });
                    } catch (cErr) {
                        reject(new Error('이미지 압축 처리에 실패했습니다.'));
                    }
                };
                img.src = ev.target.result;
            };
            reader.readAsDataURL(file);
        });
    }

    // 전역 네임스페이스 등록
    global.TripfullUtils = {
        loadPresets: loadPresets,
        getPresets: getPresets,
        setPresets: setPresets,
        sanitizeKey: sanitizeKey,
        hashSecret: hashSecret,
        toSafeSecretKey: toSafeSecretKey,
        verifyLegacySecret: verifyLegacySecret,
        getTodayIso: getTodayIso,
        formatDateDot: formatDateDot,
        getDayDateDot: getDayDateDot,
        getTripDayNumbers: getTripDayNumbers,
        getTripStatusBadge: getTripStatusBadge,
        detectCountryMeta: detectCountryMeta,
        getLocalTimeInfo: getLocalTimeInfo,
        normalizeRateValue: normalizeRateValue,
        formatKoreanAddress: formatKoreanAddress,
        upgradeDisplayAddress: upgradeDisplayAddress,
        searchAddressNominatim: searchAddressNominatim,
        getSinglePlaceMapUrl: getSinglePlaceMapUrl,
        getDayRouteMapUrl: getDayRouteMapUrl,
        getLegRouteMapUrl: getLegRouteMapUrl,
        generateUniqueShareCode: generateUniqueShareCode,
        copyToClipboard: copyToClipboard,
        generateCleanShareSummary: generateCleanShareSummary,
        normalizeExternalUrl: normalizeExternalUrl,
        sortItineraryItems: sortItineraryItems,
        exportExpensesToCSV: exportExpensesToCSV,
        compressImageToDataUrl: compressImageToDataUrl
    };
})(window);
